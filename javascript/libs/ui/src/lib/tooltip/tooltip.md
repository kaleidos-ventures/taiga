# tgUiTooltip

`tgUiTooltip` is a tooltip directive that allows you to easily add tooltips to your elements.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Accessibility](#accessibility)
- [Css variables](#css-variables)

## Installation

To use the `tgUiTooltip`, you need to import it into your module/component:

```javascript
import { TooltipDirective } from '@taiga/ui/tooltip';
```

## Usage

Here is an example of how to use `tgUiTooltip` with a simple string:

```html
<button tgUiTooltip="Explain button">Action</button>
```

You can also use a template for the tooltip content:

```html
<button [tgUiTooltip]="tooltipTemplate">Action</button>

<ng-template #tooltipTemplate>
  <p>Explain button</p>
</ng-template>
```

## Configuration

The tooltip can be customized with a set of properties:

```html
<button
  tgUiTooltip="Explain button"
  [tgUiTooltipDisabled]="true"
  [tgUiTooltipOffsetX]="0"
  [tgUiTooltipOffsetY]="0"
  tgUiTooltipPosition="top-left"
  [tgUiTooltipCreateAccesibleTooltip]="true"
  [tgUiTooltipDelayOpen]="300"
  [tgUiTooltipDelayClose]="0"
  [tgUiTooltipStaysOpenOnHover]="true">
  Action
</button>
```

The following properties are available:

- `tgUiTooltipDisabled`: Disables the tooltip. Default is `true`.
- `tgUiTooltipOffsetX`: The X offset for the tooltip. Default is `0`.
- `tgUiTooltipOffsetY`: The Y offset for the tooltip. Default is `8`.
- `tgUiTooltipPosition`: The position of the tooltip. Default is `"bottom-left"`.
- `tgUiTooltipCreateAccesibleTooltip`: Create a hidden always visible tooltip to comply with accessibility rules to help screen readers. Default is `true`.
- `tgUiTooltipDelayOpen`: The delay in milliseconds before the tooltip opens. Default is `300`.
- `tgUiTooltipDelayClose`: The delay in milliseconds before the tooltip closes. Default is `0`.
- `tgUiTooltipStaysOpenOnHover`: The tooltip could have the mouse hover it. Default is `true`.

## Accessibility

The `tgUiTooltipCreateAccesibleTooltip` flag is used to create an always visible tooltip to comply with accessibility rules and help screen readers. But It can be disabled to use your custom tooltip:

```html
<button
  [tgUiTooltip]="tooltipTemplate"
  [tgUiTooltipCreateAccesibleTooltip]="false"
  aria-describedby="description">
  Action
</button>

<div
  id="description"
  role="tooltip"
  class="visually-hidden">
  Button description
</div>
```

In this case, the `aria-describedby` attribute should be used to reference the id of the description element.

## CSS Variables

This component uses several CSS custom properties for styling. You can override these to customize the appearance of the tooltips:

- `--tooltip-color`: Color of the tooltip text. Default is `var(--color-white)`.
- `--tooltip-background-color`: Background color of the tooltip. Default is `var(--color-gray100)`.
- `--tooltip-radius`: Border radius of the tooltip. Default is `4px`.
- `--arrow-position`: Position of the tooltip arrow. Default is `var(--spacing-20)`.
- `--max-width`: Max width tooltip. Default is `300px`.
- `--empty-space-with-trigger`: This is an invisible space that prevents the triggering of a `mouseleave` event due to overlapping elements. It is not the actual space between the button and the tooltip element but serves to control the behavior of the tooltip when the mouse is moved over specific areas. The default value is `calc(var(--spacing-12) * -1)`.
