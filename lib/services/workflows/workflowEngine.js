import pool from '@/lib/db';

/**
 * Agentic Workflow Engine
 * Allows defining proactive triggers and actions based on inventory states.
 * Updated for 2026 Persistence Standards.
 */
export const WorkflowEngine = {
    /**
     * Evaluate persistent rules and execute actions
     */
    async evaluateTriggers(businessId, context) {
        const client = await pool.connect();
        try {
            // 1. Fetch active rules for this business
            const rulesRes = await client.query(
                'SELECT * FROM workflow_rules WHERE business_id = $1 AND is_active = true',
                [businessId]
            );

            const executions = [];

            // 2. Evaluate each rule
            for (const rule of rulesRes.rows) {
                const logic = rule.rule_logic || {};

                // Simple condition mapping (extensible)
                const isTriggered = this.evaluateCondition(logic.condition, context);

                if (isTriggered) {
                    try {
                        const res = await this.executeAction(rule, context);
                        executions.push({ ruleId: rule.id, res });

                        // 3. Log execution to history
                        await client.query(
                            `INSERT INTO workflow_history (business_id, rule_id, event_type, description, context, result)
                             VALUES ($1, $2, $3, $4, $5, $6)`,
                            [businessId, rule.id, 'execution', `Triggered: ${rule.name}`, JSON.stringify(context), JSON.stringify(res)]
                        );
                    } catch (e) {
                        console.error(`Rule ${rule.id} execution failed:`, e);
                    }
                }
            }
            return executions;
        } finally {
            client.release();
        }
    },

    /**
     * Helper to evaluate rule logic conditions
     */
    evaluateCondition(condition, context) {
        if (!condition) return false;

        // Example: { field: 'stock', operator: '<', value: 'reorderPoint' }
        const { field, operator, value } = condition;
        const actualValue = context[field];
        const compareValue = context[value] !== undefined ? context[value] : value;

        switch (operator) {
            case '<': return Number(actualValue) < Number(compareValue);
            case '>': return Number(actualValue) > Number(compareValue);
            case '==': return actualValue == compareValue;
            default: return false;
        }
    },

    /**
     * Helper to execute predefined actions
     */
    async executeAction(rule, context) {
        const actionType = rule.rule_logic?.action || 'alert';

        switch (actionType) {
            case 'alert':
                return { action: 'alert_sent', target: 'admin', message: `Stock alert for ${context.productName}` };
            default:
                return { action: 'logged', status: 'success' };
        }
    },

    /**
     * Use AI to resolve complex "Fuzzy" rules and optionally save them
     */
    async processFuzzyRule(businessId, ruleText, context, saveRule = false) {
        try {
            // 🔄 Dynamic import
            let aiModule, openaiModule;
            try {
                aiModule = await import('ai');
                openaiModule = await import('@ai-sdk/openai');
            } catch (e) {
                return { success: false, error: "AI logic unavailable: Modules missing." };
            }

            const { generateObject } = aiModule;
            const { openai } = openaiModule;
            const { z } = await import('zod');

            if (!generateObject || !openai) {
                return { success: false, error: "AI logic unavailable: SDK functions not loaded." };
            }

            const { object } = await generateObject({
                model: openai('gpt-4o'),
                schema: z.object({
                    isTriggered: z.boolean(),
                    reasoning: z.string(),
                    recommendedAction: z.string(),
                    suggestedRuleName: z.string(),
                    technicalCondition: z.object({
                        field: z.string(),
                        operator: z.string(),
                        value: z.string()
                    }).nullable()
                }),
                prompt: `
                    You are an expert inventory agent. 
                    User Natural Language Rule: "${ruleText}"
                    Current Stock Context: ${JSON.stringify(context)}
                    
                    Determine if this rule should trigger an action. 
                    Also, provide a structured technical condition that represents this rule for future automation.
                `
            });

            if (saveRule && object.technicalCondition) {
                const client = await pool.connect();
                try {
                    await client.query(
                        `INSERT INTO workflow_rules (business_id, name, rule_text, rule_logic)
                         VALUES ($1, $2, $3, $4)`,
                        [businessId, object.suggestedRuleName, ruleText, JSON.stringify({
                            condition: object.technicalCondition,
                            action: 'alert'
                        })]
                    );
                } finally {
                    client.release();
                }
            }

            return { success: true, ...object };
        } catch (error) {
            console.error('Workflow AI error:', error);
            return { success: false, error: "Error processing rule with AI." };
        }
    }
};
