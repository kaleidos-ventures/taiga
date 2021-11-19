/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TuiSizeXS, TuiSizeXXL } from '@taiga-ui/core';
import { RandomColorService } from '../services/random-color/random-color.service';

@Component({
  selector: 'tg-ui-avatar',
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarComponent  {

  @Input()
  public size: TuiSizeXS | TuiSizeXXL = 'l';

  @Input()
  public name = '';

  @Input()
  public url = '';

  @Input()
  public color = 1;

  @Input()
  public type: 'dark' | 'light' = 'light';

  public setColorClass() {
    return RandomColorService.getColorClass(this.color);
  }

  public setAvatarName(name: string) {
    return name.replace(/\s/g, '').split('').slice(0, 2).join(' ');
  }
}
