/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { Project } from '@taiga/data';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { filterNil } from '~/app/shared/utils/operators';
import { membersActions } from './+state/actions/members.actions';
import {
  selectTotalInvitations,
  selectTotalMemberships,
} from './+state/selectors/members.selectors';

interface ComponentState {
  project: Project;
  totalMembers: number;
  totalPending: number;
}

@UntilDestroy()
@Component({
  selector: 'tg-projects-settings-feature-members',
  templateUrl: './feature-members.component.html',
  styleUrls: [
    './feature-members.component.css',
    '../styles/settings.styles.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
})
export class ProjectsSettingsFeatureMembersComponent {
  public model$ = this.state.select();
  public invitePeopleModal = false;

  constructor(private store: Store, private state: RxState<ComponentState>) {
    this.state.connect(
      'project',
      this.store.select(selectCurrentProject).pipe(filterNil())
    );

    this.state.connect(
      'totalMembers',
      this.store.select(selectTotalMemberships)
    );

    this.state.connect(
      'totalPending',
      this.store.select(selectTotalInvitations)
    );

    this.store.dispatch(membersActions.initProjectMembers());
  }

  public openModal() {
    this.invitePeopleModal = true;
  }

  public closeModal() {
    this.invitePeopleModal = false;
  }

  public onInviteSuccess() {
    this.store.dispatch(
      membersActions.updateMembersList({ eventType: 'create' })
    );
  }
}
