/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { APP_BASE_HREF } from '@angular/common';
import { ICollection, NgModuleMetadata } from '@storybook/angular/dist/ts3.9/client/preview/types';
import { Args, moduleMetadata, Story } from '@storybook/angular';
import { Meta } from '@storybook/angular/types-6-0';

export const ConfigureStory = (config: {
  title: string,
  component: unknown,
  declarations?: unknown[],
  extraModules?: unknown[],
  routing?: boolean,
  translations?: boolean,
}) => {
  config = {
    routing: true,
    translations: true,
    ...config,
  };

  const module: Partial<NgModuleMetadata> = {
    declarations: [
      ...config.declarations || [],
    ],
    providers: [
      { provide: APP_BASE_HREF, useValue: '/' }
    ],
    imports: [
      // Prevent Storybook error "Error: Uncaught (in promise): Error: Cannot match any routes. URL Segment: 'iframe.html'"
      // RouterModule.forRoot([], { useHash: true }),
      // TranslateModule.forRoot(),
      ...config.extraModules || [],
    ],
  };

  return {
    title: config.title,
    component: config.component,
    decorators: [
      moduleMetadata(module),
    ]
  } as Meta;
};


export const ConfigureTemplate = (config: {
  template?: string;
  props?: ICollection,
  args?: Partial<Args>,
}) => {
  const Template: Story<typeof config['args']> = (args: typeof config['args']) => {
    return {
      template: config.template ? config.template : undefined,
      props: {
        ...config.props,
        ...args
      },
    };
  }

  const Primary = Template.bind({});

  Primary.args = config.args;

  return Primary;
};
