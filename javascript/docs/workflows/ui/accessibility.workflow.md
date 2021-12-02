## Accessibility

### Page focus

You can set a focus after the navigation. This focus must work for mouse users & keyboards users. It's important to use `:focus-visible` that will show an outline only for keyboard users.

Example:

```html
<h1
  tabindex="-1"
  mainFocus>Page title</h1>
```

In this example the focus will only be set if the user come from other page. And only visible for keyboard users.
