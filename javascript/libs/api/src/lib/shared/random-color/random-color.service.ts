/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RandomColorService {
  public randomColorPicker() {
    const max = 8;
    const min = 1;
    return Math.floor(Math.random() * (max - min) + min);
  }

  public getColorClass(colorId: number) {
    return "color-" + colorId.toString();
  }
}
