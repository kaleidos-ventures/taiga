/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { KanbanTask } from '~/app/modules/project/feature-kanban/kanban.model';

@Component({
  selector: 'tg-kanban-task',
  templateUrl: './kanban-task.component.html',
  styleUrls: ['./kanban-task.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanTaskComponent {
  @Input()
  public task!: KanbanTask;

  @Input()
  public index!: number;

  @Input()
  public total!: number;
}
