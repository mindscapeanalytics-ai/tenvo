/**
 * AI Forecasting Service
 * Uses historical sales data to predict future demand using 2026 best practices.
 */

export const AIOrderForecaster = {
    /**
     * Forecast demand for a specific product with Domain Awareness
     * @param {string} domainKey - The domain category (e.g., 'pharmacy')
     * @param {Object} product
     * @param {Array} salesHistory - array of objects { date, quantity }
     */
    async forecastDemand(domainKey, product, salesHistory) {
        try {
            // 🔄 Dynamic import to prevent build failure if package is missing
            let ai, openaiModule, zod, domainKnowledgeSvc;
            try {
                ai = await import('ai');
                openaiModule = await import('@ai-sdk/openai');
                zod = await import('zod');
                domainKnowledgeSvc = await import('../../domainKnowledge.js');
            } catch (e) {
                console.warn('AI SDK or Domain modules not found. Falling back to WMA forecasting.');
                return this.fallbackForecast(product, salesHistory);
            }

            const { generateObject } = ai;
            const { openai } = openaiModule;
            const { z } = zod;
            const domainInfo = domainKnowledgeSvc.getDomainKnowledge(domainKey);

            if (!generateObject || !openai || !z) {
                return this.fallbackForecast(product, salesHistory);
            }

            const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

            const { object } = await generateObject({
                model: openai('gpt-4o-mini'),
                schema: z.object({
                    forecastedQuantity: z.number().describe('Predicted quantity needed for the next 30 days'),
                    confidenceScore: z.number().min(0).max(1),
                    reasoning: z.string().describe('Explanation for the forecast, including seasonal factors'),
                    riskFactors: z.array(z.string()).describe('Potential risks like expiry or price fluctuation'),
                    suggestedAction: z.string().describe('Immediate business action recommended')
                }),
                prompt: `
            Analyze sales history for product: ${product.name} in the ${domainInfo.name || domainKey} domain.
            
            BUSINESS CONTEXT:
            - Domain Intelligence: Seasonality is ${domainInfo.intelligence?.seasonality || 'medium'}.
            - Peak Months: ${domainInfo.intelligence?.peakMonths?.join(', ') || 'N/A'}.
            - Today's Date: ${currentDate}.
            - Pakistani Cultural Context: Consider the proximity of Ramadan, Eids, Wedding Season (Winter), or Harvest/Construction seasons relevant to this domain.

            DATA:
            - Current Stock: ${product.stock}
            - Historical Sales (Last 6 months):
            ${JSON.stringify(salesHistory, null, 2)}
            
            Based on the data AND the domain context, predict demand for the next 30 days.
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
