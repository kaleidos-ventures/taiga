# TaigaUI Workflow

## Previous notes

TaigaUI has predefined custom properties that set common styles for all components. Please review them if you need to change component styles on the global stylesheets.

## How to use a TaigaUI component

> First, find out if this component has been pre-approved to be used by UX and front team under the TaigaUI document on Cylon folder

If is approved, then import the component in the module:

```ts
import {
    TuiButtonModule,
} from '@taiga-ui/core';

@NgModule({
    imports: [
        // ... 
        TuiButtonModule,

    ],
})
export class ExampleModule {}

```

And use it in your component as you can see in the [documentation](https://taiga-ui.dev/components/)

```html
<button
  tuiButton
  type="button">
  Button
</button>

```

## Overriding icons in components

TaigaUI comes with predefined icons for its components. If you want to override default icons and switch them for our own icons:

1. Ensure that the icon is added to our `sprite.svg` file.
2. TaigaUI expects a name of the icon in its properties, so you need to remaps its icons to our icons ID. In the example below, all taigaUI icons named `tuiIconSearch` will become our sprite icon with the ID `example`

```ts
const MAPPER: Record<string, string> = {
  // iconName: symbolId<Sprite>
  tuiIconSearch: 'example'
};
```

3. Use the icon in the component as expected

```html
<button
  tuiButton
  type="button"
  iconRight="tuiIconSearch">
  Disabled button
</button>
```

## Tools

Check https://taiga-ui.dev/getting-started to find interesting tools that we can use in Taiga.