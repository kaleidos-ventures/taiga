/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  animate,
  style,
  transition,
  trigger,
  state,
} from '@angular/animations';

export const fadeIntOutAnimation = trigger('fadeInOut', [
  transition(':enter', [
    style({
      opacity: '0',
    }),
    animate(
      '300ms ease-in',
      style({
        opacity: '1',
      })
    ),
  ]),
  transition(':leave', [
    animate(
      '300ms ease-in',
      style({
        blockSize: '0',
      })
    ),
  ]),
]);

export const slideInOut = trigger('slideInOut', [
  transition(':enter', [
    style({
      blockSize: '0',
      opacity: '0',
    }),
    animate(
      '200ms ease-in',
      style({
        blockSize: '*',
        opacity: '1',
      })
    ),
  ]),
  transition(':leave', [
    animate(
      '200ms ease-in',
      style({
        blockSize: '0',
        opacity: '0',
      })
    ),
  ]),
]);

/** Conditional animation */
export const conSlideInOut = trigger('conSlideInOut', [
  transition('void => disabled', []),
  transition('void => enabled', [
    style({
      blockSize: '0',
      opacity: '0',
    }),
    animate(
      '200ms ease-in',
      style({
        blockSize: '*',
        opacity: '1',
      })
    ),
  ]),
  transition('disabled => void', []),
  transition('enabled => void', [
    animate(
      '200ms ease-in',
      style({
        blockSize: '0',
        opacity: '0',
      })
    ),
  ]),
]);

export const slideInOut400 = trigger('slideInOut', [
  transition(':enter', [
    style({
      blockSize: '0',
      opacity: '0',
    }),
    animate(
      '400ms ease-out',
      style({
        blockSize: '*',
        opacity: '1',
      })
    ),
  ]),
  transition(':leave', [
    animate(
      '400ms ease-out',
      style({
        blockSize: '0',
        opacity: '0',
      })
    ),
  ]),
]);

export const slideIn = trigger('slideIn', [
  transition(':enter', [
    style({
      blockSize: '0',
      opacity: '0',
    }),
    animate(
      '200ms ease-in',
      style({
        blockSize: '*',
        opacity: '1',
      })
    ),
  ]),
]);

export const removeCell = trigger('removeCell', [
  state(
    'inactive',
    style({
      opacity: 1,
      transform: 'translateY(0%)',
    })
  ),
  state(
    'active',
    style({
      opacity: 0,
      transform: 'translateY(-100%)',
    })
  ),
  transition('inactive => active', [
    style({ opacity: 0.7 }),
    animate('0.3s 0.5s'),
  ]),
  transition('active => inactive', [animate('0.3s')]),
]);

export const showUndo = trigger('showUndo', [
  transition(':enter', [
    style({
      opacity: 0,
      transform: 'translateY(0%)',
    }),
    animate(
      '400ms 0.5s ease-out',
      style({
        opacity: 1,
        transform: 'translateY(-100%)',
      })
    ),
  ]),
  transition(':leave', [
    animate(
      '400ms ease-out',
      style({
        opacity: 0,
        transform: 'translateX(0%)',
      })
    ),
  ]),
]);

export const undoDone = trigger('undoDone', [
  transition(':enter', [
    style({
      opacity: 0,
      transform: 'translateX(100%)',
    }),
    animate(
      '400ms ease-out',
      style({
        opacity: 1,
        transform: 'translateX(0%)',
      })
    ),
  ]),
  transition(':leave', [
    animate(
      '400ms ease-out',
      style({
        opacity: 0,
        transform: 'translateX(100%)',
      })
    ),
  ]),
]);
