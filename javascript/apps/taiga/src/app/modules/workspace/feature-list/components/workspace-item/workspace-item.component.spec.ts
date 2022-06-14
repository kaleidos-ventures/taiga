/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { WorkspaceItemComponent } from './workspace-item.component';
import {
  WorkspaceAdminMockFactory,
  WorkspaceMemberMockFactory,
  WorkspaceMockFactory,
} from '@taiga/data';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { fetchWorkspaceProjects } from '~/app/modules/workspace/feature-list/+state/actions/workspace.actions';
import { LocalStorageService } from '~/app/shared/local-storage/local-storage.service';

describe('WorkspaceItem', () => {
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
  const createComponent = createComponentFactory({
    component: WorkspaceItemComponent,
    imports: [],
    providers: [provideMockStore({ initialState })],
    mocks: [LocalStorageService],
  });
  let store: MockStore;

  describe('guest', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          workspace: workspaceItem,
          projectsToShow: 3,
        },
        detectChanges: false,
      });
      store = spectator.inject(MockStore);
    });

    it('on init', (done) => {
      const localStorageService =
        spectator.inject<LocalStorageService>(LocalStorageService);

      const rejectedInvites = [workspaceItem.invitedProjects.at(0)?.slug];
      localStorageService.get.mockReturnValue(rejectedInvites);

      const availableInvites = workspaceItem.invitedProjects.slice(1);

      spectator.component.projectsToShow = availableInvites.length;

      spectator.detectChanges();

      spectator.component.model$.subscribe(({ invitations }) => {
        expect(invitations.length).toEqual(availableInvites.length);
        done();
      });
    });

    it('reject project invite', (done) => {
      const localStorageService =
        spectator.inject<LocalStorageService>(LocalStorageService);

      const slug = workspaceItem.invitedProjects.at(0)!.slug;
      spectator.component.projectsToShow = workspaceItem.invitedProjects.length;

      spectator.detectChanges();

      spectator.component.rejectProjectInvite(slug);

      spectator.component.model$.subscribe(({ invitations }) => {
        expect(localStorageService.set.mock.calls[0][0]).toEqual(
          'general_rejected_invites'
        );
        expect(invitations.length).toEqual(
          workspaceItem.invitedProjects.length - 1
        );
        done();
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

      spectator.component.model$.subscribe(({ slideOutActive }) => {
        expect(slideOutActive).toBeTruthy();
        expect(Object.keys(spectator.component.reorder).length).toEqual(2);
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

    it('End animation and update state', (done) => {
      spectator.component.slideOutAnimationDone();
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

      expect(workspaceItemMember.myRole).toEqual('member');
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

      expect(workspaceItemMember.myRole).toEqual('member');
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

      const acceptedInvitation = workspaceItemMember.invitedProjects[0].slug;

      spectator.component.projectsToShow = projectsToShow;

      store.setState({
        ...initialState,
        invitation: {
          acceptedInvite: [acceptedInvitation],
        },
      });

      spectator.component.acceptProjectInvite(acceptedInvitation);
      spectator.detectChanges();

      spectator.component.model$.subscribe(({ projects, invitations }) => {
        expect(
          invitations.find(
            (invitation) => invitation.slug === acceptedInvitation
          )
        ).toBeTruthy();
        expect(
          projects.find((project) => project.slug === acceptedInvitation)
        ).toBeFalsy();

        done();
      });
    });
  });

  describe('admin', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
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

      expect(workspaceItemAdmin.myRole).toEqual('admin');
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

      expect(workspaceItemAdmin.myRole).toEqual('admin');
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
    spectator.component.workspace = WorkspaceMockFactory();

    spectator.component.workspace.hasProjects = false;
    spectator.component.workspace.latestProjects = [];
    spectator.component.slideOutAnimationDone();
    spectator.component.workspace.myRole = 'member';
    spectator.component.getActiveInvitations = jest.fn().mockReturnValue([]);

    spectator.component.model$.subscribe(({ slideOutActive }) => {
      expect(slideOutActive).toBeFalsy();
      done();
    });

    expect(spectator.component.userHasNoAccess).toBeTruthy();
  });

  it('Display user has no access message', (done) => {
    spectator.component.workspace = WorkspaceMockFactory();

    spectator.component.workspace.hasProjects = true;
    spectator.component.workspace.latestProjects = [];
    spectator.component.slideOutAnimationDone();
    spectator.component.workspace.myRole = 'member';
    spectator.component.getActiveInvitations = jest.fn().mockReturnValue([]);

    spectator.component.model$.subscribe(({ slideOutActive }) => {
      expect(slideOutActive).toBeFalsy();
      done();
    });

    expect(spectator.component.userHasNoAccess).toBeTruthy();
  });
});
