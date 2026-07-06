# Registration UX Improvements - Verification Checklist

**Date**: January 6, 2026  
**Purpose**: Manual testing guide for registration UX improvements

---

## 🧪 Testing Scenarios

### **Scenario 1: New User Registration (No Saved Data)**

**Steps:**
1. Clear localStorage: `localStorage.clear()` in browser console
2. Navigate to `/register`
3. Fill in business name, email, password
4. Proceed through steps 2 and 3
5. Complete registration

**Expected Results:**
- ✅ No resume banner appears
- ✅ Form starts empty
- ✅ Normal registration flow works
- ✅ All data persists between steps

---

### **Scenario 2: Recent Resume (< 30 Minutes)**

**Steps:**
1. Start registration (fill business name, email)
2. Close browser tab (data auto-saves)
3. Within 5 minutes, return to `/register`

**Expected Results:**
- ✅ Form auto-fills with saved data
- ✅ Toast notification: "Restored your registration from a few minutes ago"
- ✅ No blocking dialog appears
- ✅ Can continue registration immediately

---

### **Scenario 3: Older Resume (> 30 Minutes)**

**Steps:**
1. Start registration (fill business name, email)
2. Close tab
3. Manually age the data in localStorage:
   ```javascript
   const data = JSON.parse(localStorage.getItem('tenvo_registration_data'));
   data._savedAt = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 2 hours ago
   localStorage.setItem('tenvo_registration_data', JSON.stringify(data));
   ```
4. Return to `/register`

**Expected Results:**
- ✅ Form auto-fills with saved data
- ✅ Blue banner appears: "Restored your registration from 2 hours ago"
- ✅ Banner has close button (X)
- ✅ Banner has "Start fresh instead?" link
- ✅ Banner auto-dismisses after 15 seconds

---

### **Scenario 4: Start Fresh from Resume**

**Steps:**
1. Trigger Scenario 3 (older resume)
2. Click "Start fresh instead?" link in banner

**Expected Results:**
- ✅ Banner disappears immediately
- ✅ Form clears (all fields empty)
- ✅ Toast notification: "Starting fresh - form cleared"
- ✅ Can start new registration from scratch

---

### **Scenario 5: Google OAuth - Popup Closed**

**Steps:**
1. Navigate to `/register`
2. Click "Continue with Google"
3. When Google sign-in popup appears, close it immediately

