# GetTerms Cookie Banner Implementation

## Current Implementation

The cookie consent banner is implemented using GetTerms (https://getterms.io/).

### Embed Script

```html
<script type="text/javascript" src="https://gettermscmp.com/cookie-consent/embed/870abf34-b1c1-4431-acc7-67b39fe711a2/en-us"></script>
```

### Banner Behavior

1. **Initial Load**: Full-width bottom banner appears automatically on first visit when no consent has been saved
2. **Floating Button**: Disabled via GetTerms dashboard configuration
3. **Cookie Settings Link**: Opens the bottom banner again via `window.gtCookieWidgetPreview()` API
4. **After Consent**: Banner does not reappear on subsequent page loads

### GetTerms Dashboard Configuration

**Account ID**: `870abf34-b1c1-4431-acc7-67b39fe711a2`

**Critical Settings** (configured at https://app.getterms.io):
- **Persistent icon to manage preferences**: ❌ DISABLED (prevents floating button)
- **Allow granular consent controls**: ✅ ENABLED (enables detailed preferences)
- **Reject all cookies button**: ✅ ENABLED
- **Auto-block third party cookies**: ✅ ENABLED
- **Consent setting**: Opt-in (Recommended)

### JavaScript API

The GetTerms widget exposes the following global functions:

- `window.gtCookieWidgetPreview()` - Opens the cookie consent banner
- `window.gtCookieWidgetConfig` - Contains widget configuration object

The `gtCookieWidgetPreview()` function is used by the "Cookie Settings" links in the sidebar and footer to allow users to review and change their cookie consent preferences at any time.

### Implementation Files

- `/app/layout.tsx` - Loads the GetTerms embed script
- `/components/layout/policy-footer.tsx` - Cookie Settings button implementation
- `/types/getterms.d.ts` - TypeScript type definitions for GetTerms API

### Troubleshooting

**Banner not appearing on first load?**
- Check that localStorage key `getterms_cookie_consent` does not exist
- Test in incognito/private browser window
- Verify "Persistent icon to manage preferences" is disabled in dashboard

**Floating button appearing?**
- Ensure "Persistent icon to manage preferences" is unchecked in GetTerms dashboard
- This setting overrides any code-level configuration