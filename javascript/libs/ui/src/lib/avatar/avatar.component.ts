/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
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
export class AvatarComponent {
  @Input()
  public autoColor = false;

  @Input()
  public avatarUrl = '';

  @Input()
  public rounded = false;

  @Input()
  public size: TuiSizeXS | TuiSizeXXL = 'l';

  @Input()
  public name = '';

  @Input()
  public color = 1;

  @Input()
  public type: 'dark' | 'light' = 'light';

  public setColorClass() {
    return RandomColorService.getColorClass(this.color);
  }

  public setAvatarName(name: string) {
    const chunks = name.split(' ').slice(0, 2);
    const tempName: string[] = [];
    let firstIsIcon = false;
    chunks.forEach((chunk, i) => {
      if (this.isItAnIcon(chunk) && i === 0) {
        // necessary to display emoji in the avatar
        tempName.push(chunk.split('').join(' '));
        firstIsIcon = true;
      } else if (!this.isItAnIcon(chunk) && !firstIsIcon) {
        tempName.push(chunk[0]);
      }
    });

    return tempName.join(' ');
  }

  public isItAnIcon(chunk: string) {
    const regexExp =
      /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/gi;
    return regexExp.test(chunk);
  }
}
