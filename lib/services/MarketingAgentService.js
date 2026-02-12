import pool from '@/lib/db';
import { createModuleLogger } from './logging/logger';
import { recordAuditLog } from './audit/auditService';

const log = createModuleLogger('marketing');

/**
 * MarketingAgentService
 * 
 * Orchestrates target segmentation and automated marketing campaigns.
 * Uses the customer_segments, campaigns, and campaign_messages models.
 */
export const MarketingAgentService = {
    /**
     * Create a customer segment based on rules
     */
    async createSegment(businessId, name, rules, isDynamic = true) {
        const client = await pool.connect();
        try {
            const res = await client.query(`
                INSERT INTO customer_segments (id, business_id, name, rules, is_dynamic, updated_at)
                VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())
                RETURNING id
            `, [businessId, name, JSON.stringify(rules), isDynamic]);

            const segmentId = res.rows[0].id;

            await recordAuditLog(businessId, {
                action: 'CREATE_SEGMENT',
                entity_type: 'customer_segment',
                entity_id: segmentId,
                description: `Created segment: ${name}`
            });

            return segmentId;
        } finally {
            client.release();
        }
    },

    /**
     * Refresh a dynamic segment by re-evaluating rules against customers
     */
    async refreshSegment(businessId, segmentId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const segmentRes = await client.query('SELECT * FROM customer_segments WHERE id = $1', [segmentId]);
            if (segmentRes.rows.length === 0) throw new Error('Segment not found');
            const segment = segmentRes.rows[0];

            // 1. Clear existing memberships
            await client.query('DELETE FROM segment_customers WHERE segment_id = $1', [segmentId]);

            // 2. Evaluate rules (Simplified for MVP)
            // Rules could be: { min_spend: 1000, last_order_days: 30, city: 'Karachi' }
            const rules = segment.rules;
            let query = `SELECT id FROM customers WHERE business_id = $1 AND is_deleted = false`;
            const params = [businessId];

            if (rules.city) {
                query += ` AND city = $${params.length + 1}`;
                params.push(rules.city);
            }

            if (rules.min_spend) {
                query += ` AND outstanding_balance + (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE customer_id = customers.id) >= $${params.length + 1}`;
                params.push(rules.min_spend);
            }

            const customersRes = await client.query(query, params);

            // 3. Insert new memberships
            for (const row of customersRes.rows) {
                await client.query(`
                    INSERT INTO segment_customers (id, segment_id, customer_id)
                    VALUES (gen_random_uuid(), $1, $2)
                `, [segmentId, row.id]);
            }

            await client.query('COMMIT');
            log.info('Segment refreshed', { businessId, segmentId, members: customersRes.rows.length });
            return customersRes.rows.length;
        } catch (error) {
            await client.query('ROLLBACK');
            log.error('Failed to refresh segment', { error, segmentId });
            throw error;
        } finally {
            client.release();
        }
    },

    /**
     * Create and queue a campaign
     */
    async createCampaign(businessId, data) {
        const client = await pool.connect();
        try {
            const { name, type, segment_id, template_id, scheduled_at, is_automated = false } = data;

            // 1. Create campaign record
            const res = await client.query(`
                INSERT INTO campaigns (id, business_id, name, type, segment_id, template_id, scheduled_at, is_automated, updated_at)
                VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW())
                RETURNING id
            `, [businessId, name, type, segment_id, template_id, scheduled_at, is_automated]);

            const campaignId = res.rows[0].id;

            // 2. If not scheduled for future, queue messages immediately
            if (!scheduled_at || new Date(scheduled_at) <= new Date()) {
                await this.queueCampaignMessages(businessId, campaignId);
            }

            return campaignId;
        } finally {
            client.release();
        }
    },

    /**
     * Queue messages for all customers in a segment for a campaign
     */
    async queueCampaignMessages(businessId, campaignId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const campaignRes = await client.query('SELECT segment_id FROM campaigns WHERE id = $1', [campaignId]);
            const segmentId = campaignRes.rows[0].segment_id;

            // Get all customers in segment
            const customersRes = await client.query(`
                SELECT customer_id FROM segment_customers WHERE segment_id = $1
            `, [segmentId]);

            for (const row of customersRes.rows) {
                await client.query(`
                    INSERT INTO campaign_messages (id, campaign_id, customer_id, status)
                    VALUES (gen_random_uuid(), $1, $2, 'pending')
                    ON CONFLICT DO NOTHING
                `, [campaignId, row.customer_id]);
            }

            await client.query('UPDATE campaigns SET status = $1, updated_at = NOW() WHERE id = $2', [
                scheduled_at ? 'scheduled' : 'active',
                campaignId
            ]);

            await client.query('COMMIT');
            log.info('Campaign messages queued', { campaignId, count: customersRes.rows.length });
        } catch (error) {
            await client.query('ROLLBACK');
            log.error('Failed to queue campaign messages', { error, campaignId });
            throw error;
        } finally {
            client.release();
        }
    },

    /**
     * AI Insight: Automated segmentation strategies
     */
    getSegmentationStrategies() {
        return [
            {
                name: 'Big Spenders (VIP)',
                rules: { min_spend: 50000 },
                strategy: 'Exclusive early access & premium support'
            },
            {
                name: 'At Risk (Churn)',
                rules: { last_order_days: 60 },
                strategy: 'Personalized "We miss you" discount'
            },
            {
                name: 'New Leads',
                rules: { created_within_days: 7, orders_count: 0 },
                strategy: 'Welcome sequence and first purchase offer'
            }
        ];
    }
};
