/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  Input,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'tg-nouser-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nouser-avatar.component.html',
  styleUrls: ['./nouser-avatar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NouserAvatarComponent {
  @Input()
  public alt = '';

  @HostBinding('attr.aria-hidden')
  @Input()
  public ariaHidden = true;
}
