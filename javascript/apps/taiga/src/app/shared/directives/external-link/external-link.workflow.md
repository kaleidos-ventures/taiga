### External Links

When you have a link that has a target blank you should import the `ExternalLinkModule` into the component and add the directive `withExternalLink` to a container of the text and it will search for every target blank link and add the external link SVG even if the link is inside a transloco translation.

Example:

```html
<p
  withExternalLink
  [innerHtml]="
    t('signup.terms_and_privacy', {
      termsOfService: 'terms-of-service' | getUrl,
      privacyPolicy: 'privacy-policy' | getUrl
    })
  "></p>
```
