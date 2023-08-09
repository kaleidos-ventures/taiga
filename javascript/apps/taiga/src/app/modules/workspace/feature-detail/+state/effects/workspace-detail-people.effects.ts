/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { pessimisticUpdate } from '@ngrx/router-store/data-persistence';
import { TuiNotification } from '@taiga-ui/core';
import { WorkspaceApiService } from '@taiga/api';
import { EMPTY, zip } from 'rxjs';
import { catchError, exhaustMap, map } from 'rxjs/operators';
import { MEMBERS_PAGE_SIZE } from '~/app/modules/workspace/feature-detail/workspace-feature.constants';
import { AppService } from '~/app/services/app.service';
import {
  workspaceDetailApiActions,
  workspaceDetailEventActions,
} from '../actions/workspace-detail.actions';
import {
  selectInvitationsList,
  selectNonMembersList,
  selectMembersOffset,
  selectInvitationsOffset,
  selectNonMembersOffset,
} from '../selectors/workspace-detail.selectors';
import { Store } from '@ngrx/store';
import { filterNil } from '~/app/shared/utils/operators';

@Injectable()
export class WorkspaceDetailPeopleEffects {
  public initWorkspacePeople$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(workspaceDetailApiActions.initWorkspacePeople),
      exhaustMap((action) => {
        return zip(
          this.workspaceApiService.getWorkspaceMembers(action.id),
          this.workspaceApiService.getWorkspaceNonMembers(
            action.id,
            0,
            MEMBERS_PAGE_SIZE
          ),
          this.workspaceApiService.getWorkspaceInvitationMembers(action.id)
        ).pipe(
          map((response) => {
            return workspaceDetailApiActions.initWorkspacePeopleSuccess({
              members: {
                members: response[0].members,
                totalMembers: response[0].totalMembers,
              },
              nonMembers: {
                members: response[1].members,
                totalMembers: response[1].totalMembers,
                offset: 0,
              },
              invitations: {
                members: response[2].members,
                totalMembers: response[2].totalMembers,
              },
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

  public loadWorkspaceMembers$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(workspaceDetailApiActions.getWorkspaceMembers),
      exhaustMap((action) => {
        return this.workspaceApiService.getWorkspaceMembers(action.id).pipe(
          map((membersResponse) => {
            return workspaceDetailApiActions.getWorkspaceMembersSuccess({
              members: membersResponse.members,
              totalMembers: membersResponse.totalMembers,
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

  public loadWorkspaceNonMembers$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(workspaceDetailApiActions.getWorkspaceNonMembers),
      exhaustMap((action) => {
        return this.workspaceApiService
          .getWorkspaceNonMembers(action.id, action.offset, MEMBERS_PAGE_SIZE)
          .pipe(
            map((membersResponse) => {
              return workspaceDetailApiActions.getWorkspaceNonMembersSuccess({
                members: membersResponse.members,
                totalMembers: membersResponse.totalMembers,
                offset: action.offset,
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

  public removeMember$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(workspaceDetailApiActions.removeMember),
      pessimisticUpdate({
        run: (action) => {
          return this.workspaceApiService
            .removeWorkspaceMember(action.id, action.member)
            .pipe(
              map(() => {
                return workspaceDetailApiActions.removeMemberSuccess({
                  id: action.id,
                  member: action.member,
                });
              })
            );
        },
        onError: (_, httpResponse: HttpErrorResponse) => {
          this.appService.errorManagement(httpResponse, {
            any: {
              type: 'toast',
              options: {
                label: 'errors.generic_toast_label',
                message: 'errors.generic_toast_message',
                status: TuiNotification.Error,
              },
            },
          });
        },
      })
    );
  });

  public loadWorkspaceMemberInvitations$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(workspaceDetailApiActions.getWorkspaceMemberInvitations),
      exhaustMap((action) => {
        return this.workspaceApiService
          .getWorkspaceInvitationMembers(action.id)
          .pipe(
            map((membersResponse) => {
              return workspaceDetailApiActions.getWorkspaceMemberInvitationsSuccess(
                {
                  members: membersResponse.members,
                  totalMembers: membersResponse.totalMembers,
                  offset: action.offset,
                }
              );
            }),
            catchError((httpResponse: HttpErrorResponse) => {
              this.appService.errorManagement(httpResponse);
              return EMPTY;
            })
          );
      })
    );
  });

  public updateWorkspaceMembersInvitations$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(workspaceDetailEventActions.updateMembersInvitationsList),
      concatLatestFrom(() => [
        this.store.select(selectInvitationsList).pipe(filterNil()),
        this.store.select(selectInvitationsOffset).pipe(filterNil()),
        this.store.select(selectMembersOffset).pipe(filterNil()),
      ]),
      exhaustMap(([action, invitations, invitationsOffset, membersOffset]) => {
        const invitationsOffsetUpdated = invitations.length
          ? invitationsOffset
          : invitationsOffset - MEMBERS_PAGE_SIZE;
        return zip(
          this.workspaceApiService.getWorkspaceMembers(action.id),
          this.workspaceApiService.getWorkspaceInvitationMembers(action.id)
        ).pipe(
          map((response) => {
            return workspaceDetailEventActions.updateMembersInvitationsListSuccess(
              {
                members: {
                  members: response[0].members,
                  totalMembers: response[0].totalMembers,
                  offset: membersOffset,
                },
                invitations: {
                  members: response[1].members,
                  totalMembers: response[1].totalMembers,
                  offset: invitationsOffsetUpdated,
                },
              }
            );
          }),
          catchError((httpResponse: HttpErrorResponse) => {
            this.appService.errorManagement(httpResponse);
            return EMPTY;
          })
        );
      })
    );
  });

  public updateWorkspaceInvitationsAndNonMembers$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(workspaceDetailEventActions.updateNonMembersInvitationsList),
      concatLatestFrom(() => [
        this.store.select(selectNonMembersList).pipe(filterNil()),
        this.store.select(selectInvitationsOffset).pipe(filterNil()),
        this.store.select(selectNonMembersOffset).pipe(filterNil()),
      ]),
      exhaustMap(
        ([action, nonMembers, invitationsOffset, nonMembersOffset]) => {
          const nonMembersOffsetUpdated = nonMembers.length
            ? nonMembersOffset
            : nonMembersOffset - MEMBERS_PAGE_SIZE;
          return zip(
            this.workspaceApiService.getWorkspaceNonMembers(
              action.id,
              nonMembersOffsetUpdated,
              MEMBERS_PAGE_SIZE
            ),
            this.workspaceApiService.getWorkspaceInvitationMembers(action.id)
          ).pipe(
            map((response) => {
              return workspaceDetailEventActions.updateNonMembersInvitationsListSuccess(
                {
                  nonMembers: {
                    members: response[0].members,
                    totalMembers: response[0].totalMembers,
                    offset: nonMembersOffsetUpdated,
                  },
                  invitations: {
                    members: response[1].members,
                    totalMembers: response[1].totalMembers,
                    offset: invitationsOffset,
                  },
                }
              );
            }),
            catchError((httpResponse: HttpErrorResponse) => {
              this.appService.errorManagement(httpResponse);
              return EMPTY;
            })
          );
        }
      )
    );
  });

  public updateInvitationsMembersList$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(workspaceDetailEventActions.updateInvitationsList),
      concatLatestFrom(() =>
        this.store.select(selectInvitationsOffset).pipe(filterNil())
      ),
      exhaustMap(([action, invitationsOffset]) => {
        return this.workspaceApiService
          .getWorkspaceInvitationMembers(action.id)
          .pipe(
            map((invitationsResponse) => {
              return workspaceDetailEventActions.updateInvitationsListSuccess({
                members: invitationsResponse.members,
                totalMembers: invitationsResponse.totalMembers,
                offset: invitationsOffset,
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

  public updateMembersNonMembersProjects$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(workspaceDetailEventActions.updateMembersNonMembersProjects),
      concatLatestFrom(() => [
        this.store.select(selectMembersOffset).pipe(filterNil()),
        this.store.select(selectNonMembersOffset).pipe(filterNil()),
      ]),
      exhaustMap(([action, membersOffset, nonMembersOffset]) => {
        return zip(
          this.workspaceApiService.getWorkspaceMembers(action.id),
          this.workspaceApiService.getWorkspaceNonMembers(
            action.id,
            nonMembersOffset,
            MEMBERS_PAGE_SIZE
          )
        ).pipe(
          map((response) => {
            return workspaceDetailEventActions.updateMembersNonMembersProjectsSuccess(
              {
                members: {
                  members: response[0].members,
                  totalMembers: response[0].totalMembers,
                  offset: membersOffset,
                },
                nonMembers: {
                  members: response[1].members,
                  totalMembers: response[1].totalMembers,
                  offset: nonMembersOffset,
                },
              }
            );
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
    private workspaceApiService: WorkspaceApiService,
    private appService: AppService
  ) {}
}
