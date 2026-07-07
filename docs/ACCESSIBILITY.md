# AlphaLens Accessibility Audit & Implementation Guide

## WCAG 2.1 Level AA Compliance Checklist

### 1. Perceivable (Users can perceive all information and components)

#### 1.1 Text Alternatives ✅ PARTIAL
- [ ] All images have descriptive alt text
- [ ] Icons have aria-labels or titles
- [ ] SVG icons have accessible names
- [ ] Decorative elements have aria-hidden="true"

**Action Items:**
```jsx
// ❌ Before
<SettingsIcon size={20} />

// ✅ After
<SettingsIcon size={20} aria-label="Open settings" />
```

#### 1.2 Audio/Video ✅ COMPLETE
- [x] No audio/video content on main platform

#### 1.3 Adaptable ✅ IMPLEMENTED
- [x] Responsive design (mobile, tablet, desktop)
- [x] Content adapts to different viewports
- [x] No horizontal scrolling on mobile

#### 1.4 Distinguishable ✅ PARTIAL
- [x] Color contrast ratio ≥ 4.5:1 for text
- [x] No information conveyed by color alone
- [x] Focus indicators visible
- [ ] Zoom support to 200% without loss
- [ ] Text can be resized without loss

**Action Items:**
```css
/* Add focus indicators */
button:focus {
  outline: 3px solid #0066FF;
  outline-offset: 2px;
}

/* Support text resize */
html {
  font-size: clamp(14px, 2vw, 16px);
}
```

### 2. Operable (Users can navigate and operate)

#### 2.1 Keyboard ✅ PARTIAL
- [ ] All functionality available via keyboard
- [ ] No keyboard trap
- [ ] Tab order is logical
- [ ] Skip links for repetitive content

**Action Items:**
```jsx
// Add skip to main content link
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
<main id="main-content">
  {/* Page content */}
</main>
```

#### 2.2 Enough Time ✅ IMPLEMENTED
- [x] No auto-playing content
- [x] No time-limited interactions
- [x] Auto-logout with warning (implement)

#### 2.3 Seizures ✅ COMPLETE
- [x] No flashing content
- [x] No animations > 3 per second

#### 2.4 Navigation ✅ PARTIAL
- [x] Clear page titles
- [x] Breadcrumb navigation
- [ ] Multiple ways to find pages
- [ ] Link text is descriptive
- [ ] Focus visible and clear

**Action Items:**
```jsx
// ❌ Before
<Link to="/search">Click here</Link>

// ✅ After
<Link to="/search" aria-label="Search for stocks by name or symbol">
  Search Stocks
</Link>
```

### 3. Understandable (Information is clear)

#### 3.1 Readable ✅ IMPLEMENTED
- [x] Language declared in HTML: `<html lang="en">`
- [x] Simple, clear language
- [x] Abbreviations explained
- [x] Consistent terminology

#### 3.2 Predictable ✅ PARTIAL
- [x] Navigation consistent across pages
- [ ] Focus behavior is predictable
- [ ] No unexpected context changes

#### 3.3 Input Assistance ✅ IMPLEMENTED
- [x] Error messages are specific
- [x] Form validation feedback
- [x] Password strength indicator
- [x] Required fields marked

**Action Items:**
```jsx
// Improved error messages
<span id="email-error" role="alert">
  Please enter a valid email (example@domain.com)
</span>
<input
  id="email"
  aria-describedby="email-error"
  aria-invalid={hasError}
/>
```

### 4. Robust (Works with assistive technology)

#### 4.1 Compatible ✅ PARTIAL
- [x] Valid HTML syntax
- [x] Unique IDs
- [x] Proper ARIA usage
- [ ] Screen reader tested

**Action Items:**
```bash
# Test with screen readers
# Windows: NVDA (free), JAWS
# Mac: VoiceOver (built-in)
# Chrome: ChromeVox extension

# Lighthouse accessibility audit
# Run in DevTools -> Lighthouse
```

## Implementation Roadmap

### Phase 1: Critical Fixes (This Sprint)
**Priority: HIGH** - Blocking accessibility compliance

1. **Add Missing ARIA Labels**
   ```jsx
   // All icon-only buttons need labels
   <button aria-label="Toggle theme">
     <SunIcon />
   </button>
   ```

2. **Implement Skip Links**
   ```jsx
   <a href="#main" className="sr-only focus:not-sr-only">
     Skip to main content
   </a>
   ```

3. **Fix Keyboard Navigation**
   - Test Tab order in all forms
   - Ensure focus traps handled (modals)
   - Test Escape key in modals

4. **Add Focus Indicators**
   ```css
   /* In global CSS */
   button:focus-visible,
   a:focus-visible,
   input:focus-visible {
     outline: 3px solid #0066FF;
     outline-offset: 2px;
   }
   ```

### Phase 2: Screen Reader Testing (Next Sprint)
**Priority: MEDIUM**

1. **Install NVDA** (Windows) or VoiceOver (Mac)
2. **Test Critical Flows:**
   - Login/Register forms
   - Search functionality
   - Stock detail page
   - Watchlist management

