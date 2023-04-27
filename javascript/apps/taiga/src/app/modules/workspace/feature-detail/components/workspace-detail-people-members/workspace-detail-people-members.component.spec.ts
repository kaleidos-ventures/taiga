/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { randNumber, randUserName } from '@ngneat/falso';
import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import {
  User,
  UserMockFactory,
  Workspace,
  WorkspaceMembership,
  WorkspaceMembershipMockFactory,
  WorkspaceMockFactory,
} from '@taiga/data';
import { getTranslocoModule } from '~/app/transloco/transloco-testing.module';
import { WorkspaceDetailPeopleMembersComponent } from './workspace-detail-people-members.component';

interface MembersState {
  workspaceDetail: {
    members: WorkspaceMembership[];
  };
  loading: boolean;
  total: number;
  offset: number;
  animationDisabled: boolean;
  workspace: Workspace;
  currentUser: User;
  highlightedRow: null;
  removingMembers: WorkspaceMembership['user']['username'][];
  undoMemberRemove: WorkspaceMembership['user']['username'][];
}

const initialState: MembersState = {
  workspaceDetail: {
    members: [WorkspaceMembershipMockFactory()],
  },
  loading: false,
  total: randNumber(),
  offset: randNumber(),
  animationDisabled: false,
  workspace: WorkspaceMockFactory(),
  currentUser: UserMockFactory(),
  highlightedRow: null,
  removingMembers: [],
  undoMemberRemove: [],
};
// Test skipped until we can fix this tests with local and global state
describe.skip('WorkspaceDetailPeopleMembersComponent', () => {
  let spectator: Spectator<WorkspaceDetailPeopleMembersComponent>;
  let store: MockStore;

  const createComponent = createComponentFactory({
    component: WorkspaceDetailPeopleMembersComponent,
    imports: [getTranslocoModule()],
    schemas: [NO_ERRORS_SCHEMA],
    providers: [provideMockStore({ initialState })],
  });

  beforeEach(() => {
    spectator = createComponent({
      detectChanges: false,
    });
    store = spectator.inject(MockStore);
    spectator.detectChanges();
  });

  it('get Current Workspace', (done) => {
    const member = WorkspaceMembershipMockFactory();
    spectator.component.highlightRemoveMemberRow(member);
    spectator.component.model$.subscribe((model) => {
      expect(model.highlightedRow).toEqual(member);
      done();
    });
  });

  it('init Remove Member', (done) => {
    spectator.component.execRemoveMember = jest.fn();
    const member1 = WorkspaceMembershipMockFactory();
    spectator.component.initRemoveMember(member1);
    spectator.component.model$.subscribe((model) => {
      expect(model.removingMembers).toEqual([member1.user.username]);
      done();
    });
  });

  it('cancel Remove Member', (done) => {
    spectator.component.clearMemberToRemove = jest.fn();
    const member0 = randUserName();
    const member1 = WorkspaceMembershipMockFactory();

    spectator.component.cancelRemove(member1);
    spectator.component.model$.subscribe((model) => {
      expect(model.removingMembers).toEqual([member0]);
      done();
    });
  });
});
