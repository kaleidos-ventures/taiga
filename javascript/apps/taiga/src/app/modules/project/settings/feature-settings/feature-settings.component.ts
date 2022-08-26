/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { TuiNotification } from '@taiga-ui/core';
import { Project } from '@taiga/data';
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
          this.appService.toastNotification({
            message: 'members.no_longer_admin',
            status: TuiNotification.Warning,
            scope: 'project_settings',
            closeOnNavigation: false,
          });
          void this.router.navigate(['/project/', action.project.slug]);
        } else if (action.project.userIsAdmin) {
          this.store.dispatch(
            initRolesPermissions({ project: action.project })
          );
        }
      });

    this.wsService
      .events<{ project: string }>({
        channel: `projects.${this.state.get('project').slug}`,
        type: 'projectmemberships.create',
      })
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.store.dispatch(membersActions.updateMemberInfo());
      });

    this.wsService
      .events<{ project: string }>({
        channel: `projects.${this.state.get('project').slug}`,
        type: 'projectmemberships.update',
      })
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.store.dispatch(membersActions.updateMemberInfo());
      });
  }
}
