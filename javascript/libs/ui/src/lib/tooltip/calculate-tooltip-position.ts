/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { ConnectedPosition } from '@angular/cdk/overlay';
import { TooltipPosition } from './tooltip-position.model';

export const positionMapping: {
  key: TooltipPosition;
  config: ConnectedPosition;
}[] = [
  {
    key: 'bottom-left',
    config: {
      originX: 'end',
      originY: 'bottom',
      overlayX: 'end',
      overlayY: 'top',
    },
  },
  {
    key: 'bottom-right',
    config: {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
    },
  },
  {
    key: 'top-left',
    config: {
      originX: 'end',
      originY: 'top',
      overlayX: 'end',
      overlayY: 'bottom',
    },
  },
  {
    key: 'top-right',
    config: {
      originX: 'start',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'bottom',
    },
  },
  {
    key: 'bottom',
    config: {
      originX: 'center',
      originY: 'bottom',
      overlayX: 'center',
      overlayY: 'top',
    },
  },
  {
    key: 'top',
    config: {
      originX: 'center',
      originY: 'top',
      overlayX: 'center',
      overlayY: 'bottom',
    },
  },
];

export function calculateTooltipPositionByPreference(
  position: TooltipPosition
) {
  let positions = [...positionMapping];
  const isTop = position.includes('top');

  const selected = positions.find((item) => item.key === position);
  const topPositions = positions.filter(
    (item) => item.key.includes('top') && item.key !== position
  );
  const bottomPositions = positions.filter(
    (item) => item.key.includes('bottom') && item.key !== position
  );

  if (selected) {
    if (isTop) {
      positions = [
        selected,
        ...topPositions.filter((item) => item.key !== position),
        ...bottomPositions,
      ];
    } else {
      positions = [
        selected,
        ...bottomPositions.filter((item) => item.key !== position),
        ...topPositions,
      ];
    }
  }

  return positions.map((item) => item.config);
}
