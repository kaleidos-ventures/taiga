/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { RxState } from '@rx-angular/state';
import { Status } from '@taiga/data';
import { StoryDetailForm, StoryDetailState } from '../story-detail.component';

@Component({
  selector: 'tg-story-detail-status',
  templateUrl: './story-detail-status.component.html',
  styleUrls: ['./story-detail-status.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoryDetailStatusComponent {
  @Input()
  public form!: FormGroup<StoryDetailForm>;

  public model$ = this.state.select();

  constructor(private state: RxState<StoryDetailState>) {}

  public trackByStatus(_index: number, status: Status) {
    return status.slug;
  }
}
