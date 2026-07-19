### Task 6: Settings â†’ Industry UI

**Files:**
- Create: `components/settings/IndustryDomainKnowledgePanel.jsx`
- Modify: `components/SettingsManager.jsx`

**Interfaces:**
- Consumes: `updateDomainKnowledgeOverridesAction`, `getDomainKnowledgeForBusiness`, `useBusiness`
- Shows baseline vs editable patch fields

- [ ] **Step 1: Build panel (compact Zoho-style form)**

Panel responsibilities:
- Load baseline via `getDomainKnowledgeForBusiness(business.category, business)` for read-only summary (vertical name, country, default unit).
- Local state initialized from `business.settings.domainKnowledge` via `extractDomainKnowledgeOverride`.
- Editors: units (comma/chip text), popularBrands (textarea one-per-line), categories (one-per-line), intelligence (selects + numbers), optional simple fieldConfig add row (label + type).
- Buttons: Save, Reset all (calls action with `null`).
- Copy: no em dashes; headings `font-semibold`.
- On success: update BusinessContext business object from action payload; `notify.compactSave` or existing toast pattern in SettingsManager.

Keep the component under ~350 lines; reuse existing Input/Select/Button from `@/components/ui/*`.

- [ ] **Step 2: Wire tab in SettingsManager**

In `visibleSections`:

```js
{ value: 'industry', label: 'Industry', visible: true },
```

Place after `financials` (before billing). Add `TabsContent value="industry"` rendering `<IndustryDomainKnowledgePanel />`.

Gate save button with `can('settings.edit')` or existing owner/admin check used for profile save.

- [ ] **Step 3: Manual smoke** (dev): open Settings â†’ Industry, add brand, save, confirm `getDomainKnowledgeForBusiness` in a quick bun snippet or inventory brand datalist shows it.

---


