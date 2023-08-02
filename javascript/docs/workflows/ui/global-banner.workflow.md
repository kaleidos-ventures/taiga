# Global banner

The height of the global banner is set in the `app.component.ts` as a css property called `--banner-height`.

At the project there are several views who use the `100vh` height for the block-size and, in those cases it's necessary to substract the banner height.

These are the following files to keep in mind when we are modifying the global banner:

- `app.component.css`
- `app.component.ts`
- `auth-forest.component.css`
- `auth-forest.component.ts`
- `auth-styles.css`
- `project-navigation-menu.component.css`
- `project-feature-navigation.component.ts`
- `story-detail.component.ts`
