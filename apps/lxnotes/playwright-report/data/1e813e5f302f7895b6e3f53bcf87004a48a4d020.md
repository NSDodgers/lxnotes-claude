# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - heading "404" [level=1] [ref=e5]
      - heading "Page Not Found" [level=2] [ref=e6]
      - paragraph [ref=e7]: The page you are looking for doesn't exist or has been moved.
    - link "Return Home" [ref=e9] [cursor=pointer]:
      - /url: /
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e15] [cursor=pointer]:
    - img [ref=e16]
  - alert [ref=e19]
  - generic [ref=e20]:
    - region "Cookie consent banner" [ref=e21]:
      - paragraph [ref=e22]:
        - text: This website uses cookies to improve your experience. By clicking “Accept” you are agreeing to our
        - link "Cookie Policy" [ref=e23] [cursor=pointer]:
          - /url: https://app.getterms.io/view/QlGyI/cookies/en-us
        - text: .
    - generic [ref=e24]:
      - button "Open Cookie Preferences" [ref=e25] [cursor=pointer]: Preferences
      - button "Reject All" [ref=e26] [cursor=pointer]
      - button "Accept all cookies" [ref=e27] [cursor=pointer]: Accept
```