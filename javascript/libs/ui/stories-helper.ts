/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { APP_BASE_HREF } from '@angular/common';

import {
  Args,
  ArgTypes,
  Meta,
  moduleMetadata,
  Story,
} from '@storybook/angular';

import { tuiSvgOptionsProvider } from '@taiga-ui/core';
import { paramCase } from 'change-case';
import { Component, Provider } from '@angular/core';
import {
  TranslocoTestingModule,
  TranslocoTestingOptions,
} from '@ngneat/transloco';
// eslint-disable-next-line @nx/enforce-module-boundaries
import imageUpload from 'apps/taiga/src/assets/i18n/image_upload/en-US.json';

// eslint-disable-next-line @nx/enforce-module-boundaries
import common from 'apps/taiga/src/assets/i18n/en-US.json';
import {
  ICollection,
  NgModuleMetadata,
} from '@storybook/angular/dist/client/types';

const altIconName: Record<string, string> = {
  tuiIconChevronDownLarge: 'chevron-down',
  tuiIconCheckLarge: 'check',
  tuiIconCloseLarge: 'close',
  tuiIconInfo: 'info',
  notificationInfo: 'info',
  tuiIconCancel: 'alert',
  tuiIconAttention: 'alert',
  tuiIconCheckCircle: 'check',
  tuiIconAlertCircle: 'alert',
  tuiIconXCircle: 'alert',
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
  component: unknown;
  declarations?: unknown[];
  extraModules?: unknown[];
  extraProviders?: Provider[];
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
      tuiSvgOptionsProvider({
        path: (src: string): string => {
          const name = altIconName[src] ?? src;
          const fileName = paramCase(name);

          return `assets/icons/${fileName}.svg#${fileName}`;
        },
      }),
    ],
    imports: [
      // Prevent Storybook error "Error: Uncaught (in promise): Error: Cannot match any routes. URL Segment: 'iframe.html'"
      // RouterModule.forRoot([], { useHash: true }),
      ...(config.extraModules || []),
    ],
  };

  config.decorators?.push(moduleMetadata(module));

  return {
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
