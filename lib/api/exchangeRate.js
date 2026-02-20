import {
    setExchangeRateAction,
    getExchangeRatesAction,
    getLatestRateAction,
    convertCurrencyAction
} from '@/lib/actions/basic/exchangeRate';

export const exchangeRateAPI = {
    async setRate(data) {
        return await setExchangeRateAction(data);
    },
    async getRates(businessId, fromCurrency, toCurrency) {
        return await getExchangeRatesAction(businessId, fromCurrency, toCurrency);
    },
    async getLatest(businessId, fromCurrency, toCurrency) {
        return await getLatestRateAction(businessId, fromCurrency, toCurrency);
    },
    async convert(businessId, amount, fromCurrency, toCurrency) {
        return await convertCurrencyAction(businessId, amount, fromCurrency, toCurrency);
    },
};
