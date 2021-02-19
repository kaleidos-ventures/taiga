# Storybook workflow

Create a component file in `/src/stories/` like `MyComponent.stories.ts`.

Config the story.

```ts
import { StoryBookTranslationModule } from './utils/translate-local-loader';

export default {
  // add the module in the path, in this example 'Commons'
  title: 'Commons/MyComponent',
  component: MyComponentComponent,
  decorators: [
    moduleMetadata({
      declarations: [],
      // Needed if you have routes
      providers: [{provide: APP_BASE_HREF, useValue: '/'}],
      imports: [
        // Add local translations from assets/i18n/en.json
        StoryBookTranslationModule(),
        // Prevent Storybook error "Error: Uncaught (in promise): Error: Cannot match any routes. URL Segment: 'iframe.html'"
        RouterModule.forRoot([], { useHash: true }),
        MyComponentModule,
      ],
    }),
  ],
} as Meta;
```

Or you can use the helper function.

```ts
export default ConfigureStory({
  // add the module in the path, in this example 'Commons'
  title: 'Commons/MyComponent',
  component: MyComponentComponent,
  extraModules: [MyComponentModule],
});
```

Create the template & the bindings.

```ts
const Template: Story<MyComponentComponent> = (args: MyComponentComponent) => ({
  template: `
    <tg-my-component [project]="project"></tg-my-component>
    <tg-svg-sprite></tg-svg-sprite>
  `,
  props: args,
});

export const Default = Template.bind({});

Default.args = {
  project: ProjectMockFactory.build(),
};
```
