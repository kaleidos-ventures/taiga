/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';
import { TuiSizeXS, TuiSizeXXL } from '@taiga-ui/core';
import { RandomColorService } from '../services/random-color/random-color.service';

@Component({
  selector: 'tg-ui-avatar',
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarComponent implements OnInit  {

  @Input()
  public size: TuiSizeXS | TuiSizeXXL = 'l';

  @HostBinding('class') public sizeClass = `avatar-${this.size}`;

  @Input()
  public name = '';

  @Input()
  public url = '';

  @Input()
  public color = 1;

  @Input()
  public type: 'dark' | 'light' = 'dark';

  public ngOnInit() {
    this.sizeClass = `avatar-${this.size}`;
  }

  public setColorClass() {
    if (!this.url) {
      return RandomColorService.getColorClass(this.color);
    }

    // todo: border-color
    return '';
  }

  public setAvatarName(name: string) {
    return name.substring(0, 2).split('').join(' ');
  }
}
