/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  animate,
  AnimationEvent,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { Invitation, Project, Role, User } from '@taiga/data';
import { map } from 'rxjs/operators';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { membersActions } from '~/app/modules/project/settings/feature-members/+state/actions/members.actions';
import {
  selectAnimationDisabled,
  selectCancelledInvitations,
  selectInvitationCancelAnimation,
  selectInvitations,
  selectInvitationsLoading,
  selectInvitationsOffset,
  selectInvitationUpdateAnimation,
  selectOpenRevokeInvitationDialog,
  selectTotalInvitations,
  selectUndoDoneAnimation,
} from '~/app/modules/project/settings/feature-members/+state/selectors/members.selectors';
import { MEMBERS_PAGE_SIZE } from '~/app/modules/project/settings/feature-members/feature-members.constants';
import { selectMemberRolesOrdered } from '~/app/shared/invite-to-project/data-access/+state/selectors/invitation.selectors';
import { filterNil } from '~/app/shared/utils/operators';
const cssValue = getComputedStyle(document.documentElement);
interface InvitationData {
  data: Invitation;
  cancelled: string;
  undo: boolean;
  undoTabIndex: string;
  cancelledTabIndex: string;
}

const revokeConfirmationDialogClose = '0.5s';

@Component({
  selector: 'tg-pending-members-list',
  templateUrl: './pending-members-list.component.html',
  styleUrls: ['./pending-members-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
  animations: [
    trigger('revokeAnimationCell', [
      state(
        'inactive',
        style({
          opacity: 1,
          transform: 'translateY(0%)',
        })
      ),
      state(
        'active',
        style({
          opacity: 0,
          transform: 'translateY(-100%)',
        })
      ),
      transition('inactive => active', [
        style({ opacity: 0.7 }),
        animate(`0.3s ${revokeConfirmationDialogClose}`),
      ]),
      transition('active => inactive', [animate('0.3s')]),
    ]),
    trigger('revokeAnimationUndo', [
      transition(
        'void => *', // ---> Entering --->
        [
          style({
            opacity: 0,
            transform: 'translateY(0%)',
          }),
          animate(
            `400ms ${revokeConfirmationDialogClose} ease-out`,
            style({
              opacity: 1,
              transform: 'translateY(-100%)',
            })
          ),
        ]
      ),
      transition(
        '* => void', // ---> Leaving --->
        [
          animate(
            '400ms ease-out',
            style({
              opacity: 0,
              transform: 'translateX(0%)',
            })
          ),
        ]
      ),
    ]),
    trigger('revokeUndoDone', [
      transition(
        'void => *', // ---> Entering --->
        [
          style({
            opacity: 0,
            transform: 'translateX(100%)',
          }),
          animate(
            '400ms ease-out',
            style({
              opacity: 1,
              transform: 'translateX(0%)',
            })
          ),
        ]
      ),
      transition(
        '* => void', // ---> Leaving --->
        [
          animate(
            '400ms ease-out',
            style({
              opacity: 0,
              transform: 'translateX(100%)',
            })
          ),
        ]
      ),
    ]),
    trigger('settingInvitationAnimation', [
      transition(
        'void => create', // ---> Entering --->
        [
          style({
            blockSize: '0',
            opacity: '0',
          }),
          animate(
            '400ms ease-out',
            style({
              blockSize: '*',
              opacity: '1',
            })
          ),
        ]
      ),
      transition(
        ':leave', // ---> Leaving --->
        [
          animate(
            '400ms ease-out',
            style({
              blockSize: '0',
              opacity: '0',
            })
          ),
        ]
      ),
      transition(
        'void => update', // <--- Entering <---
        [
          style({
            opacity: '0',
            background: 'none',
            outline: 'solid 2px transparent',
          }),
          animate(
            '400ms ease-in',
            style({
              opacity: '1',
              background: `${cssValue.getPropertyValue('--color-gray10')}`,
              outline: `solid 2px ${cssValue.getPropertyValue(
                '--color-secondary80'
              )}`,
            })
          ),
          animate(
            '500ms ease-in',
            style({
              background: `${cssValue.getPropertyValue('--color-white')}`,
            })
          ),
          animate(
            '300ms ease-in',
            style({
              background: `${cssValue.getPropertyValue('--color-white')}`,
              outline: 'solid 2px transparent',
            })
          ),
        ]
      ),
    ]),
  ],
})
export class PendingMembersListComponent {
  @HostListener('window:beforeunload')
  public revokePendingInvitations() {
    if (this.revokePendingConfirmTimeouts.size) {
      for (const invitation of this.revokePendingConfirmTimeouts.keys()) {
        this.execCancelInvitation(invitation);
      }

      return false;
    }

    return true;
  }

  public MEMBERS_PAGE_SIZE = MEMBERS_PAGE_SIZE;
  public invitationToCancel: Invitation | null = null;

  public model$ = this.state.select().pipe(
    map((model) => {
      const pageStart = model.offset + 1;
      const pageEnd = pageStart + model.invitations.length - 1;

      return {
        ...model,
        invitations: model.invitations.map((invitation) => {
          const cancelledId = model.cancelled.includes(invitation.email);
          const undoDoneActive = model.undo.includes(invitation.email);
          return {
            data: invitation,
            cancelled: cancelledId ? 'active' : 'inactive',
            cancelledTabIndex: cancelledId ? '0' : '-1',
            undo: undoDoneActive,
            undoTabIndex: undoDoneActive ? '0' : '-1',
          } as InvitationData;
        }),
        pageStart,
        pageEnd,
        hasNextPage: pageEnd < model.total,
        hasPreviousPage: !!model.offset,
      };
    })
  );

  private revokePendingConfirmTimeouts = new Map<
    Invitation,
    ReturnType<typeof setTimeout>
  >();

  constructor(
    private store: Store,
    private state: RxState<{
      invitations: Invitation[];
      loading: boolean;
      total: number;
      offset: number;
      animationDisabled: boolean;
      invitationUpdateAnimation: string | null;
      invitationCancelAnimation: string | null;
      project: Project;
      revokeDialogDisplay: Invitation['email'] | null;
      cancelled: string[];
      undo: string[];
      roles: Role[];
    }>
  ) {
    this.state.connect('invitations', this.store.select(selectInvitations));
    this.state.connect('loading', this.store.select(selectInvitationsLoading));
    this.state.connect('total', this.store.select(selectTotalInvitations));
    this.state.connect('offset', this.store.select(selectInvitationsOffset));
    this.state.connect(
      'animationDisabled',
      this.store.select(selectAnimationDisabled)
    );
    this.state.connect(
      'invitationUpdateAnimation',
      this.store.select(selectInvitationUpdateAnimation)
    );
    this.state.connect(
      'invitationCancelAnimation',
      this.store.select(selectInvitationCancelAnimation)
    );
    this.state.connect(
      'project',
      this.store.select(selectCurrentProject).pipe(filterNil())
    );

    this.state.connect(
      'cancelled',
      this.store.select(selectCancelledInvitations)
    );

    this.state.connect(
      'revokeDialogDisplay',
      this.store.select(selectOpenRevokeInvitationDialog)
    );

    this.state.connect('undo', this.store.select(selectUndoDoneAnimation));

    this.state.connect(
      'roles',
      this.store.select(selectMemberRolesOrdered).pipe(filterNil())
    );

    this.store.dispatch(membersActions.selectTab({ tab: 'pending' }));
  }

  public next() {
    this.store.dispatch(
      membersActions.setPendingPage({
        offset: this.state.get('offset') + MEMBERS_PAGE_SIZE,
      })
    );
  }

  public prev() {
    this.store.dispatch(
      membersActions.setPendingPage({
        offset: this.state.get('offset') - MEMBERS_PAGE_SIZE,
      })
    );
  }

  public trackByInvitation(_index: number, invitation: InvitationData) {
    if (invitation.data.user?.username) {
      return invitation.data.email + invitation.data.user.username;
    }

    return invitation.data.email;
  }

  public trackByIndex(index: number) {
    return index;
  }

  public getUser(member: Invitation): Partial<User> {
    if (member.user) {
      return member.user;
    }
    return { email: member.email };
  }

  public resend(member: Invitation) {
    this.store.dispatch(
      membersActions.resendInvitation({
        id: this.state.get('project').id,
        usernameOrEmail: member.user?.username || member.email,
      })
    );
  }

  public onOpenRevokeInvitation(invitation: Invitation) {
    this.store.dispatch(membersActions.openRevokeInvitation({ invitation }));
  }

  public onClosedRevokeInvitation() {
    this.store.dispatch(
      membersActions.openRevokeInvitation({ invitation: null })
    );
  }

  public onConfirmCancelInvitation(invitation: Invitation) {
    this.store.dispatch(membersActions.cancelInvitationUi({ invitation }));

    this.revokePendingConfirmTimeouts.set(
      invitation,
      setTimeout(() => {
        this.execCancelInvitation(invitation);
      }, 5000)
    );
  }

  public undoRevoke(invitation: Invitation) {
    this.store.dispatch(membersActions.undoCancelInvitationUi({ invitation }));
    this.clearInvitationToCancel(invitation);
  }

  public removeUndoneDoneAnimation(invitation: Invitation) {
    this.store.dispatch(membersActions.removeUndoDoneAnimation({ invitation }));
  }

  public getUsername(invitation: Invitation) {
    if (invitation.user && invitation.user.username) {
      return invitation.user.username;
    } else {
      return invitation.email;
    }
  }

  public invitationAnimationUpdateDone(event: AnimationEvent) {
    if (event.fromState == 'void') {
      if (event.toState === 'create' || event.toState === 'update') {
        this.store.dispatch(membersActions.animationUpdateDone());
      }
    }
  }

  private clearInvitationToCancel(invitation: Invitation) {
    const timeout = this.revokePendingConfirmTimeouts.get(invitation);
    if (timeout) {
      clearTimeout(timeout);
      this.revokePendingConfirmTimeouts.delete(invitation);
    }
  }

  private execCancelInvitation(invitation: Invitation) {
    this.store.dispatch(membersActions.revokeInvitation({ invitation }));
    this.clearInvitationToCancel(invitation);
  }
}
