import {
    createCreditNoteAction,
    getCreditNotesAction,
    applyCreditNoteAction
} from '@/lib/actions/basic/creditNote';

export const creditNoteAPI = {
    async create(data) {
        return await createCreditNoteAction(data);
    },
    async getAll(businessId, filters) {
        return await getCreditNotesAction(businessId, filters);
    },
    async apply(data) {
        return await applyCreditNoteAction(data);
    },
};
