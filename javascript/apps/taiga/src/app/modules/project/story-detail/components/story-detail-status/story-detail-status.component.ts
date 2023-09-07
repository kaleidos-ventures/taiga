/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RxState } from '@rx-angular/state';
import { Status } from '@taiga/data';
import {
  StoryDetailForm,
  StoryDetailState,
} from '~/app/modules/project/story-detail/story-detail.component';
import {
  TuiTextfieldControllerModule,
  TuiDataListModule,
} from '@taiga-ui/core';
import { TuiSelectModule } from '@taiga-ui/kit';

import { CommonModule } from '@angular/common';
import { TranslocoDirective } from '@ngneat/transloco';
import { InputsModule } from '@taiga/ui/inputs';
import { StatusColorPipe } from '~/app/shared/pipes/status-color/status-color.pipe';

@Component({
  selector: 'tg-story-detail-status',
  templateUrl: './story-detail-status.component.html',
  styleUrls: ['./story-detail-status.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    ReactiveFormsModule,
    InputsModule,
    TuiSelectModule,
    TuiTextfieldControllerModule,
    TuiDataListModule,
    StatusColorPipe,
  ],
})
export class StoryDetailStatusComponent {
  @Input()
  public form!: FormGroup<StoryDetailForm>;

  public model$ = this.state.select();

  constructor(private state: RxState<StoryDetailState>) {}

  public trackByStatus(_index: number, status: Status) {
    return status.id;
  }
}
