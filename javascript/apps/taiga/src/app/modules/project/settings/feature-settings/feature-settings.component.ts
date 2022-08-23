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
import { TuiNotification } from '@taiga-ui/core';
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import * as ProjectActions from '~/app/modules/project/data-access/+state/actions/project.actions';
import { initRolesPermissions } from '~/app/modules/project/settings/feature-roles-permissions/+state/actions/roles-permissions.actions';
import { AppService } from '~/app/services/app.service';

@UntilDestroy()
@Component({
  selector: 'tg-feature-settings',
  templateUrl: './feature-settings.component.html',
  styleUrls: ['./feature-settings.component.css'],
})
export class ProjectsSettingsFeatureSettingsComponent {
  public user$ = this.store.select(selectUser);

  constructor(
    private store: Store,
    private actions$: Actions,
    private router: Router,
    private appService: AppService
  ) {
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
  }
}
