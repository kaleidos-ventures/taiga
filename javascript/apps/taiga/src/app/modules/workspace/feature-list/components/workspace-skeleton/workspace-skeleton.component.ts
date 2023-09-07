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
import { CardSkeletonComponent } from '@taiga/ui/skeletons/card-skeleton/card-skeleton.component';

@Component({
  selector: 'tg-workspace-skeleton',
  templateUrl: './workspace-skeleton.component.html',
  styleUrls: ['../../../styles/workspace-skeleton.shared.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, CardSkeletonComponent],
})
export class WorkspaceSkeletonComponent {
  @HostBinding('class.static') @Input() public static = false;
}
