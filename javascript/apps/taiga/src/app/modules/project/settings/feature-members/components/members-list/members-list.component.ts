/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  ChangeDetectionStrategy,
  Component,
  AfterContentInit,
  HostListener,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { Membership, Project, Role, User } from '@taiga/data';
import { map } from 'rxjs/operators';
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { membersActions } from '~/app/modules/project/settings/feature-members/+state/actions/members.actions';
import {
  selectMembers,
  selectMembersLoading,
  selectMembersOffset,
  selectTotalMemberships,
  selectCancelledRemovedMember,
  selectMemberUndoDoneAnimation,
} from '~/app/modules/project/settings/feature-members/+state/selectors/members.selectors';
import { MEMBERS_PAGE_SIZE } from '~/app/modules/project/settings/feature-members/feature-members.constants';
import { selectMemberRolesOrdered } from '~/app/shared/invite-user-modal/data-access/+state/selectors/invitation.selectors';
import { removeCell, showUndo, undoDone } from '~/app/shared/utils/animations';
import { filterNil } from '~/app/shared/utils/operators';

interface MemberData {
  data: Membership;
  cancelled: string;
  undo: boolean;
}

@UntilDestroy()
@Component({
  selector: 'tg-members-list',
  templateUrl: './members-list.component.html',
  styleUrls: ['./members-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
  animations: [removeCell, showUndo, undoDone],
})
export class MembersListComponent implements AfterContentInit {
  @ViewChild('undoButton', { read: ElementRef, static: false })
  public undoButton!: ElementRef<HTMLElement>;

  @HostListener('window:beforeunload')
  public removeMembers() {
    if (this.removePendingConfirmTimeouts.size) {
      for (const member of this.removePendingConfirmTimeouts.keys()) {
        this.execRemoveMember(
          member.user.username === this.state.get('user')?.username,
          member
        );
      }

      return false;
    }

    return true;
  }

  public MEMBERS_PAGE_SIZE = MEMBERS_PAGE_SIZE;
  public activeMemberList: string[] = [];

  public model$ = this.state.select().pipe(
    map((model) => {
      const pageStart = model.offset + 1;
      const pageEnd = pageStart + model.members.length - 1;

      return {
        ...model,
        members: model.members.map((member) => {
          const cancelledId = model.cancelled.includes(member.user.username);
          const undoDoneActive = model.undo.includes(member.user.username);
          return {
            data: member,
            cancelled: cancelledId ? 'active' : 'inactive',
            undo: undoDoneActive,
          } as MemberData;
        }),
        pageStart,
        pageEnd,
        hasNextPage: pageEnd < model.total,
        hasPreviousPage: !!model.offset,
      };
    })
  );

  public animationDisabled = true;
  private removePendingConfirmTimeouts = new Map<
    Membership,
    ReturnType<typeof setTimeout>
  >();

  constructor(
    private store: Store,
    private state: RxState<{
      members: Membership[];
      loading: boolean;
      total: number;
      offset: number;
      user: User | null;
      project: Project;
      roles: Role[];
      cancelled: string[];
      undo: string[];
    }>
  ) {
    this.state.connect('members', this.store.select(selectMembers));
    this.state.connect('loading', this.store.select(selectMembersLoading));
    this.state.connect('total', this.store.select(selectTotalMemberships));
    this.state.connect('offset', this.store.select(selectMembersOffset));
    this.state.connect('user', this.store.select(selectUser));
    this.state.connect(
      'project',
      this.store.select(selectCurrentProject).pipe(filterNil())
    );
    this.state.connect(
      'roles',
      this.store.select(selectMemberRolesOrdered).pipe(filterNil())
    );
    this.state.connect(
      'cancelled',
      this.store.select(selectCancelledRemovedMember)
    );
    this.state.connect(
      'undo',
      this.store.select(selectMemberUndoDoneAnimation)
    );

    this.store.dispatch(membersActions.selectTab({ tab: 'members' }));
  }

  public next() {
    this.store.dispatch(
      membersActions.setMembersPage({
        offset: this.state.get('offset') + MEMBERS_PAGE_SIZE,
      })
    );
  }

  public prev() {
    this.store.dispatch(
      membersActions.setMembersPage({
        offset: this.state.get('offset') - MEMBERS_PAGE_SIZE,
      })
    );
  }

  public ngAfterContentInit() {
    setTimeout(() => {
      this.animationDisabled = false;
    }, 1000);
  }

  public trackByUsername(_index: number, member: MemberData) {
    return member.data.user.username;
  }

  public trackByIndex(index: number) {
    return index;
  }

  public addToActiveMemberList(add: boolean, member: Membership) {
    if (add) {
      this.store.dispatch(membersActions.openRemoveMember({ member }));
      this.activeMemberList.push(member.user.username);
    } else {
      this.store.dispatch(membersActions.openRemoveMember({ member: null }));
      const index = this.activeMemberList.indexOf(member.user.username);
      if (index !== -1) {
        this.activeMemberList.splice(index, 1);
      }
    }
  }

  public setBtnFocus() {
    this.undoButton?.nativeElement.focus({ preventScroll: true });
  }

  public onConfirmRemoveMember(isSelfUserLeaving: boolean, member: Membership) {
    this.store.dispatch(membersActions.cancelRemoveMemberUI({ member }));
    this.removePendingConfirmTimeouts.set(
      member,
      setTimeout(() => {
        this.execRemoveMember(isSelfUserLeaving, member);
      }, 5000)
    );
  }

  public undoRemove(member: Membership) {
    this.store.dispatch(membersActions.undoCancelRemoveMemberUI({ member }));
    this.clearMemberToRemove(member);
  }

  public removeUndoneDoneAnimation(member: Membership) {
    this.store.dispatch(
      membersActions.deleteRemoveMemberUndoDoneAnimation({ member })
    );
  }

  private clearMemberToRemove(member: Membership) {
    const timeout = this.removePendingConfirmTimeouts.get(member);
    if (timeout) {
      clearTimeout(timeout);
      this.removePendingConfirmTimeouts.delete(member);
    }
  }

  private execRemoveMember(isSelfUserLeaving: boolean, member: Membership) {
    this.store.dispatch(
      membersActions.removeMember({
        username: member.user.username,
        isSelf: !!isSelfUserLeaving,
      })
    );
    this.clearMemberToRemove(member);
  }
}
