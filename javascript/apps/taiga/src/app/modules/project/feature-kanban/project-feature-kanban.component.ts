/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';

@Component({
  selector: 'tg-project-feature-kanban',
  templateUrl: './project-feature-kanban.component.html',
  styleUrls: ['./project-feature-kanban.component.css'],
})
export class ProjectFeatureKanbanComponent {
  public invitePeopleModal = false;

  constructor(private store: Store) {
    const state = window.history.state as { invite: boolean } | undefined;
    this.invitePeopleModal = !!state?.invite;
  }

  public project$ = this.store.select(selectCurrentProject);

  public closeModal() {
    this.invitePeopleModal = false;
  }
}
