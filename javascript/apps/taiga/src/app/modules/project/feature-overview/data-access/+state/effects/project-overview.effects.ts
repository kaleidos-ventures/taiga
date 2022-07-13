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
import { ProjectApiService } from '@taiga/api';
import { EMPTY, of, zip } from 'rxjs';
import { catchError, exhaustMap, map, switchMap } from 'rxjs/operators';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { filterNil } from '~/app/shared/utils/operators';
import * as ProjectOverviewActions from '../actions/project-overview.actions';
import {
  selectHasMoreInvitations,
  selectHasMoreMembers,
  selectInvitations,
  selectMembers,
  selectShowAllMembers,
} from '../selectors/project-overview.selectors';
import { MEMBERS_PAGE_SIZE } from '~/app/modules/project/feature-overview/feature-overview.constants';
import { WsService } from '@taiga/ws';
import { AppService } from '~/app/services/app.service';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable()
export class ProjectOverviewEffects {
  public initMembers$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProjectOverviewActions.initMembers),
      concatLatestFrom(() => [
        this.store.select(selectCurrentProject).pipe(filterNil()),
      ]),
      exhaustMap(([, project]) => {
        return zip(
          this.projectApiService.getMembers(project.slug, 0),
          this.store.select(selectShowAllMembers).pipe(filterNil())
        ).pipe(
          exhaustMap(([membersResponse, showAllMembers]) => {
            return this.projectApiService
              .getInvitations(project.slug, 0, MEMBERS_PAGE_SIZE)
              .pipe(
                map((invitationsResponse) => {
                  return ProjectOverviewActions.fetchMembersSuccess({
                    invitations: invitationsResponse.invitations,
                    totalInvitations: invitationsResponse.totalInvitations,
                    members: membersResponse.memberships,
                    totalMemberships: membersResponse.totalMemberships,
                    showAllMembers,
                  });
                })
              );
          })
        );
      })
    );
  });

  public nextMembersPage$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProjectOverviewActions.nextMembersPage),
      concatLatestFrom(() => [
        this.store.select(selectCurrentProject).pipe(filterNil()),
        this.store.select(selectInvitations),
        this.store.select(selectMembers),
        this.store.select(selectHasMoreInvitations),
        this.store.select(selectHasMoreMembers),
      ]),
      exhaustMap(
        ([
          ,
          project,
          invitations,
          members,
          hasMoreInvitations,
          hasMoreMembers,
        ]) => {
          if (hasMoreMembers) {
            return zip(
              this.projectApiService.getMembers(project.slug, members.length),
              this.store.select(selectShowAllMembers).pipe(filterNil())
            ).pipe(
              exhaustMap(([membersResponse, showAllMembers]) => {
                if (membersResponse.memberships.length === MEMBERS_PAGE_SIZE) {
                  return of(
                    ProjectOverviewActions.fetchMembersSuccess({
                      members: membersResponse?.memberships,
                      totalMemberships: membersResponse?.totalMemberships,
                      showAllMembers,
                    })
                  );
                } else {
                  return this.projectApiService
                    .getInvitations(project.slug, invitations.length)
                    .pipe(
                      map((invitationsResponse) => {
                        return ProjectOverviewActions.fetchMembersSuccess({
                          invitations: invitationsResponse.invitations,
                          totalInvitations:
                            invitationsResponse.totalInvitations,
                          members: membersResponse.memberships,
                          totalMemberships: membersResponse.totalMemberships,
                          showAllMembers,
                        });
                      })
                    );
                }
              })
            );
          } else if (hasMoreInvitations) {
            return zip(
              this.projectApiService.getInvitations(
                project.slug,
                invitations.length
              ),
              this.store.select(selectShowAllMembers).pipe(filterNil())
            ).pipe(
              map(([invitationsResponse, showAllMembers]) => {
                return ProjectOverviewActions.fetchMembersSuccess({
                  invitations: invitationsResponse?.invitations,
                  totalInvitations: invitationsResponse?.totalInvitations,
                  showAllMembers,
                });
              })
            );
          }

          return EMPTY;
        }
      )
    );
  });

  public wsUpdateMemberListOnInvitation$ = createEffect(() => {
    return this.store.select(selectCurrentProject).pipe(
      filterNil(),
      switchMap((project) => {
        return this.wsService
          .events<{ project: string }>({
            channel: `projects.${project.slug}`,
            type: 'projectinvitations.create',
          })
          .pipe(
            map(() => {
              return ProjectOverviewActions.updateMemberList();
            })
          );
      })
    );
  });

  public wsUpdateMemberListOnAccept$ = createEffect(() => {
    return this.store.select(selectCurrentProject).pipe(
      filterNil(),
      switchMap((project) => {
        return this.wsService
          .events<{ project: string }>({
            channel: `projects.${project.slug}`,
            type: 'projectmemberships.create',
          })
          .pipe(
            map(() => {
              return ProjectOverviewActions.updateMemberList();
            })
          );
      })
    );
  });

  public updateMemberList$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProjectOverviewActions.updateMemberList),
      concatLatestFrom(() =>
        this.store.select(selectCurrentProject).pipe(filterNil())
      ),
      exhaustMap(([, project]) => {
        return zip(
          this.projectApiService.getMembers(project.slug, 0),
          this.projectApiService.getInvitations(project.slug, 0),
          this.store.select(selectShowAllMembers).pipe(filterNil())
        ).pipe(
          map(([membersResponse, invitationsResponse, showAllMembers]) => {
            if (!showAllMembers) {
              return ProjectOverviewActions.fetchMembersSuccess({
                members: membersResponse.memberships,
                totalMemberships: membersResponse.totalMemberships,
                invitations: invitationsResponse.invitations,
                totalInvitations: invitationsResponse.totalInvitations,
                showAllMembers: showAllMembers,
                updateMemberList: true,
              });
            }
            return ProjectOverviewActions.updateMemberModalList();
          }),
          catchError((httpResponse: HttpErrorResponse) => {
            this.appService.errorManagement(httpResponse);
            return EMPTY;
          })
        );
      })
    );
  });

  public updateShowAllMembers$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProjectOverviewActions.updateShowAllMembers),
      concatLatestFrom(() =>
        this.store.select(selectCurrentProject).pipe(filterNil())
      ),
      exhaustMap(([, project]) => {
        return zip(
          this.projectApiService.getMembers(project.slug, 0),
          this.projectApiService.getInvitations(project.slug, 0)
        ).pipe(
          map(([membersResponse, invitationsResponse]) => {
            return ProjectOverviewActions.fetchMembersSuccess({
              members: membersResponse.memberships,
              totalMemberships: membersResponse.totalMemberships,
              invitations: invitationsResponse.invitations,
              totalInvitations: invitationsResponse.totalInvitations,
              showAllMembers: false,
            });
          }),
          catchError((httpResponse: HttpErrorResponse) => {
            this.appService.errorManagement(httpResponse);
            return EMPTY;
          })
        );
      })
    );
  });

  constructor(
    private store: Store,
    private actions$: Actions,
    private projectApiService: ProjectApiService,
    private wsService: WsService,
    private appService: AppService
  ) {}
}
