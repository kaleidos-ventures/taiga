/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { animate, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { Invitation, User } from '@taiga/data';
import { map } from 'rxjs/operators';
import { setPendingPage } from '~/app/modules/project/settings/feature-members/+state/actions/members.actions';
import {
  selectAnimationDisabled,
  selectInvitations,
  selectInvitationsLoading,
  selectInvitationsOffset,
  selectInvitationUpdateAnimation,
  selectTotalInvitations,
} from '~/app/modules/project/settings/feature-members/+state/selectors/members.selectors';
import { MEMBERS_PAGE_SIZE } from '~/app/modules/project/settings/feature-members/feature-members.constants';
const cssValue = getComputedStyle(document.documentElement);

@Component({
  selector: 'tg-pending-members-list',
  templateUrl: './pending-members-list.component.html',
  styleUrls: ['./pending-members-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('settingInvitationAnimation', [
      transition(
        'void => false', // ---> Entering --->
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
        'false => void', // ---> Leaving --->
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
        'void => true', // <--- Entering <---
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
  public MEMBERS_PAGE_SIZE = MEMBERS_PAGE_SIZE;

  public model$ = this.state.select().pipe(
    map((model) => {
      const pageStart = model.offset + 1;
      const pageEnd = pageStart + model.invitations.length - 1;

      return {
        ...model,
        pageStart,
        pageEnd,
        hasNextPage: pageEnd < model.total,
        hasPreviousPage: !!model.offset,
      };
    })
  );

  constructor(
    private store: Store,
    private state: RxState<{
      invitations: Invitation[];
      loading: boolean;
      total: number;
      offset: number;
      animationDisabled: boolean;
      invitationUpdateAnimation: boolean;
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
  }

  public next() {
    this.store.dispatch(
      setPendingPage({ offset: this.state.get('offset') + MEMBERS_PAGE_SIZE })
    );
  }

  public prev() {
    this.store.dispatch(
      setPendingPage({ offset: this.state.get('offset') - MEMBERS_PAGE_SIZE })
    );
  }

  public trackByUsername(_index: number, invitation: Invitation) {
    return invitation.user?.username;
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

  public resend() {
    // todo
  }
}
