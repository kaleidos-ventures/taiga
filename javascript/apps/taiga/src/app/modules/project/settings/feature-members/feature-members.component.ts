/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Project } from '@taiga/data';
import { filterNil } from '~/app/shared/utils/operators';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { initMembersPage } from './+state/actions/members.actions';
import { RxState } from '@rx-angular/state';
import {
  selectTotalInvitations,
  selectTotalMemberships,
} from './+state/selectors/members.selectors';
import { WsService } from '@taiga/ws';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as membersActions from '~/app/modules/project/settings/feature-members/+state/actions/members.actions';

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
export class ProjectsSettingsFeatureMembersComponent implements OnInit {
  public model$ = this.state.select();

  constructor(
    private store: Store,
    private wsService: WsService,
    private state: RxState<ComponentState>
  ) {
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

    this.store.dispatch(initMembersPage());
  }

  public ngOnInit(): void {
    this.wsService
      .events<{ project: string }>({
        channel: `projects.${this.state.get('project').slug}`,
        type: 'projectinvitations.create',
      })
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.store.dispatch(membersActions.updateMembersList());
      });

    this.wsService
      .events<{ project: string }>({
        channel: `projects.${this.state.get('project').slug}`,
        type: 'projectmemberships.create',
      })
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.store.dispatch(membersActions.updateMembersList());
      });

    this.wsService
      .events<{ project: string }>({
        channel: `projects.${this.state.get('project').slug}`,
        type: 'projectmemberships.update',
      })
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.store.dispatch(membersActions.updateMembersList());
      });
  }
}
