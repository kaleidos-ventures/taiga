/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { style, animate, trigger, transition } from '@angular/animations';

export const fadeIntOutAnimation = trigger('fadeInOut', [
  transition(':enter', [
    style({
      opacity: '0'
    }),
    animate('300ms ease-in', style({
      opacity: '1'
    }))
  ]),
  transition(':leave', [
    animate('300ms ease-in', style({
      blockSize: '0',
    }))
  ])
]);

export const slideInOut = trigger('slideInOut', [
  transition(':enter', [
    style({
      blockSize: '0',
      opacity: '0'
    }),
    animate('200ms ease-in', style({
      blockSize: '*',
      opacity: '1'
    }))
  ]),
  transition(':leave', [
    animate('200ms ease-in', style({
      blockSize: '0',
      opacity: '0'
    }))
  ])
]);