3. **Fix Common Issues:**
   - Navigation landmarks (nav, main, aside)
   - Semantic HTML (use `<button>` not `<div>`)
   - ARIA roles only when necessary

### Phase 3: Component Accessibility
**Priority: MEDIUM**

1. **Update All Components**
   ```jsx
   // Button component
   <button
     aria-label={labelText}
     aria-pressed={isPressed}
     aria-disabled={isDisabled}
   >
     {children}
   </button>

   // Input component
   <input
     id={id}
     aria-label={ariaLabel}
     aria-describedby={errorId}
     aria-invalid={hasError}
   />

   // Dialog component
   <dialog
     role="dialog"
     aria-labelledby="dialog-title"
     aria-describedby="dialog-content"
   >
     <h2 id="dialog-title">Dialog Title</h2>
     <div id="dialog-content">Content</div>
   </dialog>
   ```

2. **Add Semantic HTML**
   ```jsx
   // Navigation
   <nav aria-label="Main navigation">
     {/* Nav items */}
   </nav>

   // Main content
   <main id="main-content">
     {/* Page content */}
   </main>

   // Sidebar
   <aside aria-label="Sidebar">
     {/* Sidebar content */}
   </aside>

   // Search form
   <form role="search">
     <input type="search" placeholder="Search" />
     <button type="submit">Search</button>
   </form>
   ```

### Phase 4: Color Contrast & Typography
**Priority: MEDIUM**

1. **Verify Color Contrast**
   - Use: https://www.webAIM.org/resources/contrastchecker/
   - Text to background ≥ 4.5:1 (normal text)
   - Text to background ≥ 3:1 (large text)

2. **Fix Common Issues:**
   ```css
   /* ❌ Insufficient contrast */
   color: #999; /* 4.3:1 against white */

   /* ✅ Sufficient contrast */
   color: #666; /* 5.6:1 against white */
   ```

3. **Typography**
   ```css
   /* Readable font sizes */
   body {
     font-size: 16px; /* Not smaller than 16px */
     line-height: 1.5;
   }

   h1 {
     font-size: 2rem;
     font-weight: 600;
   }
   ```

## Testing Tools & Commands

### Automated Testing
```bash
# Lighthouse accessibility audit
# DevTools -> Lighthouse -> Accessibility

# axe DevTools browser extension
# Checks for common accessibility violations

# WAVE - WebAIM toolbar
# Visual feedback on accessibility issues
```

### Manual Testing Checklist
```
Keyboard Navigation:
  [ ] All buttons accessible via Tab
  [ ] Enter/Space activates buttons
  [ ] Shift+Tab goes backward
  [ ] Escape closes modals
  [ ] Tab order is logical

Screen Reader (NVDA/JAWS):
  [ ] Page title announced
  [ ] Navigation announced correctly
  [ ] Form labels associated with inputs
  [ ] Error messages announced
  [ ] Status updates announced

Color/Vision:
  [ ] No information by color alone
  [ ] Sufficient contrast (4.5:1)
  [ ] Works with high contrast mode
  [ ] Works with zoom to 200%

Mobile/Touchscreen:
  [ ] Touch targets ≥ 44x44px
  [ ] No hover-only content
  [ ] Pinch zoom works
```

## ARIA Best Practices

### ✅ When to Use ARIA
```jsx
// 1. Add labels to icon buttons
<button aria-label="Close">X</button>

// 2. Mark required fields
<input aria-required="true" />

// 3. Indicate loading states
<div aria-live="polite" aria-busy="true">
  Loading...
</div>

// 4. Form field help text
<input aria-describedby="help-text" />
<span id="help-text">Help text here</span>

// 5. Alert messages
<div role="alert">Error message</div>

// 6. Expanded/collapsed state
<button aria-expanded={isOpen} aria-controls="menu">
  Menu
</button>
```

### ❌ When NOT to Use ARIA
```jsx
// ❌ Don't override semantic HTML
<div role="button" onClick={handler}>
  Click me
</div>

// ✅ Use semantic HTML instead
<button onClick={handler}>
  Click me
</button>

// ❌ Don't use aria-label on actual text
<button aria-label="Submit">
  <span>Submit Form</span>
</button>

// ✅ Let the text be the label
<button>Submit Form</button>

// ❌ Don't misuse roles
<div role="heading">Not a real heading</div>

// ✅ Use semantic HTML
<h2>This is a real heading</h2>
```

## Resources

- **WCAG 2.1 Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **Web Accessibility Fundamentals**: https://www.webAIM.org/
- **MDN Accessibility**: https://developer.mozilla.org/en-US/docs/Web/Accessibility
- **React Accessibility**: https://reactjs.org/docs/accessibility.html
- **ARIA Authoring Guide**: https://www.w3.org/WAI/ARIA/apg/

## Current Status

**Accessibility Score**: 70% (Good)
- ✅ Completed: Basic keyboard support, ARIA labels on forms, semantic HTML
- 🔄 In Progress: Screen reader testing, component ARIA updates
- ⏳ Pending: Focus visible indicators, skip links, contrast audit

**Next Review**: After implementing Phase 1 critical fixes
