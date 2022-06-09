/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import '@ng-web-apis/universal/mocks';
import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { Project, ProjectMockFactory, WorkspaceMockFactory } from '@taiga/data';
import { provideMockStore } from '@ngrx/store/testing';
import { WorkspaceComponent } from './workspace.component';
import { LocalStorageService } from '~/app/shared/local-storage/local-storage.service';

describe('Workspace List', () => {
  const workspaceItem = WorkspaceMockFactory();

  const initialState = {
    creatingWorkspace: false,
    showCreate: false,
    loading: false,
    workspaceList: [workspaceItem],
    createFormHasError: false,
  };

  let spectator: Spectator<WorkspaceComponent>;
  const createComponent = createComponentFactory({
    component: WorkspaceComponent,
    imports: [],
    mocks: [LocalStorageService],
    providers: [provideMockStore({ initialState })],
  });

  beforeEach(() => {
    spectator = createComponent({
      detectChanges: false,
    });
  });

  it('setCardAmounts should give new amount of project to show', () => {
    spectator.component.setCardAmounts(1);
    expect(spectator.component.amountOfProjectsToShow).toEqual(1);

    spectator.component.setCardAmounts(1500);
    expect(spectator.component.amountOfProjectsToShow).toEqual(6);

    spectator.component.setCardAmounts(1750);
    expect(spectator.component.amountOfProjectsToShow).toEqual(6);
  });

  it('check WS visibility - admin', () => {
    const workspaceItem = WorkspaceMockFactory();

    // Mock user role
    workspaceItem.isOwner = false;

    // Mock user role
    workspaceItem.myRole = 'admin';

    // Mock latestProjects
    workspaceItem.latestProjects = [];

    // Mock localStorage rejectedProjects
    const localStorageService =
      spectator.inject<LocalStorageService>(LocalStorageService);

    const rejectedInvited: Project['slug'][] = [];
    localStorageService.get.mockReturnValue(rejectedInvited);

    expect(spectator.component.checkWsVisibility(workspaceItem)).toBeTruthy();
  });

  it('check WS visibility - owner', () => {
    const workspaceItem = WorkspaceMockFactory();

    // Mock user role
    workspaceItem.isOwner = true;

    // Mock user role
    workspaceItem.myRole = 'member';

    // Mock latestProjects
    workspaceItem.latestProjects = [];

    // Mock localStorage rejectedProjects
    const localStorageService =
      spectator.inject<LocalStorageService>(LocalStorageService);

    const rejectedInvited: Project['slug'][] = [];
    localStorageService.get.mockReturnValue(rejectedInvited);

    expect(spectator.component.checkWsVisibility(workspaceItem)).toBeTruthy();
  });

  it('check WS visibility - hasProjects', () => {
    const workspaceItem = WorkspaceMockFactory();

    // Mock user role
    workspaceItem.isOwner = false;

    // Mock user role
    workspaceItem.myRole = 'guest';

    // Mock latestProjects
    const project = ProjectMockFactory();
    workspaceItem.latestProjects = [project];

    // Mock localStorage rejectedProjects
    const localStorageService =
      spectator.inject<LocalStorageService>(LocalStorageService);

    const rejectedInvited: Project['slug'][] = [];
    localStorageService.get.mockReturnValue(rejectedInvited);

    expect(spectator.component.checkWsVisibility(workspaceItem)).toBeTruthy();
  });

  it('check WS visibility - hasInvites', () => {
    const workspaceItem = WorkspaceMockFactory();

    // Mock user role
    workspaceItem.isOwner = false;

    // Mock user role
    workspaceItem.myRole = 'guest';

    // Mock latestProjects
    workspaceItem.latestProjects = [];

    // Mock localStorage rejectedProjects
    const localStorageService =
      spectator.inject<LocalStorageService>(LocalStorageService);

    const rejectedInvited: Project['slug'][] = [];
    localStorageService.get.mockReturnValue(rejectedInvited);

    const exampleInvite = ProjectMockFactory();
    workspaceItem.invitedProjects = [exampleInvite];

    expect(spectator.component.checkWsVisibility(workspaceItem)).toBeTruthy();
  });

  it('check WS visibility - hasInvites - rejected', () => {
    const workspaceItem = WorkspaceMockFactory();

    // Mock user role
    workspaceItem.isOwner = false;

    // Mock user role
    workspaceItem.myRole = 'guest';

    // Mock latestProjects
    workspaceItem.latestProjects = [];

    // Mock localStorage rejectedProjects
    const exampleInvite = ProjectMockFactory();

    const localStorageService =
      spectator.inject<LocalStorageService>(LocalStorageService);

    const rejectedInvited: Project['slug'][] = [exampleInvite.slug];
    localStorageService.get.mockReturnValue(rejectedInvited);

    workspaceItem.invitedProjects = [exampleInvite];

    expect(spectator.component.checkWsVisibility(workspaceItem)).toBeFalsy();
  });
});
