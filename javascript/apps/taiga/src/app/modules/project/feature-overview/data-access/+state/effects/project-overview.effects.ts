/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { fetch } from '@nrwl/angular';
import { ProjectApiService } from '@taiga/api';
import { zip } from 'rxjs';
import { map } from 'rxjs/operators';
import * as ProjectOverviewActions from '../actions/project-overview.actions';

@Injectable()
export class ProjectOverviewEffects {
  public initMembers$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProjectOverviewActions.initMembers),
      fetch({
        run: () => {
          return zip(
            this.projectApiService.getMembers(),
            this.projectApiService.getInvitations()
          ).pipe(
            map(([members, invitations]) => {
              return ProjectOverviewActions.fetchMembersSuccess({
                members,
                invitations,
              });
            })
          );
        },
      })
    );
  });

  constructor(
    private actions$: Actions,
    private projectApiService: ProjectApiService
  ) {}
}
