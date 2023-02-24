/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'tg-story-detail-skeleton',
  standalone: true,
  templateUrl: './story-detail-skeleton.component.html',
  styleUrls: ['./story-detail-skeleton.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class StoryDetailSkeletonComponent {
  @Input()
  public isCollapsed?: boolean;
}