**Expected Results:**
- ✅ Amber error alert appears above Google button
- ✅ Title: "Sign-in window closed"
- ✅ Message: "The Google sign-in window was closed before completing..."
- ✅ Two buttons visible: "Try Google again" and "Use email instead"
- ✅ Error persists (doesn't disappear)

---

### **Scenario 6: Google OAuth - Retry**

**Steps:**
1. Trigger Scenario 5 (popup closed error)
2. Click "Try Google again" button

**Expected Results:**
- ✅ Error alert disappears
- ✅ Google OAuth popup opens again
- ✅ Can complete sign-in successfully
- ✅ After successful sign-in, proceeds to Step 2

---

### **Scenario 7: Google OAuth - Use Email Instead**

**Steps:**
1. Trigger Scenario 5 (popup closed error)
2. Click "Use email instead" button

**Expected Results:**
- ✅ Error alert disappears
- ✅ Email form remains visible
- ✅ Can fill email/password and continue
- ✅ No error state persists

---

### **Scenario 8: Google OAuth - Network Error**

**Steps:**
1. Open browser DevTools → Network tab
2. Enable "Offline" mode
3. Click "Continue with Google"

**Expected Results:**
- ✅ Amber error alert appears
- ✅ Title: "Connection issue"
- ✅ Message mentions checking internet connection
- ✅ "Try Google again" button available

---

### **Scenario 9: Mobile Registration Flow**

**Steps:**
1. Open `/register` on mobile device or mobile emulator
2. Test scenarios 2-5 on mobile viewport

**Expected Results:**
- ✅ Resume banner is readable and dismissible
- ✅ Google error alert fits screen width
- ✅ All buttons are touch-friendly (min 44px)
- ✅ Form fields are accessible with touch keyboard

---

### **Scenario 10: Resume Banner Auto-Dismiss**

**Steps:**
1. Trigger Scenario 3 (older resume)
2. Wait 15 seconds without interacting

**Expected Results:**
- ✅ Banner auto-dismisses after 15 seconds
- ✅ Form data remains filled
- ✅ Can continue registration normally

---

### **Scenario 11: Multiple Resume Attempts**

**Steps:**
1. Start registration (fill data)
2. Close tab
3. Return to `/register` (banner shows)
4. Click "Start fresh"
5. Fill new data
6. Close tab again
7. Return to `/register`

**Expected Results:**
- ✅ Shows most recent saved data
- ✅ Banner reflects latest save time
- ✅ "Start fresh" works again

---

### **Scenario 12: Keyboard Navigation**

**Steps:**
1. Trigger Scenario 3 (resume banner)
2. Use Tab key to navigate through banner elements
3. Press Enter on "Start fresh" link
4. Trigger Google error (Scenario 5)
5. Tab through error alert buttons

**Expected Results:**
- ✅ All interactive elements are keyboard accessible
- ✅ Focus indicators are visible
- ✅ Enter key activates buttons/links
- ✅ Escape key can dismiss alerts (if implemented)

---

### **Scenario 13: Screen Reader Compatibility**

**Steps:**
1. Enable screen reader (NVDA/JAWS on Windows, VoiceOver on Mac)
2. Navigate to `/register`
3. Trigger resume banner (Scenario 3)
4. Trigger Google error (Scenario 5)

**Expected Results:**
- ✅ Banner announces as "alert" with title and description
- ✅ Error alert announces with severity
- ✅ Button labels are clear and descriptive
- ✅ Dismiss actions are announced

---

## 🔍 Visual Inspection Checklist

### **ResumeBanner Component**
- [ ] Blue color scheme (info, not warning)
- [ ] Rotate CCW icon visible
- [ ] Title: "Restored your registration"
- [ ] Relative time format correct
- [ ] Close button (X) in top-right
- [ ] "Start fresh instead?" link inline
- [ ] Smooth slide-in animation
- [ ] Proper spacing and padding

### **GoogleOAuthError Component**
- [ ] Amber color scheme (warning)
- [ ] Alert triangle icon visible
- [ ] Error title specific to error type
- [ ] Error message helpful and actionable
- [ ] Two buttons horizontally aligned
- [ ] "Try Google again" is primary style
- [ ] "Use email instead" is secondary style
- [ ] Smooth slide-in animation

---

## 🐛 Edge Cases to Test

### **Edge Case 1: Very Old Data (> 7 Days)**
```javascript
// Manually age data to 8 days ago
const data = JSON.parse(localStorage.getItem('tenvo_registration_data'));
data._savedAt = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
localStorage.setItem('tenvo_registration_data', JSON.stringify(data));
```
**Expected**: Banner shows formatted date (e.g., "Dec 29, 1:34 AM")

### **Edge Case 2: Corrupted localStorage Data**
```javascript
localStorage.setItem('tenvo_registration_data', 'invalid json{');
```
**Expected**: No crash, starts with empty form, no banner

### **Edge Case 3: Partial Form Data**
```javascript
const data = {
  businessName: 'Test Business',
  _savedAt: new Date().toISOString()
  // email and other fields missing
};
localStorage.setItem('tenvo_registration_data', JSON.stringify(data));
```
**Expected**: Fills available fields, others remain empty

### **Edge Case 4: Google OAuth Error with No Internet**
- Disconnect internet completely
- Click "Continue with Google"
**Expected**: Network error shows appropriate message

---

## ✅ Success Criteria

### **Critical (Must Pass)**
- [ ] New user registration works end-to-end
- [ ] Resume functionality doesn't block or break flow
- [ ] Google OAuth errors are clear and actionable
- [ ] No JavaScript errors in console
- [ ] All existing registration flows work unchanged

### **Important (Should Pass)**
- [ ] Resume banner auto-dismisses correctly
- [ ] "Start fresh" clears form completely
- [ ] Google OAuth retry succeeds
- [ ] Error messages match error types
- [ ] Mobile experience is smooth

### **Nice to Have (Optional)**
- [ ] Animations are smooth (60fps)
- [ ] Keyboard navigation works perfectly
- [ ] Screen readers announce correctly
- [ ] Timing feels natural (not too fast/slow)

---

## 🚨 Regression Tests

### **Verify Unchanged Functionality**
- [ ] Email registration flow (no Google)
- [ ] Step 1 → Step 2 → Step 3 progression
- [ ] Industry selection (Step 2)
- [ ] Plan selection (Step 3)
- [ ] OTP verification flow
- [ ] Approval workflow for non-platform owners
- [ ] Auto-approved flow for platform owners
- [ ] Form field validations
- [ ] Domain handle availability check
- [ ] Country/currency selection
- [ ] Optional fields toggle

---

## 📱 Device Testing Matrix

| Device Type | Viewport | Browser | Status |
|-------------|----------|---------|--------|
| Desktop | 1920x1080 | Chrome | [ ] |
| Desktop | 1920x1080 | Firefox | [ ] |
| Desktop | 1920x1080 | Edge | [ ] |
| Desktop | 1920x1080 | Safari | [ ] |
| Laptop | 1366x768 | Chrome | [ ] |
| Tablet | 768x1024 | Safari (iPad) | [ ] |
| Mobile | 375x667 | Chrome (iPhone) | [ ] |
| Mobile | 390x844 | Safari (iPhone) | [ ] |
| Mobile | 360x740 | Chrome (Android) | [ ] |

---

## 🔧 Developer Testing Tools

### **Browser Console Commands**

```javascript
// Test resume with old data
const testOldResume = () => {
  const data = {
    businessName: 'Test Business',
    email: 'test@example.com',
    handle: 'test-business',
    _savedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  };
  localStorage.setItem('tenvo_registration_data', JSON.stringify(data));
  localStorage.setItem('tenvo_registration_step', '1');
  location.reload();
};

// Test recent resume
const testRecentResume = () => {
  const data = {
    businessName: 'Recent Test',
    email: 'recent@example.com',
    handle: 'recent-test',
    _savedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString()
  };
  localStorage.setItem('tenvo_registration_data', JSON.stringify(data));
  location.reload();
};

// Clear all registration data
const clearRegistration = () => {
  localStorage.removeItem('tenvo_registration_data');
  localStorage.removeItem('tenvo_registration_step');
  location.reload();
};

// Simulate Google OAuth error
const testGoogleError = () => {
  window.location.href = '/register?error=google&google_error=popup_closed';
};
```

---

## 📊 Performance Checks

### **Component Render Performance**
- [ ] ResumeBanner renders in < 16ms
- [ ] GoogleOAuthError renders in < 16ms
- [ ] No unnecessary re-renders on state changes
- [ ] Animations are smooth (no jank)

### **Bundle Size Impact**
```bash
# Check bundle size before/after
npm run build
# Compare .next/static/chunks sizes
```

**Expected**: < 5KB increase for both new components

---

## 📝 Testing Notes Template

```markdown
## Test Session: [Date]
**Tester**: [Name]
**Environment**: [Browser, OS, Device]

### Scenarios Tested:
- [ ] Scenario 1: New User
  - Result: Pass/Fail
  - Notes: 

- [ ] Scenario 2: Recent Resume
  - Result: Pass/Fail
  - Notes:

[... continue for all scenarios]

### Issues Found:
1. [Issue description]
   - Severity: Critical/High/Medium/Low
   - Steps to reproduce:
   - Expected vs Actual:

### Overall Assessment:
- Ready for production: Yes/No
- Confidence level: 1-10
- Recommendations:
```

---

## ✅ Sign-off Checklist

Before marking as "Ready for Production":

- [ ] All critical success criteria passed
- [ ] No JavaScript console errors
- [ ] No regression in existing flows
- [ ] Tested on 3+ different browsers
- [ ] Tested on mobile device
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Performance acceptable
- [ ] Accessibility basics verified
- [ ] Product owner approval

---

**Testing Status**: ⏳ Pending Manual Verification  
**Next Step**: Run through all scenarios and mark checkboxes  
**Estimated Time**: 30-45 minutes for full test suite
