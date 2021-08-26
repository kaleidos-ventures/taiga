/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ConfigureStory, ConfigureTemplate, EmptyComponent } from '@storybook-helper';
import { TuiButtonModule, TuiLinkModule, TuiSvgModule } from '@taiga-ui/core';

export default ConfigureStory({
  title: 'Buttons',
  component: EmptyComponent,
  extraModules: [ TuiButtonModule, TuiSvgModule, TuiLinkModule ],
});


const baseArgs = {
  label: 'Text',
};

const baseArgTypes = {
  icon: {
    defaultValue: 'folder',
    options: ['folder', 'help', 'discover', 'bell', 'taiga-logo'],
    control: { type: 'select' }
  },
  disabled: {
    defaultValue: false,
    options: [false, true],
    control: { type: 'radio' }
  },
};

export const Primary = ConfigureTemplate({
  template: `
  <div class="story-flex">
    <div class="story-section">
      <h1>Normal</h1>
      <div class="story-flex">
      <label class="story-label">Text</label>
        <button
          appearance="primary"
          [disabled]="disabled"
          tuiButton
          title="ADD TITLE"
          type="button">
          {{label}}
        </button>
      </div>
      <br >
      <div class="story-flex">
      <label class="story-label">Icon + text</label>
        <button
          appearance="primary"
          [disabled]="disabled"
          tuiButton
          icon="{{icon}}"
          title="ADD TITLE"
          type="button">
          {{label}}
        </button>
      </div>
      <br >
      <div class="story-flex">
        <label class="story-label">Text + icon</label>
        <button
          appearance="primary"
          [disabled]="disabled"
          tuiButton
          iconRight="{{icon}}"
          title="ADD TITLE"
          type="button">
          {{label}}
        </button>
      </div>
      <br >
      <div class="story-flex">
      <label class="story-label">Icon</label>
        <button
          appearance="primary"
          [disabled]="disabled"
          tuiIconButton
          icon="{{icon}}"
          title="ADD TITLE"
          type="button"
        >
          <span class="visually-hidden">ADD ACCESIBILITY TEXT</span>
        </button>
      </div>
    </div>
    <div class="story-section">
      <h1>Large</h1>
      <div class="story-flex">
      <label class="story-label">Text</label>
        <button
          appearance="primary"
          [disabled]="disabled"
          class="large"
          tuiButton
          title="ADD TITLE"
          type="button">
          {{label}}
        </button>
      </div>
      <br >
      <div class="story-flex">
      <label class="story-label">Icon + text</label>
        <button
          appearance="primary"
          [disabled]="disabled"
          class="large"
          tuiButton
          icon="{{icon}}"
          title="ADD TITLE"
          type="button">
          {{label}}
        </button>
      </div>
      <br >
      <div class="story-flex">
        <label class="story-label">Text + icon</label>
        <button
          appearance="primary"
          [disabled]="disabled"
          class="large"
          tuiButton
          iconRight="{{icon}}"
          title="ADD TITLE"
          type="button">
          {{label}}
        </button>
      </div>
      <br >
    </div>
  </div>
  `,
  args: baseArgs,
  argTypes: baseArgTypes,
});

export const Secondary = ConfigureTemplate({
  template: `
  <div class="story-flex">
  <label class="story-label">Text</label>
    <button
      appearance="secondary"
      [disabled]="disabled"
      tuiButton
      title="ADD TITLE"
      type="button">
      {{label}}
    </button>
  </div>
  <br >
  <div class="story-flex">
  <label class="story-label">Icon + text</label>
    <button
      appearance="secondary"
      [disabled]="disabled"
      tuiButton
      icon="{{icon}}"
      title="ADD TITLE"
      type="button">
      {{label}}
    </button>
  </div>
  <br >
  <div class="story-flex">
    <label class="story-label">Text + icon</label>
    <button
      appearance="secondary"
      [disabled]="disabled"
      tuiButton
      iconRight="{{icon}}"
      title="ADD TITLE"
      type="button">
      {{label}}
    </button>
  </div>
  <br >
  <div class="story-flex">
  <label class="story-label">Icon</label>
    <button
      appearance="secondary"
      [disabled]="disabled"
      tuiIconButton
      icon="{{icon}}"
      title="ADD TITLE"
      type="button"
    >
      <span class="visually-hidden">ADD ACCESIBILITY TEXT</span>
    </button>
  </div>
  `,
  args: baseArgs,
  argTypes: baseArgTypes
});

