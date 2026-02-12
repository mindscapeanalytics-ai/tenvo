/**
 * AI Forecasting Service
 * Uses historical sales data to predict future demand using 2026 best practices.
 */

export const AIOrderForecaster = {
    /**
     * Forecast demand for a specific product
     * @param {string} businessId
     * @param {Object} product
     * @param {Array} salesHistory - array of objects { date, quantity }
     */
    async forecastDemand(businessId, product, salesHistory) {
        try {
            // 🔄 Dynamic import to prevent build failure if package is missing
            let ai, openaiModule, zod;
            try {
                // We use string literals for import to allow Turbopack to optionally resolve
                ai = await import('ai');
                openaiModule = await import('@ai-sdk/openai');
                zod = await import('zod');
            } catch (e) {
                console.warn('AI SDK modules not found. Falling back to WMA forecasting.');
                return this.fallbackForecast(product, salesHistory);
            }

            const { generateObject } = ai;
            const { openai } = openaiModule;
            const { z } = zod;

            if (!generateObject || !openai || !z) {
                return this.fallbackForecast(product, salesHistory);
            }

            const { object } = await generateObject({
                model: openai('gpt-4o-mini'),
                schema: zod.z.object({
                    forecastedQuantity: z.number().describe('Predicted quantity needed for the next 30 days'),
                    confidenceScore: z.number().min(0).max(1),
                    reasoning: z.string().describe('Explanation for the forecast'),
                    riskFactors: z.array(z.string()).describe('Potential risks')
                }),
                prompt: `
            Analyze the following sales history for product: ${product.name} (SKU: ${product.sku}).
            Current Stock: ${product.stock}
            Historical Sales (Last 6 months):
            ${JSON.stringify(salesHistory, null, 2)}
            
            Based on this data, predict the demand for the next 30 days.
            `
            });

            return {
                productId: product.id,
                ...object
            };
        } catch (error) {
            console.error('Forecasting error:', error);
            return this.fallbackForecast(product, salesHistory);
        }
    },

    /**
     * Fallback calculation using Weighted Moving Average
     */
    fallbackForecast(product, salesHistory) {
        const recentSales = salesHistory?.slice(-3) || [];
        if (recentSales.length === 0) return { forecastedQuantity: 10, confidenceScore: 0.1, reasoning: 'Insufficient data' };

        const weights = [0.2, 0.3, 0.5];
        const wma = recentSales.reduce((acc, s, i) => acc + (Number(s.quantity || 0) * weights[i] || 0), 0);

        return {
            productId: product.id,
            forecastedQuantity: Math.ceil(wma) || 5,
            confidenceScore: 0.5,
            reasoning: 'Calculated using fallback WMA due to AI unavailability'
        };
    }
};
