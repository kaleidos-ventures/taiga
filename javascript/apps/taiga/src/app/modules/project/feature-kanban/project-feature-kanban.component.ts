/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Component } from '@angular/core';
import { User } from '@taiga/data';
import { Store } from '@ngrx/store';
import { inviteUsersNewProject } from '~/app/modules/feature-new-project/+state/actions/new-project.actions';

@Component({
  selector: 'tg-project-feature-kanban',
  templateUrl: './project-feature-kanban.component.html',
  styleUrls: ['./project-feature-kanban.component.css'],
})
export class ProjectFeatureKanbanComponent {
  public invitePeopleModal = false;

  constructor(
    private store: Store
  ) {
    const state = window.history.state as {invite: boolean} | undefined;
    this.invitePeopleModal = !!state?.invite;
  }

  public onInvite(users: Partial<User>[]) {
    if (users.length) {
      console.log('This user will be added', users);
    }

    this.store.dispatch(inviteUsersNewProject());
  }

  public closeModal() {
    this.invitePeopleModal = false;
  }
}
