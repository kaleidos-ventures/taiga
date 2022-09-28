/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ActivatedRoute, convertToParamMap } from '@angular/router';
import {
  createComponentFactory,
  createServiceFactory,
  Spectator,
  SpectatorService,
} from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { ConfigService } from '@taiga/core';
import { WorkspaceMemberMockFactory, WorkspaceProject } from '@taiga/data';
import { Observable, of } from 'rxjs';

import {
  invitationDetailCreateEvent,
  invitationDetailRevokedEvent,
} from '~/app/modules/workspace/feature-detail/+state/actions/workspace-detail.actions';
import { acceptInvitationEvent } from '~/app/modules/workspace/feature-list/+state/actions/workspace.actions';
import { WsService } from '~/app/services/ws';
import { UserStorageService } from '~/app/shared/user-storage/user-storage.service';
import { WorkspaceDetailComponent } from './workspace-detail.component';

describe('ButtonComponent', () => {
  let spectator: Spectator<WorkspaceDetailComponent>;
  let spectatorWs: SpectatorService<WsService>;
  let store: MockStore;
  let actions$: Observable<Action>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let service: WsService;
  // const mockState: RxState<WorkspaceDetailState> = new RxState();

  const workspaceItemMember = WorkspaceMemberMockFactory();

  const initialState = {
    invitation: {
      acceptedInvite: [],
      invitations: [],
    },
    workspace: {
      projects: workspaceItemMember.latestProjects,
      workspace: workspaceItemMember,
      creatingWorkspaceDetail: false,
    },
  };

  const createService = createServiceFactory({
    service: WsService,
    providers: [
      provideMockActions(() => actions$),
      { provide: ConfigService, useValue: {} },
    ],
  });

  const createComponent = createComponentFactory({
    component: WorkspaceDetailComponent,
    imports: [],
    providers: [
      provideMockStore({ initialState }),
      {
        provide: ActivatedRoute,
        useValue: {
          paramMap: of(convertToParamMap({ slug: workspaceItemMember.slug })),
        },
      },
    ],
    mocks: [UserStorageService],
  });

  beforeEach(() => {
    spectatorWs = createService();
    service = spectatorWs.inject(WsService);

    spectator = createComponent();
    store = spectator.inject(MockStore);
  });

  it('Invitation revoked via event', (done) => {
    const projectToRevoke = workspaceItemMember.invitedProjects[0].slug;
    const dispatchSpy = jest.spyOn(store, 'dispatch');
    const action = invitationDetailRevokedEvent({
      projectSlug: projectToRevoke,
    });
    spectator.component.invitationRevokedEvent(projectToRevoke);

    spectator.component.model$.subscribe(() => {
      expect(dispatchSpy).toBeCalledWith(action);
      done();
    });
  });

  it('Membership created via event', (done) => {
    const projectToPromote = workspaceItemMember.invitedProjects[0].slug;
    const dispatchSpy = jest.spyOn(store, 'dispatch');
    const action = acceptInvitationEvent({
      projectSlug: projectToPromote,
    });
    spectator.component.membershipCreateEvent(projectToPromote);

    spectator.component.model$.subscribe(() => {
      expect(dispatchSpy).toBeCalledWith(action);
      done();
    });
  });

  it('Invitation created via event', (done) => {
    const projectToInvite = workspaceItemMember.invitedProjects[0].slug;
    const workspaceSlug = workspaceItemMember.slug;
    const workspaceRole = workspaceItemMember.userRole;
    const dispatchSpy = jest.spyOn(store, 'dispatch');
    const action = invitationDetailCreateEvent({
      projectSlug: projectToInvite,
      workspaceSlug: workspaceSlug,
      role: workspaceRole,
    });
    spectator.component.invitationCreateEvent(projectToInvite);

    spectator.component.model$.subscribe(() => {
      expect(dispatchSpy).toBeCalledWith(action);
      done();
    });
  });

  it('refresh invitation', (done) => {
    const newInvitations = workspaceItemMember.invitedProjects;
    const slugNewInvitation = newInvitations[0].slug;
    const oldInvitations = [...newInvitations];
    oldInvitations.shift();

    if (oldInvitations) {
      spectator.component.refreshInvitations(oldInvitations, newInvitations);
    }

    spectator.component.model$.subscribe(({ invitations }) => {
      expect(
        invitations.find((invitation) => invitation.slug === slugNewInvitation)
      ).toBeTruthy();
      done();
    });
  });

  it('getSiblings: check that return same amounf of project to show', (done) => {
    let siblings: WorkspaceProject[] | undefined;
    const newInvitations = workspaceItemMember.invitedProjects;
    store.setState({
      ...initialState,
      invitation: {
        invitations: newInvitations,
        acceptedInvite: [],
      },
      workspace: {
        workspaceProjects: workspaceItemMember.latestProjects,
        workspaceInvitedProjects: newInvitations,
      },
    });
    spectator.detectChanges();

    spectator.component.amountOfProjectsToShow = 6;

    requestAnimationFrame(() => {
      siblings = spectator.component.getSiblingsRow(
        workspaceItemMember.invitedProjects[1].slug
      );
      expect(siblings).toHaveLength(spectator.component.amountOfProjectsToShow);
      done();
    });
  });

  it('getSiblings: check that sibling are on the same line', (done) => {
    let siblings: WorkspaceProject[] | undefined;
    const newInvitations = workspaceItemMember.invitedProjects;
    store.setState({
      ...initialState,
      invitation: {
        invitations: newInvitations,
        acceptedInvite: [],
      },
      workspace: {
        workspaceProjects: workspaceItemMember.latestProjects,
        workspaceInvitedProjects: newInvitations,
      },
    });
    spectator.detectChanges();

    spectator.component.amountOfProjectsToShow = 4;

    requestAnimationFrame(() => {
      siblings = spectator.component.getSiblingsRow(
        workspaceItemMember.invitedProjects[4].slug
      );
      spectator.component.model$.subscribe(({ invitations }) => {
        if (siblings) {
          expect(siblings[0].slug).toBe(
            invitations[spectator.component.amountOfProjectsToShow - 1 + 1].slug
          );
          expect(siblings[1].slug).toBe(
            invitations[spectator.component.amountOfProjectsToShow - 1 + 2].slug
          );
        }
        done();
      });
    });
  });

  it('setCardAmount: should set amountOfProjectToShow', () => {
    // amountOfProjectToshow is max 10
    spectator.component.setCardAmounts(260);
    expect(spectator.component.amountOfProjectsToShow).toBe(2);
    spectator.component.setCardAmounts(666);
    expect(spectator.component.amountOfProjectsToShow).toBe(3);
    spectator.component.setCardAmounts(900);
    expect(spectator.component.amountOfProjectsToShow).toBe(4);
    spectator.component.setCardAmounts(1142);
    expect(spectator.component.amountOfProjectsToShow).toBe(5);
    spectator.component.setCardAmounts(1492);
    expect(spectator.component.amountOfProjectsToShow).toBe(6);
    spectator.component.setCardAmounts(1662);
    expect(spectator.component.amountOfProjectsToShow).toBe(7);
    spectator.component.setCardAmounts(1922);
    expect(spectator.component.amountOfProjectsToShow).toBe(8);
    spectator.component.setCardAmounts(2121);
    expect(spectator.component.amountOfProjectsToShow).toBe(9);
    spectator.component.setCardAmounts(3000);
    expect(spectator.component.amountOfProjectsToShow).toBe(10);
  });

  it('animateLeavingInvitationSiblings: check that invitation is entering on reorder', (done) => {
    const newInvitations = workspaceItemMember.invitedProjects;
    store.setState({
      ...initialState,
      invitation: {
        invitations: newInvitations,
        acceptedInvite: [],
      },
      workspace: {
        workspaceProjects: workspaceItemMember.latestProjects,
        workspaceInvitedProjects: newInvitations,
      },
    });
    spectator.detectChanges();

    spectator.component.amountOfProjectsToShow = 4;

    requestAnimationFrame(() => {
      spectator.component.model$.subscribe(({ invitations }) => {
        spectator.component.animateLeavingInvitationSiblings(
          invitations[4].slug
        );
        expect(spectator.component.reorder[invitations[4].slug]).toBe(
          'entering'
        );
        done();
      });
    });
  });
});
