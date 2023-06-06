/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'tg-comment-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './comment-skeleton.component.html',
  styleUrls: ['./comment-skeleton.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentSkeletonComponent {}