export const Destructive = ConfigureTemplate({
  template: `
  <div class="story-flex">
  <label class="story-label">Text</label>
    <button
      appearance="destructive"
      [disabled]="disabled"
      tuiButton
      title="ADD TITLE"
      type="button">
      {{label}}
    </button>
  </div>
  <br >
  <div class="story-flex">
  <label class="story-label">Icon + text</label>
    <button
      appearance="destructive"
      [disabled]="disabled"
      tuiButton
      icon="{{icon}}"
      title="ADD TITLE"
      type="button">
      {{label}}
    </button>
  </div>
  <br >
  <div class="story-flex">
    <label class="story-label">Text + icon</label>
    <button
      appearance="destructive"
      [disabled]="disabled"
      tuiButton
      iconRight="{{icon}}"
      title="ADD TITLE"
      type="button">
      {{label}}
    </button>
  </div>
  <br >
  <div class="story-flex">
  <label class="story-label">Icon</label>
    <button
      appearance="destructive"
      [disabled]="disabled"
      tuiIconButton
      icon="{{icon}}"
      title="ADD TITLE"
      type="button"
    >
      <span class="visually-hidden">ADD ACCESIBILITY TEXT</span>
    </button>
  </div>
  `,
  args: baseArgs,
  argTypes: baseArgTypes
});

export const Tertiary = ConfigureTemplate({
  template: `
  <div class="story-flex">
  <label class="story-label">Text</label>
    <button
      appearance="tertiary"
      [disabled]="disabled"
      tuiButton
      title="ADD TITLE"
      type="button">
      {{label}}
    </button>
  </div>
  <br >
  <div class="story-flex">
    <label class="story-label">Icon + text</label>
    <button
      appearance="tertiary"
      [disabled]="disabled"
      tuiButton
      icon="{{icon}}"
      title="ADD TITLE"
      type="button">
      {{label}}
    </button>
  </div>
  <br >
  <div class="story-flex">
    <label class="story-label">Icon + text + Notif.</label>
    <button
      appearance="tertiary"
      [disabled]="disabled"
      tuiButton
      icon="{{icon}}"
      title="ADD TITLE"
      type="button">
      {{label}}
      <span class="notification-counter">5</span>
    </button>
  </div>
  <br>
  <div class="story-flex">
    <label class="story-label">Text + icon</label>
    <button
      appearance="tertiary"
      [disabled]="disabled"
      tuiButton
      iconRight="{{icon}}"
      title="ADD TITLE"
      type="button">
      {{label}}
    </button>
  </div>
  <br >
  <div class="story-flex">
  <label class="story-label">Icon</label>
    <button
      appearance="tertiary"
      [disabled]="disabled"
      tuiIconButton
      icon="{{icon}}"
      title="ADD TITLE"
      type="button"
    >
      <span class="visually-hidden">ADD ACCESIBILITY TEXT</span>
    </button>
  </div>
  `,
  args: baseArgs,
  argTypes: baseArgTypes
});

export const IconLinks = ConfigureTemplate({
  template: `
  <div class="story-flex">
    <label class="story-label">Text + icon</label>
    <a
      tuiLink
      icon="{{icon}}"
      title="ADD TITLE">
      {{label}}
    </a>
  </div>
  <br >
  <div class="story-flex">
    <label class="story-label">Icon + text</label>
    <a
      tuiLink
      icon="{{icon}}"
      iconAlign="left"
      title="ADD TITLE">
      {{label}}
    </a>
  </div>
  `,
  args: baseArgs,
  argTypes: baseArgTypes
});

export const ButtonForm = ConfigureTemplate({
  template: `
  <div>
    <button
      appearance="button-form"
      tuiIconButton
      icon="{{icon}}"
      type="button">
      <span class="visually-hidden">Test2</span>
      </button>
  </div>
  `,
  args: baseArgs,
  argTypes: baseArgTypes
});

export const ActionButton = ConfigureTemplate({
  template: `
  <div>
    <button
      appearance="action-button"
      tuiIconButton
      icon="{{icon}}"
      type="button">
      <span class="visually-hidden">Test2</span>
      </button>
  </div>
  `,
  args: baseArgs,
  argTypes: baseArgTypes
});

export const USHeaderButton = ConfigureTemplate({
  template: `
  <div class="story-flex">
    <label class="story-label">Default</label>
    <button
      appearance="us-header-button"
      tuiIconButton
      icon="{{icon}}"
      type="button">
      <span class="visually-hidden">Test2</span>
      </button>
  </div>
  <br>
  <div class="story-flex">
    <label class="story-label">Blocked US</label>
    <button
      appearance="us-header-button"
      blocked
      tuiIconButton
      icon="{{icon}}"
      type="button">
      <span class="visually-hidden">Test2</span>
      </button>
  </div>
  `,
  args: baseArgs,
  argTypes: baseArgTypes
});
