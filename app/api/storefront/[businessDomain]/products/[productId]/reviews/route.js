import { NextResponse } from 'next/server';
import pool from '@/lib/db';

/**
 * GET  /api/storefront/[businessDomain]/products/[productId]/reviews
 * POST /api/storefront/[businessDomain]/products/[productId]/reviews
 */

export async function GET(request, { params }) {
  const { productId } = await params;
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 10;
  const offset = (page - 1) * limit;

  const client = await pool.connect();
  try {
    // Try product_reviews table; gracefully return empty if it doesn't exist
    let rows = [];
    let total = 0;
    try {
      const countRes = await client.query(
        `SELECT COUNT(*) FROM product_reviews WHERE product_id = $1 AND is_approved = true`,
        [productId]
      );
      total = parseInt(countRes.rows[0].count);

      const res = await client.query(
        `SELECT id, reviewer_name, rating, title, body, helpful_count, created_at
         FROM product_reviews
         WHERE product_id = $1 AND is_approved = true
         ORDER BY helpful_count DESC, created_at DESC
         LIMIT $2 OFFSET $3`,
        [productId, limit, offset]
      );
      rows = res.rows;
    } catch (e) {
      if (e.code !== '42P01') throw e; // ignore "table does not exist"
    }

    return NextResponse.json({ reviews: rows, total, page, hasMore: total > page * limit });
  } catch (error) {
    console.error('[reviews GET]', error);
    return NextResponse.json({ reviews: [], total: 0 });
  } finally {
    client.release();
  }
}

export async function POST(request, { params }) {
  const { productId } = await params;
  const body = await request.json().catch(() => ({}));
  const { reviewerName, reviewerEmail, rating, title, body: reviewBody } = body;

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
  }
  if (!reviewerName?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    try {
      await client.query(
        `INSERT INTO product_reviews
           (product_id, reviewer_name, reviewer_email, rating, title, body, is_approved, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, false, NOW())`,
        [productId, reviewerName.trim(), reviewerEmail?.trim() || null, rating, title?.trim() || null, reviewBody?.trim() || null]
      );
    } catch (e) {
      if (e.code !== '42P01') throw e;
      // Table doesn't exist — silently succeed
    }

    return NextResponse.json({ success: true, message: 'Review submitted for moderation' });
  } catch (error) {
    console.error('[reviews POST]', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  } finally {
    client.release();
  }
}
