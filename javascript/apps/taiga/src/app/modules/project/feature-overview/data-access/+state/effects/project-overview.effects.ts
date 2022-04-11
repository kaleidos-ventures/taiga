/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Injectable } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { fetch } from '@nrwl/angular';
import { ProjectApiService } from '@taiga/api';
import { zip } from 'rxjs';
import { map } from 'rxjs/operators';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { filterNil } from '~/app/shared/utils/operators';
import * as ProjectOverviewActions from '../actions/project-overview.actions';

@Injectable()
export class ProjectOverviewEffects {
  public initMembers$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProjectOverviewActions.initMembers),
      concatLatestFrom(() =>
        this.store.select(selectCurrentProject).pipe(filterNil())
      ),
      fetch({
        run: (_, project) => {
          if (project.amIAdmin) {
            return zip(
              this.projectApiService.getMembers(project.slug),
              this.projectApiService.getInvitations(project.slug)
            ).pipe(
              map(([members, invitations]) => {
                return ProjectOverviewActions.fetchMembersSuccess({
                  members,
                  invitations,
                });
              })
            );
          }

          return this.projectApiService.getMembers(project.slug).pipe(
            map((members) => {
              return ProjectOverviewActions.fetchMembersSuccess({
                members,
                invitations: [],
              });
            })
          );
        },
      })
    );
  });

  constructor(
    private store: Store,
    private actions$: Actions,
    private projectApiService: ProjectApiService
  ) {}
}
