/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { Membership, Project } from '@taiga/data';
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import * as ProjectActions from '~/app/modules/project/data-access/+state/actions/project.actions';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { membersActions } from '~/app/modules/project/settings/feature-members/+state/actions/members.actions';
import { initRolesPermissions } from '~/app/modules/project/settings/feature-roles-permissions/+state/actions/roles-permissions.actions';
import { AppService } from '~/app/services/app.service';
import { WsService } from '~/app/services/ws';
import { filterNil } from '~/app/shared/utils/operators';

@UntilDestroy()
@Component({
  selector: 'tg-feature-settings',
  templateUrl: './feature-settings.component.html',
  styleUrls: ['./feature-settings.component.css'],
  providers: [RxState],
  standalone: true,
  imports: [CommonModule, RouterOutlet],
})
export class ProjectsSettingsFeatureSettingsComponent {
  public user$ = this.store.select(selectUser);

  constructor(
    private store: Store,
    private actions$: Actions,
    private router: Router,
    private appService: AppService,
    private wsService: WsService,
    private state: RxState<{
      project: Project;
    }>
  ) {
    this.state.connect(
      'project',
      this.store.select(selectCurrentProject).pipe(filterNil())
    );

    this.actions$
      .pipe(ofType(ProjectActions.fetchProjectSuccess), untilDestroyed(this))
      .subscribe((action) => {
        if (!action.project.userIsAdmin) {
          this.userLoseAdminRole(action.project.id, action.project.slug);
        } else if (action.project.userIsAdmin) {
          this.store.dispatch(
            initRolesPermissions({ project: action.project })
          );
        }
      });

    this.wsService
      .events<{ project: string }>({
        channel: `projects.${this.state.get('project').id}`,
        type: 'projectmemberships.create',
      })
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.store.dispatch(membersActions.updateMemberInfo());
      });

    this.wsService
      .events<{ membership: Membership }>({
        channel: `projects.${this.state.get('project').id}`,
        type: 'projectmemberships.update',
      })
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.store.dispatch(membersActions.updateMemberInfo());
      });

    this.wsService
      .userEvents<{ membership: Membership }>('projectmemberships.update')
      .pipe(untilDestroyed(this))
      .subscribe((eventResponse) => {
        const response = eventResponse.event.content;
        if (!response.membership.role.isAdmin) {
          this.userLoseAdminRole();
        }
      });
  }

  public userLoseAdminRole(
    projectId?: Project['id'],
    projectSlug?: Project['slug']
  ) {
    void this.router.navigateByUrl(
      `project/${projectId ?? this.state.get('project').id}/${
        projectSlug ?? this.state.get('project').slug
      }/overview`
    );
  }
}
