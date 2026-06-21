import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseClient() {
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * POST /api/upload/product-image
 *
 * Accepts multipart/form-data with a single `file` field.
 * Client should resize to WebP (~800×800) before upload when possible.
 *
 * Storage: Supabase `products` bucket when configured; otherwise returns a
 * compact data URL for self-hosted / dev (max ~512KB after client resize).
 */
export async function POST(request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
    if (!allowed.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported format. Allowed: JPEG, PNG, WebP, GIF' },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum upload size is 5MB.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const supabase = getSupabaseClient();

    if (!supabase) {
      if (buffer.length > 512 * 1024) {
        return NextResponse.json(
          {
            error:
              'Image storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, or upload a smaller image (under 512KB after resize).',
          },
          { status: 503 }
        );
      }
      const mime = file.type || 'image/webp';
      const dataUrl = `data:${mime};base64,${buffer.toString('base64')}`;
      return NextResponse.json({
        success: true,
        url: dataUrl,
        originalName: file.name,
        size: file.size,
        type: file.type,
        storage: 'inline',
      });
    }

    const uniqueName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = `images/${uniqueName}`;

    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('[upload/product-image] Supabase upload error:', uploadError);
      if (buffer.length <= 512 * 1024) {
        const mime = file.type || 'image/webp';
        return NextResponse.json({
          success: true,
          url: `data:${mime};base64,${buffer.toString('base64')}`,
          originalName: file.name,
          size: file.size,
          type: file.type,
          storage: 'inline-fallback',
        });
      }
      return NextResponse.json({ error: 'Failed to upload image to storage' }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage.from('products').getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
      originalName: file.name,
      size: file.size,
      type: file.type,
      storage: 'supabase',
    });
  } catch (error) {
    console.error('[upload/product-image] Error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

/**
 * GET /api/upload/product-image?q=product+name&category=retail
 *
 * Auto-fetch a relevant product image from Unsplash by search query.
 * Returns a direct Unsplash CDN URL (no API key needed for source.unsplash.com).
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();
    const category = searchParams.get('category')?.trim() || '';

    if (!q) {
      return NextResponse.json({ error: 'Search query required' }, { status: 400 });
    }

    // Build a clean search term
    const terms = [q, category].filter(Boolean).join(' ');
    const encoded = encodeURIComponent(terms);

    // Unsplash Source API — no auth needed, returns redirect to a CDN image
    // We use a fixed 800×800 size, optimized for product cards
    const unsplashUrl = `https://source.unsplash.com/800x800/?${encoded}`;

    // Resolve the redirect to get the final stable CDN URL
    const res = await fetch(unsplashUrl, { method: 'HEAD', redirect: 'follow' });
    const finalUrl = res.url;

    if (!finalUrl || finalUrl.includes('unsplash.com/photo/') === false) {
      // Fallback: try with just product name
      const fallbackUrl = `https://source.unsplash.com/800x800/?${encodeURIComponent(q)}`;
      return NextResponse.json({ success: true, url: fallbackUrl, source: 'unsplash' });
    }

    return NextResponse.json({ success: true, url: finalUrl, source: 'unsplash' });
  } catch (error) {
    console.error('[upload/product-image GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
  }
}
