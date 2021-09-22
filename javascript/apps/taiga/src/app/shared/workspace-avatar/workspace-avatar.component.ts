/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TuiSizeXS, TuiSizeXXL } from '@taiga-ui/core';

@Component({
  selector: 'tg-workspace-avatar',
  templateUrl: './workspace-avatar.component.html',
  styleUrls: ['./workspace-avatar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceAvatarComponent  {

  @Input()
  public size: TuiSizeXS | TuiSizeXXL = 'l';

  @Input()
  public name = '';

  @Input()
  public url = '';

  @Input()
  public color = 1;

  public setColorClass(color: number) {
    return "color-" + color.toString();
  }
}
