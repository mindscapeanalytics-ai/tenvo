import { NextResponse } from 'next/server';
import { fetchBusinessByDomain } from '@/lib/storefront/fetchBusinessByDomain';
import pool from '@/lib/db';

export async function POST(request, { params }) {
  const { businessDomain } = await params;

  try {
    const body = await request.json();
    const { email } = body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const bizResult = await fetchBusinessByDomain(businessDomain);
    if (!bizResult.success) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const businessId = bizResult.business.id;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Try newsletter_subscribers table first (graceful creation if missing)
      // Use SAVEPOINT to handle table creation without aborting the transaction
      await client.query('SAVEPOINT before_newsletter_insert');
      
      try {
        await client.query(
          `INSERT INTO newsletter_subscribers (business_id, email, subscribed_at, status, created_at, updated_at)
           VALUES ($1::uuid, $2, NOW(), 'active', NOW(), NOW())
           ON CONFLICT (business_id, email)
           DO UPDATE SET status = 'active', updated_at = NOW()`,
          [businessId, email.toLowerCase().trim()]
        );
        await client.query('RELEASE SAVEPOINT before_newsletter_insert');
      } catch (insertErr) {
        if (insertErr.code === '42P01') {
          // Table doesn't exist, rollback to savepoint and create it
          await client.query('ROLLBACK TO SAVEPOINT before_newsletter_insert');
          
          await client.query(`
            CREATE TABLE IF NOT EXISTS newsletter_subscribers (
              id SERIAL PRIMARY KEY,
              business_id UUID NOT NULL,
              email TEXT NOT NULL,
              status TEXT NOT NULL DEFAULT 'active',
              subscribed_at TIMESTAMPTZ DEFAULT NOW(),
              created_at TIMESTAMPTZ DEFAULT NOW(),
              updated_at TIMESTAMPTZ DEFAULT NOW(),
              UNIQUE (business_id, email)
            )
          `);
          
          // Retry INSERT after table creation
          await client.query(
            `INSERT INTO newsletter_subscribers (business_id, email, subscribed_at, status, created_at, updated_at)
             VALUES ($1::uuid, $2, NOW(), 'active', NOW(), NOW())
             ON CONFLICT (business_id, email)
             DO UPDATE SET status = 'active', updated_at = NOW()`,
            [businessId, email.toLowerCase().trim()]
          );
          
          await client.query('RELEASE SAVEPOINT before_newsletter_insert');
        } else {
          throw insertErr;
        }
      }

      await client.query('COMMIT');
      return NextResponse.json({ success: true, message: 'Subscribed successfully' });
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch {
        /* ignore rollback errors */
      }
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[newsletter/subscribe] Error:', error);
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}
