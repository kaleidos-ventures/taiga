/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ProjectFeatureKanbanModule } from '../feature-kanban/project-feature-kanban.module';
import { Workflow } from '@taiga/data';

@Component({
  selector: 'tg-project-feature-view-setter-kanban',
  template:
    '<tg-project-feature-kanban [workflowSlug]="workflowSlug"></tg-project-feature-kanban>',
  styles: [''],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [ProjectFeatureKanbanModule],
})
export class ProjectFeatureViewSetterKanbanComponent {
  @Input()
  public workflowSlug!: Workflow['slug'];
}
