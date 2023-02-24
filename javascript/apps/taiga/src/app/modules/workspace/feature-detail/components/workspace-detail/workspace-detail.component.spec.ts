/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
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

describe('WorkspaceDetailComponent', () => {
  let spectator: Spectator<WorkspaceDetailComponent>;
  let store: MockStore;
  let actions$: Observable<Action>;

  const workspaceItemMember = WorkspaceMemberMockFactory();

  const initialState = {
    invitation: {
      acceptedInvite: [],
      invitations: [],
    },
    workspaceDetail: {
      projects: workspaceItemMember.latestProjects,
      workspace: workspaceItemMember,
      creatingWorkspaceDetail: false,
    },
  };

  const createComponent = createComponentFactory({
    component: WorkspaceDetailComponent,
    imports: [],
    providers: [
      provideMockActions(() => actions$),
      provideMockStore({ initialState }),
      {
        provide: ActivatedRoute,
        useValue: {
          paramMap: of(convertToParamMap({ id: workspaceItemMember.id })),
        },
      },
    ],
    mocks: [UserStorageService, WsService],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    const service = spectator.inject(WsService);
    service.command.mockReturnValue(new Observable());
    service.events.mockReturnValue(new Observable());
    service.userEvents.mockReturnValue(new Observable());
    store = spectator.inject(MockStore);
  });

  it('Invitation revoked via event', (done) => {
    spectator.detectChanges();

    const projectToRevoke = workspaceItemMember.invitedProjects[0].id;
    const dispatchSpy = jest.spyOn(store, 'dispatch');
    const action = invitationDetailRevokedEvent({
      projectId: projectToRevoke,
    });
    spectator.component.invitationRevokedEvent(projectToRevoke);

    spectator.component.model$.subscribe(() => {
      expect(dispatchSpy).toBeCalledWith(action);
      done();
    });
  });

  it('Membership created via event', (done) => {
    spectator.detectChanges();

    const projectToPromote = workspaceItemMember.invitedProjects[0].id;
    const dispatchSpy = jest.spyOn(store, 'dispatch');
    const action = acceptInvitationEvent({
      projectId: projectToPromote,
    });
    spectator.component.membershipCreateEvent(projectToPromote);

    spectator.component.model$.subscribe(() => {
      expect(dispatchSpy).toBeCalledWith(action);
      done();
    });
  });

  it('Invitation created via event', (done) => {
    spectator.detectChanges();

    const projectToInvite = workspaceItemMember.invitedProjects[0].id;
    const workspaceId = workspaceItemMember.id;
    const workspaceRole = workspaceItemMember.userRole;
    const dispatchSpy = jest.spyOn(store, 'dispatch');
    const action = invitationDetailCreateEvent({
      projectId: projectToInvite,
      workspaceId: workspaceId,
      role: workspaceRole,
    });
    spectator.component.invitationCreateEvent(projectToInvite);

    spectator.component.model$.subscribe(() => {
      expect(dispatchSpy).toBeCalledWith(action);
      done();
    });
  });

  it('refresh invitation', (done) => {
    spectator.detectChanges();

    const newInvitations = workspaceItemMember.invitedProjects;
    const idNewInvitation = newInvitations[0].id;
    const oldInvitations = [...newInvitations];
    oldInvitations.shift();

    if (oldInvitations) {
      spectator.component.refreshInvitations(oldInvitations, newInvitations);
    }

    spectator.component.model$.subscribe(({ invitations }) => {
      expect(
        invitations.find((invitation) => invitation.id === idNewInvitation)
      ).toBeTruthy();
      done();
    });
  });

  it('getSiblings: check that return same amounf of project to show', (done) => {
    spectator.detectChanges();

    let siblings: WorkspaceProject[] | undefined;
    const newInvitations = workspaceItemMember.invitedProjects;
    store.setState({
      ...initialState,
      invitation: {
        invitations: newInvitations,
        acceptedInvite: [],
      },
      workspaceDetail: {
        workspaceProjects: workspaceItemMember.latestProjects,
        workspaceInvitedProjects: newInvitations,
      },
    });
    spectator.detectChanges();

    spectator.component.amountOfProjectsToShow = 6;

    requestAnimationFrame(() => {
      siblings = spectator.component.getSiblingsRow(
        workspaceItemMember.invitedProjects[1].id
      );
      expect(siblings).toHaveLength(spectator.component.amountOfProjectsToShow);
      done();
    });
  });

  it('getSiblings: check that sibling are on the same line', (done) => {
    let siblings: WorkspaceProject[] | undefined;
    spectator.detectChanges();

    const newInvitations = workspaceItemMember.invitedProjects;
    store.setState({
      ...initialState,
      invitation: {
        invitations: newInvitations,
        acceptedInvite: [],
      },
      workspaceDetail: {
        workspaceProjects: workspaceItemMember.latestProjects,
        workspaceInvitedProjects: newInvitations,
      },
    });
    spectator.detectChanges();

    spectator.component.amountOfProjectsToShow = 4;

    requestAnimationFrame(() => {
      siblings = spectator.component.getSiblingsRow(
        workspaceItemMember.invitedProjects[4].id
      );
      spectator.component.model$.subscribe(({ invitations }) => {
        if (siblings) {
          expect(siblings[0].id).toBe(
            invitations[spectator.component.amountOfProjectsToShow - 1 + 1].id
          );
          expect(siblings[1].id).toBe(
            invitations[spectator.component.amountOfProjectsToShow - 1 + 2].id
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
    spectator.detectChanges();

    const newInvitations = workspaceItemMember.invitedProjects;
    store.setState({
      ...initialState,
      invitation: {
        invitations: newInvitations,
        acceptedInvite: [],
      },
      workspaceDetail: {
        ...initialState.workspaceDetail,
        workspaceProjects: workspaceItemMember.latestProjects,
        workspaceInvitedProjects: newInvitations,
      },
    });

    spectator.detectChanges();

    spectator.component.amountOfProjectsToShow = 4;

    requestAnimationFrame(() => {
      spectator.component.model$.subscribe(({ invitations }) => {
        spectator.component.animateLeavingInvitationSiblings(invitations[4].id);
        expect(spectator.component.reorder[invitations[4].id]).toBe('entering');
        done();
      });
    });
  });
});
