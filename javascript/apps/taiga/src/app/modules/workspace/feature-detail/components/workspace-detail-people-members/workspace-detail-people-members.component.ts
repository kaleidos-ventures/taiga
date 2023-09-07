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
  HostListener,
  OnInit,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { User, Workspace, WorkspaceMembership } from '@taiga/data';
import { map } from 'rxjs/operators';
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import {
  workspaceDetailApiActions,
  workspaceActions,
} from '~/app/modules/workspace/feature-detail/+state/actions/workspace-detail.actions';
import {
  selectMembersList,
  selectMembersLoading,
  selectMembersOffset,
  selectTotalMembers,
  selectWorkspace,
} from '~/app/modules/workspace/feature-detail/+state/selectors/workspace-detail.selectors';
import { MEMBERS_PAGE_SIZE } from '~/app/modules/workspace/feature-detail/workspace-feature.constants';
import { filterNil } from '~/app/shared/utils/operators';
import {
  removeCell,
  showUndo,
  undoDone,
  conSlideInOut,
} from '~/app/shared/utils/animations';
import { TuiLinkModule } from '@taiga-ui/core';

import { LeaveWorkspaceDropdownComponent } from '../leave-workspace-dropdown/leave-workspace-dropdown.component';
import { WorkspaceDetailPeopleMembersRemoveComponent } from './components/workspace-detail-people-members-remove/workspace-detail-people-members-remove.component';
import { TranslocoDirective } from '@ngneat/transloco';
import { CommonModule } from '@angular/common';
import { DynamicTableModule } from '@taiga/ui/dynamic-table/dynamic-table.module';
import { ContextNotificationComponent } from '@taiga/ui/context-notification/context-notification.component';
import { UserSkeletonComponent } from '@taiga/ui/skeletons/user-skeleton/user-skeleton.component';
import { PaginationComponent } from '~/app/shared/pagination/pagination.component';
import { ProjectsDropdownComponent } from '~/app/shared/projects-dropdown/projects-dropdown.component';
import { UserCardComponent } from '~/app/shared/user-card/user-card.component';

@Component({
  selector: 'tg-workspace-detail-people-members',
  templateUrl: './workspace-detail-people-members.component.html',
  styleUrls: ['./workspace-detail-people-members.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
  animations: [removeCell, showUndo, undoDone, conSlideInOut],
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    DynamicTableModule,
    UserCardComponent,
    ProjectsDropdownComponent,
    WorkspaceDetailPeopleMembersRemoveComponent,
    LeaveWorkspaceDropdownComponent,
    ContextNotificationComponent,
    TuiLinkModule,
    UserSkeletonComponent,
    PaginationComponent,
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

  public cd = inject(ChangeDetectorRef);

  public MEMBERS_PAGE_SIZE = MEMBERS_PAGE_SIZE;
  public model$ = this.state.select().pipe(
    map((model) => {
      const currentMember = model.members.find(
        (member) => member.user.username === model.currentUser.username
      );

      const members = model.members.filter(
        (member) => member.user.username !== model.currentUser.username
      );

      const allMembers = [currentMember, ...members].filter(
        (it): it is WorkspaceMembership => !!it
      );

      const pageMembers = allMembers
        .slice(model.offset, model.offset + this.MEMBERS_PAGE_SIZE)
        .map((member) => {
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
        });

      const pageStart = model.offset + 1;
      const pageEnd = pageStart + pageMembers.length - 1;

      return {
        ...model,
        pageStart,
        pageEnd,
        hasNextPage: pageEnd < model.total,
        hasPreviousPage: !!model.offset,
        members: pageMembers,
      };
    })
  );

  private removeMemberConfirmTimeouts = new Map<
    WorkspaceMembership['user']['username'],
    ReturnType<typeof setTimeout>
  >();

  private _animationStatus: 'enabled' | 'disabled' = 'disabled';

  public get animationStatus(): 'enabled' | 'disabled' {
    return this._animationStatus;
  }

  public set animationStatus(value: 'enabled' | 'disabled') {
    this._animationStatus = value;
    this.cd.detectChanges();
  }

  constructor(
    private state: RxState<{
      members: WorkspaceMembership[];
      loading: boolean;
      total: number;
      offset: number;
      workspace: Workspace | null;
      currentUser: User;
      highlightedRow: WorkspaceMembership | null;
      leaveHighlightedRow: WorkspaceMembership | null;
      removingMembers: WorkspaceMembership['user']['username'][];
      undoMemberRemove: WorkspaceMembership['user']['username'][];
    }>,
    private store: Store
  ) {
    this.state.set({ removingMembers: [], undoMemberRemove: [] });
  }

  public ngOnInit(): void {
    this.state.connect('members', this.store.select(selectMembersList));
    this.state.connect('loading', this.store.select(selectMembersLoading));
    this.state.connect('total', this.store.select(selectTotalMembers));
    this.state.connect('offset', this.store.select(selectMembersOffset));
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
    this.animationStatus = 'disabled';

    this.store.dispatch(
      workspaceActions.setWorkspaceMembersPage({
        offset: this.state.get('offset') + MEMBERS_PAGE_SIZE,
      })
    );
  }

  public prev() {
    this.animationStatus = 'disabled';

    this.store.dispatch(
      workspaceActions.setWorkspaceMembersPage({
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
    this.animationStatus = 'enabled';

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

  public toggleLeaveWorkspace(status: boolean, member: WorkspaceMembership) {
    if (status) {
      this.state.set({ leaveHighlightedRow: member });
    } else {
      this.state.set({ leaveHighlightedRow: null });
    }
  }

  public confirmLeaveWorkspace() {
    const workspace = this.state.get('workspace');
    const currentUser = this.state.get('currentUser');

    if (workspace && currentUser) {
      this.store.dispatch(
        workspaceActions.leaveWorkspace({
          id: workspace.id,
          name: workspace.name,
          username: currentUser.username,
        })
      );
    }
  }
}
