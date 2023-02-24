/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

export class RandomColorService {
  public static randomColorPicker(): number {
    const max = 8;
    const min = 1;
    return Math.floor(Math.random() * (max - min) + min);
  }

  public static getColorClass(colorId: number): string {
    return 'color-' + colorId.toString();
  }
}
