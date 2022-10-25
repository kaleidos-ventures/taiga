/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { APP_BASE_HREF } from '@angular/common';
import {
  ICollection,
  NgModuleMetadata,
} from '@storybook/angular/dist/ts3.9/client/preview/types';
import { Args, ArgTypes, moduleMetadata, Story } from '@storybook/angular';
import { Meta } from '@storybook/angular/types-6-0';
import { TUI_ICONS_PATH } from '@taiga-ui/core';
import { paramCase } from 'change-case';
import { Component } from '@angular/core';
import {
  TranslocoTestingModule,
  TranslocoTestingOptions,
} from '@ngneat/transloco';
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import imageUpload from 'apps/taiga/src/assets/i18n/image_upload/en-US.json';

// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import common from 'apps/taiga/src/assets/i18n/en-US.json';

const altIconName: Record<string, string> = {
  tuiIconChevronDownLarge: 'chevron-down',
};

function getTranslocoModule(options: TranslocoTestingOptions = {}) {
  return TranslocoTestingModule.forRoot({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    langs: {
      en: {
        ...common,
        image_upload: imageUpload,
      },
    },
    translocoConfig: {
      availableLangs: ['en'],
      defaultLang: 'en',
    },
    preloadLangs: true,
    ...options,
  });
}

export function iconsPath(name: string): string {
  name = altIconName[name] ?? name;
  return `assets/icons/sprite.svg#${paramCase(name)}`;
}
export const ConfigureStory = (config: {
  title: string;
  component: unknown;
  declarations?: unknown[];
  extraModules?: unknown[];
  extraProviders?: unknown[];
  routing?: boolean;
  translations?: boolean;
  decorators?: Meta['decorators'];
}) => {
  config = {
    routing: true,
    translations: true,
    decorators: [],
    extraModules: [],
    extraProviders: [],
    ...config,
  };

  if (config.translations) {
    config.extraModules?.push(getTranslocoModule());
  }

  const module: Partial<NgModuleMetadata> = {
    declarations: [...(config.declarations || [])],
    providers: [
      ...(config.extraProviders || []),
      { provide: APP_BASE_HREF, useValue: '/' },
      {
        provide: TUI_ICONS_PATH,
        useValue: iconsPath,
      },
    ],
    imports: [
      // Prevent Storybook error "Error: Uncaught (in promise): Error: Cannot match any routes. URL Segment: 'iframe.html'"
      // RouterModule.forRoot([], { useHash: true }),
      ...(config.extraModules || []),
    ],
  };

  config.decorators?.push(moduleMetadata(module));

  return {
    title: config.title,
    component: config.component,
    decorators: config.decorators,
  } as Meta;
};

export const ConfigureTemplate = (config: {
  template?: string;
  props?: ICollection;
  args?: Partial<Args>;
  argTypes?: ArgTypes;
}) => {
  const Template: Story<typeof config['args']> = (
    args: typeof config['args']
  ) => {
    return {
      template: config.template ? config.template : undefined,
      props: {
        ...config.props,
        ...args,
      },
    };
  };

  const Primary = Template.bind({});

  Primary.args = config.args;
  Primary.argTypes = config.argTypes;

  return Primary;
};

@Component({
  selector: 'tg-ui-emtpy',
  template: '',
  styleUrls: [],
})
export class EmptyComponent {}
