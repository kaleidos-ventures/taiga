# Storybook workflow

Create the story file next to the componente in `javascript/libs/ui/src/lib/` like `mycomponent.stories.ts`.

Config the story with the helper function.

```ts
import { ConfigureStory } from '@storybook-helper';
import { Story } from '@storybook/angular';

const story = ConfigureStory({
  // you can add a folder like `title: 'myfolder/MyComponent'`
  title: 'MyComponent',
  component: MyComponentComponent,
  extraModules: [MyComponentModule],
});
```

Create the template & the bindings:

```ts
export const Primary = ConfigureTemplate({
  args: {
    project: ProjectMockFactory.build(),
  },
});
```

You can also add a template to wrap your component:

```ts
export const Primary = ConfigureTemplate({
  template: `
    <h1>Example component</h1>
    <tg-my-component [project]="project"></tg-my-component>
  `,
  args: {
    project: ProjectMockFactory.build(),
  },
});
```

## Full example

```ts
import { ConfigureStory, ConfigureTemplate } from '@storybook-helper';
import { Story } from '@storybook/angular';

const story = ConfigureStory({
  title: 'MyComponent',
  component: MyComponentComponent,
  extraModules: [MyComponentModule],
});

export const Primary = ConfigureTemplate({
  args: {
    project: ProjectMockFactory.build(),
  },
});
```
