/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MemoizedSelector } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { RxState } from '@rx-angular/state';
import {
  Project,
  WorkspaceMemberMockFactory,
  WorkspaceMockFactory,
} from '@taiga/data';
import { Observable, of } from 'rxjs';
import {
  acceptInvitationEvent,
  fetchWorkspaceProjects,
  invitationCreateEvent,
  invitationRevokedEvent,
  setWorkspaceListRejectedInvites,
} from '~/app/modules/workspace/feature-list/+state/actions/workspace.actions';
import { WorkspaceState } from '~/app/modules/workspace/feature-list/+state/reducers/workspace.reducer';
import { selectRejectedInvites } from '~/app/modules/workspace/feature-list/+state/selectors/workspace.selectors';
import { WsService } from '~/app/services/ws';
import { UserStorageService } from '~/app/shared/user-storage/user-storage.service';
import {
  WorkspaceItemComponent,
  WorkspaceItemState,
} from './workspace-item.component';
describe('WorkspaceItem', () => {
  let mockState: RxState<WorkspaceItemState> = new RxState();

  const wsEvent$ = {
    event: '',
    project: '',
    workspace: '',
  };

  const workspaceItem = WorkspaceMockFactory();
  const workspaceItemMember = WorkspaceMemberMockFactory();

  const initialState = {
    invitation: {
      project: {
        acceptedInvite: [],
      },
    },
    workspace: {
      rejectedInvites: [],
      loadingWorkspaces: [],
      workspaceProjects: {
        [workspaceItem.id]: workspaceItem.latestProjects,
        [workspaceItemMember.id]: workspaceItemMember.latestProjects,
      },
    },
  };

  let spectator: Spectator<WorkspaceItemComponent>;

  const createComponent = createComponentFactory({
    component: WorkspaceItemComponent,
    imports: [],
    providers: [
      provideMockStore({ initialState }),
      {
        provide: RxState,
        useValue: mockState,
      },
    ],
    mocks: [UserStorageService, WsService],
  });
  let store: MockStore;

  beforeEach(() => {
    mockState = new RxState();
  });

  describe('guest', () => {
    let mockRejectInviteSelect: MemoizedSelector<
      WorkspaceState,
      Project['id'][]
    >;

    beforeEach(() => {
      spectator = createComponent({
        props: {
          wsEvents: of(wsEvent$),
          workspace: workspaceItem,
          projectsToShow: 3,
        },
        detectChanges: false,
      });
      store = spectator.inject(MockStore);
      const service = spectator.inject(WsService);
      service.command.mockReturnValue(new Observable());
      service.events.mockReturnValue(new Observable());
      mockRejectInviteSelect = store.overrideSelector(
        selectRejectedInvites,
        []
      );
    });

    it('on init', (done) => {
      const rejectedInvites = [workspaceItem.invitedProjects.at(0)!.id];
      store.overrideSelector(selectRejectedInvites, rejectedInvites);

      const availableInvites = workspaceItem.invitedProjects.slice(1);

      spectator.component.projectsToShow = availableInvites.length;

      spectator.detectChanges();

      spectator.component.model$.subscribe(({ invitations }) => {
        expect(invitations.length).toEqual(availableInvites.length);
        done();
      });
    });

    it('reject project invite', (done) => {
      const userStorageService =
        spectator.inject<UserStorageService>(UserStorageService);
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      const id = workspaceItem.invitedProjects.at(0)!.id;
      spectator.component.projectsToShow = workspaceItem.invitedProjects.length;

      spectator.detectChanges();

      spectator.component.rejectProjectInvite(id);

      requestAnimationFrame(() => {
        mockRejectInviteSelect.setResult([id]);
        store.refreshState();

        expect(dispatchSpy).toBeCalledWith(
          setWorkspaceListRejectedInvites({ projects: [id] })
        );

        spectator.component.model$.subscribe(({ invitations }) => {
          expect(userStorageService.set.mock.calls[0][0]).toEqual(
            'general_rejected_invites'
          );
          expect(invitations.length).toEqual(
            workspaceItem.invitedProjects.length - 1
          );
          done();
        });
      });
    });

    it('Change Show All Projects', () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      spectator.detectChanges();
      const action = fetchWorkspaceProjects({
        id: spectator.component.workspace.id,
      });

      spectator.component.setShowAllProjects(false);

      expect(dispatchSpy).not.toBeCalledWith(action);

      spectator.component.setShowAllProjects(true);

      expect(dispatchSpy).toBeCalledWith(action);
    });

    it('Animate sibling rows on reject', (done) => {
      const id = workspaceItem.invitedProjects.at(0)!.id;

      spectator.detectChanges();

      spectator.component.rejectProjectInvite(id);

      requestAnimationFrame(() => {
        spectator.component.model$.subscribe(() => {
          expect(Object.keys(spectator.component.reorder).length).toEqual(3);
          expect(
            (spectator.component.reorder[
              workspaceItem.invitedProjects.at(1)!.id
            ] = 'moving')
          );
          expect(
            (spectator.component.reorder[
              workspaceItem.invitedProjects.at(2)!.id
            ] = 'moving')
          );
          done();
        });
      });
    });

    it('End animation and update state', (done) => {
      const eventObj: any = {
        toState: 'void',
      };
      spectator.component.slideOutAnimationDone(eventObj);
      spectator.detectChanges();
      spectator.component.model$.subscribe(({ slideOutActive }) => {
        expect(slideOutActive).toBeFalsy();
        done();
      });
    });

    it('The project has to reflect at least 3 projects', (done) => {
      spectator.component.projectsToShow = 1;
      spectator.detectChanges();

      spectator.component.model$.subscribe(({ projects, invitations }) => {
        expect(projects.length + invitations.length).toEqual(3);
        done();
      });
    });

    it('A number between 3 to 6 projectToShow should return an equal number of projects ', (done) => {
      spectator.component.projectsToShow = 5;
      spectator.detectChanges();

      spectator.component.model$.subscribe(({ projects, invitations }) => {
        expect(projects.length + invitations.length).toEqual(5);
        done();
      });
    });

    it('The project has to reflect no more than 12 projects if its not showing all projects', (done) => {
      spectator.component.projectsToShow = 30;
      spectator.detectChanges();

      spectator.component.model$.subscribe(({ projects, invitations }) => {
        expect(projects.length + invitations.length).toEqual(12);
        done();
      });
    });

    it('If show all project is true, it should show all the projects ignoring projectsToShow', (done) => {
      spectator.component.setShowAllProjects(true);

      spectator.component.projectsToShow = 3;
      spectator.detectChanges();

      spectator.component.model$.subscribe(({ projects }) => {
        expect(projects.length).toEqual(workspaceItem.latestProjects.length);
        done();
      });
    });

    it('Invitation revoked via event', (done) => {
      const invitationToRevoke =
        spectator.component.workspace.invitedProjects[0].id;
      const workspaceToRevoke = spectator.component.workspace.id;

      const newWorkspace = { ...spectator.component.workspace };
      const invitations = spectator.component.workspace.invitedProjects.filter(
        (workspaceInvitation) => workspaceInvitation.id !== invitationToRevoke
      );
      newWorkspace.invitedProjects = invitations;

      const dispatchSpy = jest.spyOn(store, 'dispatch');
      spectator.component.wsEvent(
        'projectinvitations.revoke',
        invitationToRevoke,
        workspaceToRevoke
      );
      spectator.detectChanges();

      const action = invitationRevokedEvent({
        workspace: newWorkspace,
      });

      spectator.component.model$.subscribe(() => {
        expect(dispatchSpy).toBeCalledWith(action);
        done();
      });
    });

    it('Invitation created via event', (done) => {
      const invitationToCreate =
        spectator.component.workspace.invitedProjects[0].id;
      const currentWorkspace = spectator.component.workspace.id;

      const dispatchSpy = jest.spyOn(store, 'dispatch');
      spectator.component.wsEvent(
        'projectinvitations.create',
        invitationToCreate,
        currentWorkspace
      );
      spectator.detectChanges();
      const action = invitationCreateEvent({
        projectId: invitationToCreate,
        workspaceId: currentWorkspace,
        role: 'guest',
        rejectedInvites: [],
      });

      spectator.component.model$.subscribe(() => {
        expect(dispatchSpy).toBeCalledWith(action);
        done();
      });
    });

    it('Workspace member recived invitation to workspace project', (done) => {
      const currentWorkspace = spectator.component.workspace.id;

      const dispatchSpy = jest.spyOn(store, 'dispatch');
      spectator.component.wsEvent(
        'projectinvitations.create',
        workspaceItemMember.id,
        currentWorkspace
      );
      spectator.detectChanges();
      const action = invitationCreateEvent({
        projectId: spectator.component.workspace.latestProjects[0].id,
        workspaceId: currentWorkspace,
        role: 'guest',
        rejectedInvites: [],
      });

      spectator.component.wsEvents.subscribe(() => {
        expect(dispatchSpy).not.toBeCalledWith(action);
        expect(spectator.component.newProjectsToAnimate.length).toEqual(0);
        done();
      });
    });

    it('Membership created via event', (done) => {
      const memberToCreate =
        spectator.component.workspace.invitedProjects[0].id;
      const currentWorkspace = spectator.component.workspace.id;

      const dispatchSpy = jest.spyOn(store, 'dispatch');
      spectator.component.wsEvent(
        'projectmemberships.create',
        memberToCreate,
        currentWorkspace
      );

      spectator.component.projectsToShow = 3;
      spectator.detectChanges();
      const action = acceptInvitationEvent({
        projectId: memberToCreate,
      });

      spectator.component.model$.subscribe(() => {
        expect(dispatchSpy).toBeCalledWith(action);
        done();
      });
    });
  });

  describe('member', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          wsEvents: of(wsEvent$),
          workspace: workspaceItemMember,
          projectsToShow: 8,
        },
        detectChanges: false,
      });
      const service = spectator.inject(WsService);
      service.command.mockReturnValue(new Observable());
      service.events.mockReturnValue(new Observable());
      store = spectator.inject(MockStore);
    });

    it('Checking when the member user has the invitations also in the projects list', (done) => {
      const projectsToShow = 12;

      spectator.component.projectsToShow = projectsToShow;
      spectator.detectChanges();

      expect(workspaceItemMember.userRole).toEqual('member');
      expect(workspaceItemMember.latestProjects.length).toEqual(12); // 6 regular projects + 6 invites
      expect(workspaceItemMember.invitedProjects.length).toEqual(6);
      expect(workspaceItemMember.totalProjects).toEqual(12);

      spectator.component.model$.subscribe(
        ({ projects, invitations, showMoreProjects }) => {
          expect(projects.length + invitations.length).toEqual(projectsToShow);

          const ids = [...projects, ...invitations].map(
            (project) => project.id
          );

          const uniqSlugs = [...new Set(ids)];

          expect(uniqSlugs.length).toEqual(projectsToShow);
          expect(showMoreProjects).toEqual(false);

          done();
        }
      );
    });

    it('Checking the pagination when the member user has the invitations also in the projects list', (done) => {
      const projectsToShow = 8;

      spectator.component.projectsToShow = projectsToShow;
      spectator.detectChanges();

      expect(workspaceItemMember.userRole).toEqual('member');
      expect(workspaceItemMember.latestProjects.length).toEqual(12); // 6 regular projects + 6 invites
      expect(workspaceItemMember.invitedProjects.length).toEqual(6);
      expect(workspaceItemMember.totalProjects).toEqual(12);

      spectator.component.model$.subscribe(
        ({ projects, invitations, showMoreProjects, remainingProjects }) => {
          expect(projects.length + invitations.length).toEqual(8);

          const ids = [...projects, ...invitations].map(
            (project) => project.id
          );

          const uniqSlugs = [...new Set(ids)];

          expect(uniqSlugs.length).toEqual(projectsToShow);
          expect(showMoreProjects).toEqual(true);
          expect(remainingProjects).toEqual(
            workspaceItemMember.totalProjects - projectsToShow
          );

          done();
        }
      );
    });

    it('Display user has no projects message', (done) => {
      const eventObj: any = {
        toState: 'void',
      };

      spectator.component.workspace = WorkspaceMockFactory();
      spectator.component.workspace.hasProjects = false;
      spectator.component.workspace.latestProjects = [];
      spectator.component.slideOutAnimationDone(eventObj);
      spectator.component.workspace.userRole = 'member';
      spectator.component.getActiveInvitations = jest.fn().mockReturnValue([]);
      spectator.detectChanges();

      spectator.component.model$.subscribe(({ slideOutActive }) => {
        expect(slideOutActive).toBeFalsy();
        done();
      });

      expect(spectator.component.userHasNoAccess).toBeTruthy();
    });

    it('Display user has no access message', (done) => {
      const eventObj: any = {
        toState: 'void',
      };
      spectator.component.workspace = WorkspaceMockFactory();
      spectator.component.workspace.hasProjects = true;
      spectator.component.workspace.latestProjects = [];
      spectator.component.slideOutAnimationDone(eventObj);
      spectator.component.workspace.userRole = 'member';
      spectator.component.getActiveInvitations = jest.fn().mockReturnValue([]);
      spectator.detectChanges();

      spectator.component.model$.subscribe(({ slideOutActive }) => {
        expect(slideOutActive).toBeFalsy();
        done();
      });
      expect(spectator.component.userHasNoAccess).toBeTruthy();
    });
  });
});
