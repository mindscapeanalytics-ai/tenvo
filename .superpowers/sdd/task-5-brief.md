### Task 5: Server action to save owner overrides

**Files:**
- Modify: `lib/actions/basic/business.js`

**Interfaces:**
- Produces: `updateDomainKnowledgeOverridesAction({ businessId, domainKnowledge })`
  - `domainKnowledge: object | null` â€” `null` clears all customizations
- Permission: `settings.edit`
- Returns: `actionSuccess({ business })` with `enrichBusinessForClient`

- [ ] **Step 1: Add action (mirror packaging action)**

```js
import { mergeDomainKnowledgeIntoBusinessSettings } from '@/lib/utils/domainKnowledgeOverrides';

export async function updateDomainKnowledgeOverridesAction({ businessId, domainKnowledge }) {
  try {
    await withGuard(businessId, { permission: 'settings.edit' });

    const biz = await prismaBase.businesses.findFirst({
      where: { id: businessId },
      select: { settings: true },
    });
    if (!biz) {
      return await actionFailure('NOT_FOUND', 'Business not found.');
    }

    let nextSettings;
    try {
      ({ nextSettings } = mergeDomainKnowledgeIntoBusinessSettings(
        biz.settings,
        domainKnowledge === null ? null : domainKnowledge
      ));
    } catch (validationError) {
      return await actionFailure(
        'VALIDATION_ERROR',
        validationError?.message || 'Invalid industry overrides'
      );
    }

    const updated = await prismaBase.businesses.update({
      where: { id: businessId },
      data: { settings: nextSettings, updated_at: new Date() },
    });

    return await actionSuccess({ business: enrichBusinessForClient(updated) });
  } catch (error) {
    const code = error?.code;
    if (
      code === 'UNAUTHENTICATED' ||
      code === 'PERMISSION_DENIED' ||
      code === 'BUSINESS_ACCESS_DENIED' ||
      code === 'MISSING_BUSINESS_ID'
    ) {
      return await actionFailure(
        code === 'UNAUTHENTICATED' ? 'UNAUTHENTICATED' : 'FORBIDDEN',
        await getErrorMessage(error)
      );
    }
    console.error('updateDomainKnowledgeOverridesAction:', error);
    return await actionFailure('DOMAIN_KNOWLEDGE_UPDATE_FAILED', await getErrorMessage(error));
  }
}
```

Ensure `enrichBusinessForClient` is imported (already used in packaging action).

- [ ] **Step 2: Confirm `business.settings` on client includes `domainKnowledge` after save** (enrich already merges settings; no change if settings column is the source).

---


