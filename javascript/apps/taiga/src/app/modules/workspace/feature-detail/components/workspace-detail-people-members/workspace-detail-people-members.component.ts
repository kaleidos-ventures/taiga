/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnInit,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { User, Workspace, WorkspaceMembership } from '@taiga/data';
import { map } from 'rxjs/operators';
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import { workspaceDetailApiActions } from '~/app/modules/workspace/feature-detail/+state/actions/workspace-detail.actions';
import {
  selectAnimationDisabled,
  selectMembers,
  selectMembersLoading,
  selectMembersOffset,
  selectTotalMembers,
  selectWorkspace,
} from '~/app/modules/workspace/feature-detail/+state/selectors/workspace-detail.selectors';
import { MEMBERS_PAGE_SIZE } from '~/app/modules/workspace/feature-detail/workspace-feature.constants';
import { filterNil } from '~/app/shared/utils/operators';

@Component({
  selector: 'tg-workspace-detail-people-members',
  templateUrl: './workspace-detail-people-members.component.html',
  styleUrls: ['./workspace-detail-people-members.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
  animations: [
    trigger('removeAnimationCell', [
      state(
        'inactive',
        style({
          opacity: 1,
          transform: 'translateY(0)',
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
        animate('0.3s 0.5s ease-in'),
      ]),
      transition('active => inactive', [animate('0.3s')]),
    ]),
    trigger('removeAnimationUndo', [
      transition(
        'void => *', // ---> Entering --->
        [
          style({
            opacity: 0,
            transform: 'translateY(0%)',
          }),
          animate(
            '400ms ease-out',
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
    trigger('removeUndoDone', [
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
            '400ms 1s ease-out',
            style({
              opacity: 0,
              transform: 'translateX(100%)',
            })
          ),
        ]
      ),
    ]),
  ],
})
export class WorkspaceDetailPeopleMembersComponent implements OnInit {
  @HostListener('window:beforeunload')
  public removePendingMembers() {
    if (this.removeMemberConfirmTimeouts.size) {
      for (const username of this.removeMemberConfirmTimeouts.keys()) {
        const member = this.getMemberFromUsername(username);
        if (member) {
          this.execRemoveMember(member);
        }
      }
      return false;
    }
    return true;
  }

  public MEMBERS_PAGE_SIZE = MEMBERS_PAGE_SIZE;
  public model$ = this.state.select().pipe(
    map((model) => {
      const pageStart = model.offset + 1;
      const pageEnd = pageStart + model.members.length - 1;

      return {
        ...model,
        pageStart,
        pageEnd,
        hasNextPage: pageEnd < model.total,
        hasPreviousPage: !!model.offset,
        members: model.members.map((member) => {
          const cancelledId = model.removingMembers.includes(
            member.user.username
          );
          const undoDoneActive = model.undoMemberRemove.includes(
            member.user.username
          );
          return {
            ...member,
            cancelled: cancelledId ? 'active' : 'inactive',
            undo: undoDoneActive,
          };
        }),
      };
    })
  );

  private removeMemberConfirmTimeouts = new Map<
    WorkspaceMembership['user']['username'],
    ReturnType<typeof setTimeout>
  >();

  constructor(
    private state: RxState<{
      members: WorkspaceMembership[];
      loading: boolean;
      total: number;
      offset: number;
      animationDisabled: boolean;
      workspace: Workspace | null;
      currentUser: User;
      highlightedRow: WorkspaceMembership | null;
      removingMembers: WorkspaceMembership['user']['username'][];
      undoMemberRemove: WorkspaceMembership['user']['username'][];
    }>,
    private store: Store
  ) {
    this.state.set({ removingMembers: [], undoMemberRemove: [] });
  }

  public ngOnInit(): void {
    this.state.connect('members', this.store.select(selectMembers));
    this.state.connect('loading', this.store.select(selectMembersLoading));
    this.state.connect('total', this.store.select(selectTotalMembers));
    this.state.connect('offset', this.store.select(selectMembersOffset));
    this.state.connect(
      'animationDisabled',
      this.store.select(selectAnimationDisabled)
    );
    this.state.connect(
      'workspace',
      this.store.select(selectWorkspace).pipe(filterNil())
    );
    this.state.connect(
      'currentUser',
      this.store.select(selectUser).pipe(filterNil())
    );
  }

  public trackByIndex(index: number) {
    return index;
  }

  public trackByUsername(index: number, member: WorkspaceMembership) {
    return member.user.username;
  }

  public next() {
    this.store.dispatch(
      workspaceDetailApiActions.getWorkspaceMembers({
        id: this.state.get('workspace')!.id,
        offset: this.state.get('offset') + MEMBERS_PAGE_SIZE,
      })
    );
  }

  public prev() {
    this.store.dispatch(
      workspaceDetailApiActions.getWorkspaceMembers({
        id: this.state.get('workspace')!.id,
        offset: this.state.get('offset') - MEMBERS_PAGE_SIZE,
      })
    );
  }

  public highlightRemoveMemberRow(member: WorkspaceMembership | null) {
    this.state.set({ highlightedRow: member });
  }

  public initRemoveMember(member: WorkspaceMembership) {
    const membersToRemove = this.state.get('removingMembers');
    this.state.set({
      removingMembers: [...membersToRemove, member.user.username],
    });
    this.removeMemberConfirmTimeouts.set(
      member.user.username,
      setTimeout(() => {
        this.execRemoveMember(member);
      }, 5000)
    );
  }

  public cancelRemove(member: WorkspaceMembership) {
    const membersToRemoveList = this.state.get('removingMembers');
    const membersToRemoveFiltered = membersToRemoveList.filter(
      (memberToRemove) => memberToRemove !== member.user.username
    );
    this.state.set({
      removingMembers: membersToRemoveFiltered,
    });
    this.clearMemberToRemove(member);
  }

  public clearMemberToRemove(member: WorkspaceMembership) {
    const timeout = this.removeMemberConfirmTimeouts.get(member.user.username);
    if (timeout) {
      clearTimeout(timeout);
      this.removeMemberConfirmTimeouts.delete(member.user.username);
    }
  }

  public execRemoveMember(member: WorkspaceMembership) {
    this.store.dispatch(
      workspaceDetailApiActions.removeMember({
        id: this.state.get('workspace')!.id,
        member: member.user.username,
      })
    );

    this.clearMemberToRemove(member);
  }

  public animationUndoValidateRemoved(member: WorkspaceMembership) {
    const removingMembers = this.state.get('removingMembers');
    const currentMembers = this.state.get('members');

    const memberHasNotBeenRemoved = currentMembers.find(
      (currentMember) => currentMember.user.username === member.user.username
    );
    const memberIsNotBeingRemoved = !removingMembers.includes(
      member.user.username
    );

    if (memberHasNotBeenRemoved && memberIsNotBeingRemoved) {
      const undoMemberRemoveList = this.state.get('removingMembers');
      this.state.set({
        undoMemberRemove: [...undoMemberRemoveList, member.user.username],
      });
    }
  }

  public clearUndo(member: WorkspaceMembership) {
    const undoMembers = this.state.get('undoMemberRemove');
    const undoMemberRemoveFiltered = undoMembers.filter(
      (memberToRemove) => memberToRemove !== member.user.username
    );
    this.state.set({
      undoMemberRemove: undoMemberRemoveFiltered,
    });
  }

  public getMemberFromUsername(
    username: WorkspaceMembership['user']['username']
  ) {
    const members = this.state.get('members');
    return members.find((member) => member.user.username === username);
  }
}
