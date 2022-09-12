/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import {
  createComponentFactory,
  createServiceFactory,
  Spectator,
  SpectatorService,
} from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action, MemoizedSelector } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { ConfigService } from '@taiga/core';
import {
  Project,
  WorkspaceAdminMockFactory,
  WorkspaceMemberMockFactory,
  WorkspaceMockFactory,
} from '@taiga/data';
import { Observable, of } from 'rxjs';
import {
  fetchWorkspaceProjects,
  setWorkspaceListRejectedInvites,
} from '~/app/modules/workspace/feature-list/+state/actions/workspace.actions';
import { WorkspaceState } from '~/app/modules/workspace/feature-list/+state/reducers/workspace.reducer';
import { selectRejectedInvites } from '~/app/modules/workspace/feature-list/+state/selectors/workspace.selectors';
import { WsService } from '~/app/services/ws';
import { UserStorageService } from '~/app/shared/user-storage/user-storage.service';
import { WorkspaceItemComponent } from './workspace-item.component';

describe('WorkspaceItem', () => {
  let actions$: Observable<Action>;
  let spectatorWs: SpectatorService<WsService>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let service: WsService;

  const wsEvent$ = {
    event: '',
    project: '',
    workspace: '',
  };

  const workspaceItem = WorkspaceMockFactory();
  const workspaceItemAdmin = WorkspaceAdminMockFactory();
  const workspaceItemMember = WorkspaceMemberMockFactory();

  const initialState = {
    invitation: {
      acceptedInvite: [],
    },
    workspaceList: {
      loadingWorkspaces: [],
      workspaceProjects: {
        [workspaceItem.slug]: workspaceItem.latestProjects,
        [workspaceItemAdmin.slug]: workspaceItemAdmin.latestProjects,
        [workspaceItemMember.slug]: workspaceItemMember.latestProjects,
      },
    },
  };

  let spectator: Spectator<WorkspaceItemComponent>;

  const createService = createServiceFactory({
    service: WsService,
    providers: [
      provideMockActions(() => actions$),
      provideMockStore({}),
      { provide: ConfigService, useValue: {} },
    ],
  });

  const createComponent = createComponentFactory({
    component: WorkspaceItemComponent,
    imports: [],
    providers: [provideMockStore({ initialState })],
    mocks: [UserStorageService],
  });
  let store: MockStore;

  beforeEach(() => {
    spectatorWs = createService();
    service = spectatorWs.inject(WsService);
  });

  describe('guest', () => {
    let mockRejectInviteSelect: MemoizedSelector<
      WorkspaceState,
      Project['slug'][]
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

      mockRejectInviteSelect = store.overrideSelector(
        selectRejectedInvites,
        []
      );
    });

    it('on init', (done) => {
      const rejectedInvites = [workspaceItem.invitedProjects.at(0)!.slug];
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

      const slug = workspaceItem.invitedProjects.at(0)!.slug;
      spectator.component.projectsToShow = workspaceItem.invitedProjects.length;

      spectator.detectChanges();

      spectator.component.rejectProjectInvite(slug);

      requestAnimationFrame(() => {
        mockRejectInviteSelect.setResult([slug]);
        store.refreshState();

        expect(dispatchSpy).toBeCalledWith(
          setWorkspaceListRejectedInvites({ projects: [slug] })
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
        slug: spectator.component.workspace.slug,
      });

      spectator.component.setShowAllProjects(false);

      expect(dispatchSpy).not.toBeCalledWith(action);

      spectator.component.setShowAllProjects(true);

      expect(dispatchSpy).toBeCalledWith(action);
    });

    it('Animate sibling rows on reject', (done) => {
      const slug = workspaceItem.invitedProjects.at(0)!.slug;

      spectator.detectChanges();

      spectator.component.rejectProjectInvite(slug);

      requestAnimationFrame(() => {
        spectator.component.model$.subscribe(({ slideOutActive }) => {
          expect(slideOutActive).toBeTruthy();
          expect(Object.keys(spectator.component.reorder).length).toEqual(3);
          expect(
            (spectator.component.reorder[
              workspaceItem.invitedProjects.at(1)!.slug
            ] = 'moving')
          );
          expect(
            (spectator.component.reorder[
              workspaceItem.invitedProjects.at(2)!.slug
            ] = 'moving')
          );
          done();
        });
      });
    });

    it('End animation and update state', (done) => {
      const eventObj: any = { event: { toState: 'void' } };

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
      store = spectator.inject(MockStore);
    });

    it('Checking when the member user has the invitations also in the projects list', (done) => {
      const projectsToShow = 18;

      spectator.component.projectsToShow = projectsToShow;
      spectator.detectChanges();

      expect(workspaceItemMember.userRole).toEqual('member');
      expect(workspaceItemMember.latestProjects.length).toEqual(12); // 6 private projects + 6 public projects with invite
      expect(workspaceItemMember.invitedProjects.length).toEqual(12);
      expect(workspaceItemMember.totalProjects).toEqual(12);

      spectator.component.model$.subscribe(
        ({ projects, invitations, showMoreProjects }) => {
          expect(projects.length + invitations.length).toEqual(projectsToShow);

          const slugs = [...projects, ...invitations].map(
            (project) => project.slug
          );

          const uniqSlugs = [...new Set(slugs)];

          expect(uniqSlugs.length).toEqual(projectsToShow);
          expect(showMoreProjects).toEqual(false);

          done();
        }
      );
    });

    it('Checking the pagination when the member user has the invitations also in the projects list', (done) => {
      const projectsToShow = 12;

      spectator.component.projectsToShow = projectsToShow;
      spectator.detectChanges();

      expect(workspaceItemMember.userRole).toEqual('member');
      expect(workspaceItemMember.latestProjects.length).toEqual(12); // 6 private projects + 6 public projects with invite
      expect(workspaceItemMember.invitedProjects.length).toEqual(12);
      expect(workspaceItemMember.totalProjects).toEqual(12);

      spectator.component.model$.subscribe(
        ({ projects, invitations, showMoreProjects, remainingProjects }) => {
          expect(projects.length + invitations.length).toEqual(12);

          const slugs = [...projects, ...invitations].map(
            (project) => project.slug
          );

          const uniqSlugs = [...new Set(slugs)];

          expect(uniqSlugs.length).toEqual(projectsToShow);
          expect(showMoreProjects).toEqual(true);
          expect(remainingProjects).toEqual(
            workspaceItemAdmin.totalProjects + 6 - projectsToShow // 6 = invitations to private projects
          );

          done();
        }
      );
    });

    it('Accept invitation does not remove the project from invitations but remove it from projects', (done) => {
      const projectsToShow = 50;

      const acceptedInvitationSlug =
        workspaceItemMember.invitedProjects[0].slug;
      const acceptedInvitationName =
        workspaceItemMember.invitedProjects[0].name;

      spectator.component.projectsToShow = projectsToShow;

      store.setState({
        ...initialState,
        invitation: {
          acceptedInvite: [acceptedInvitationSlug],
        },
      });

      spectator.component.acceptProjectInvite(
        acceptedInvitationSlug,
        acceptedInvitationName
      );
      spectator.detectChanges();

      spectator.component.model$.subscribe(({ projects, invitations }) => {
        expect(
          invitations.find(
            (invitation) => invitation.slug === acceptedInvitationSlug
          )
        ).toBeTruthy();
        expect(
          projects.find((project) => project.slug === acceptedInvitationSlug)
        ).toBeFalsy();

        done();
      });
    });
  });

  describe('admin', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          wsEvents: of(wsEvent$),
          workspace: workspaceItemAdmin,
          projectsToShow: 8,
        },
        detectChanges: false,
      });
      store = spectator.inject(MockStore);
    });

    it('Checking when the admin user has the invitations also in the projects list', (done) => {
      const projectsToShow = 12;

      spectator.component.projectsToShow = projectsToShow;
      spectator.detectChanges();

      expect(workspaceItemAdmin.userRole).toEqual('admin');
      expect(workspaceItemAdmin.latestProjects.length).toEqual(12); // 6 regular projects + 6 invites
      expect(workspaceItemAdmin.invitedProjects.length).toEqual(6);
      expect(workspaceItemAdmin.totalProjects).toEqual(12);

      spectator.component.model$.subscribe(
        ({ projects, invitations, showMoreProjects }) => {
          expect(projects.length + invitations.length).toEqual(projectsToShow);

          const slugs = [...projects, ...invitations].map(
            (project) => project.slug
          );

          const uniqSlugs = [...new Set(slugs)];

          expect(uniqSlugs.length).toEqual(projectsToShow);
          expect(showMoreProjects).toEqual(false);

          done();
        }
      );
    });

    it('Checking the pagination when the admin user has the invitations also in the projects list', (done) => {
      const projectsToShow = 8;

      spectator.component.projectsToShow = projectsToShow;
      spectator.detectChanges();

      expect(workspaceItemAdmin.userRole).toEqual('admin');
      expect(workspaceItemAdmin.latestProjects.length).toEqual(12); // 6 regular projects + 6 invites
      expect(workspaceItemAdmin.invitedProjects.length).toEqual(6);
      expect(workspaceItemAdmin.totalProjects).toEqual(12);

      spectator.component.model$.subscribe(
        ({ projects, invitations, showMoreProjects, remainingProjects }) => {
          expect(projects.length + invitations.length).toEqual(8);

          const slugs = [...projects, ...invitations].map(
            (project) => project.slug
          );

          const uniqSlugs = [...new Set(slugs)];

          expect(uniqSlugs.length).toEqual(projectsToShow);
          expect(showMoreProjects).toEqual(true);
          expect(remainingProjects).toEqual(
            workspaceItemAdmin.totalProjects - projectsToShow
          );

          done();
        }
      );
    });
  });

  it('Display user has no projects message', (done) => {
    const eventObj: any = { event: { toState: 'void' } };

    spectator.component.workspace = WorkspaceMockFactory();
    spectator.component.workspace.hasProjects = false;
    spectator.component.workspace.latestProjects = [];
    spectator.component.slideOutAnimationDone(eventObj);
    spectator.component.workspace.userRole = 'member';
    spectator.component.getActiveInvitations = jest.fn().mockReturnValue([]);

    spectator.component.model$.subscribe(({ slideOutActive }) => {
      expect(slideOutActive).toBeFalsy();
      done();
    });

    expect(spectator.component.userHasNoAccess).toBeTruthy();
  });

  it('Display user has no access message', (done) => {
    const eventObj: any = { event: { toState: 'void' } };

    spectator.component.workspace = WorkspaceMockFactory();
    spectator.component.workspace.hasProjects = true;
    spectator.component.workspace.latestProjects = [];
    spectator.component.slideOutAnimationDone(eventObj);
    spectator.component.workspace.userRole = 'member';
    spectator.component.getActiveInvitations = jest.fn().mockReturnValue([]);

    spectator.component.model$.subscribe(({ slideOutActive }) => {
      expect(slideOutActive).toBeFalsy();
      done();
    });

    expect(spectator.component.userHasNoAccess).toBeTruthy();
  });
});
