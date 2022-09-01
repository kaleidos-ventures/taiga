/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Router } from '@angular/router';
import {
  randEmail,
  randFullName,
  randRole,
  randSlug,
  randUserName,
} from '@ngneat/falso';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { InvitationApiService, ProjectApiService } from '@taiga/api';
import {
  InvitationMockFactory,
  MembershipMockFactory,
  ProjectMockFactory,
} from '@taiga/data';
import { randomUUID } from 'crypto';
import { cold, hot } from 'jest-marbles';
import { Observable } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { AppService } from '~/app/services/app.service';
import { membersActions } from '../actions/members.actions';
import {
  selectInvitationsOffset,
  selectMembersOffset,
  selectOpenRevokeInvitationDialog,
  selectUndoDoneAnimation,
} from '../selectors/members.selectors';
import { MembersEffects } from './members.effects';

describe('MembersEffects', () => {
  let actions$: Observable<Action>;
  let store: MockStore;
  let spectator: SpectatorService<MembersEffects>;

  const initialState = {
    overview: {
      members: [],
      invitations: [],
      totalInvitations: 0,
      totalMemberships: 0,
      hasMoreMembers: true,
      hasMoreInvitations: true,
    },
  };

  const createService = createServiceFactory({
    service: MembersEffects,
    providers: [
      provideMockActions(() => actions$),
      provideMockStore({
        initialState,
      }),
    ],
    imports: [],
    mocks: [ProjectApiService, AppService, Router, InvitationApiService],
  });

  beforeEach(() => {
    spectator = createService();
    store = spectator.inject(MockStore);
  });

  it('next members page', () => {
    const project = ProjectMockFactory();

    store.overrideSelector(selectCurrentProject, project);

    const projectApiService = spectator.inject(ProjectApiService);
    const effects = spectator.inject(MembersEffects);

    const membershipResponse = {
      memberships: [MembershipMockFactory(), MembershipMockFactory()],
      totalMemberships: 2,
    };

    projectApiService.getMembers.mockReturnValue(
      cold('-b|', { b: membershipResponse })
    );

    actions$ = hot('-a', { a: membersActions.setMembersPage({ offset: 0 }) });

    const expected = cold('--a', {
      a: membersActions.fetchMembersSuccess({
        members: membershipResponse.memberships,
        totalMemberships: membershipResponse.totalMemberships,
        offset: 0,
      }),
    });

    expect(effects.nextMembersPage$).toBeObservable(expected);
    expect(effects.nextMembersPage$).toSatisfyOnFlush(() => {
      expect(projectApiService.getMembers).toHaveBeenCalledWith(
        project.slug,
        0,
        20
      );
    });
  });

  it('next invitations page', () => {
    const project = ProjectMockFactory();

    store.overrideSelector(selectCurrentProject, project);

    const projectApiService = spectator.inject(ProjectApiService);
    const effects = spectator.inject(MembersEffects);

    const invitationsResponse = {
      invitations: [InvitationMockFactory(), InvitationMockFactory()],
      totalInvitations: 2,
    };

    projectApiService.getInvitations.mockReturnValue(
      cold('-b|', { b: invitationsResponse })
    );

    actions$ = hot('-a', { a: membersActions.setPendingPage({ offset: 0 }) });

    const expected = cold('--a', {
      a: membersActions.fetchInvitationsSuccess({
        invitations: invitationsResponse.invitations,
        totalInvitations: invitationsResponse.totalInvitations,
        offset: 0,
      }),
    });

    expect(effects.nextPendingPage$).toBeObservable(expected);
    expect(effects.nextPendingPage$).toSatisfyOnFlush(() => {
      expect(projectApiService.getInvitations).toHaveBeenCalledWith(
        project.slug,
        0,
        20
      );
    });
  });

  it('resend invitations', () => {
    const invitationApiService = spectator.inject(InvitationApiService);
    const effects = spectator.inject(MembersEffects);

    invitationApiService.resendInvitation.mockReturnValue(cold('-b|', {}));

    actions$ = hot('-a', {
      a: membersActions.resendInvitation({
        slug: randSlug(),
        usernameOrEmail: randEmail(),
      }),
    });

    const expected = cold('--a', {
      a: membersActions.resendInvitationSuccess(),
    });

    expect(effects.resendInvitation$).toBeObservable(expected);
  });

  it('update members list', () => {
    const projectApiService = spectator.inject(ProjectApiService);
    const effects = spectator.inject(MembersEffects);
    const project = ProjectMockFactory();
    const offset = 0;

    const membersResponse = {
      memberships: [MembershipMockFactory()],
      totalMemberships: 1,
      offset,
    };

    projectApiService.getMembers.mockReturnValue(
      cold('-b|', { b: membersResponse })
    );

    store.overrideSelector(selectCurrentProject, project);
    store.overrideSelector(selectMembersOffset, offset);

    actions$ = hot('-a', {
      a: membersActions.updateMembersList({ eventType: 'create' }),
    });

    const expected = cold('--a', {
      a: membersActions.fetchMembersSuccess({
        members: membersResponse.memberships,
        totalMemberships: membersResponse.totalMemberships,
        offset: offset,
      }),
    });

    expect(effects.updateMembersList$).toBeObservable(expected);
  });

  it('update invitations list', () => {
    const projectApiService = spectator.inject(ProjectApiService);
    const effects = spectator.inject(MembersEffects);
    const project = ProjectMockFactory();
    const offset = 0;

    const invitationsResponse = {
      invitations: [InvitationMockFactory()],
      totalInvitations: 1,
      offset,
    };

    projectApiService.getInvitations.mockReturnValue(
      cold('-b|', { b: invitationsResponse })
    );

    store.overrideSelector(selectCurrentProject, project);
    store.overrideSelector(selectInvitationsOffset, offset);

    actions$ = hot('-a', {
      a: membersActions.updateMembersList({ eventType: 'create' }),
    });

    const expected = cold('--a', {
      a: membersActions.fetchInvitationsSuccess({
        invitations: invitationsResponse.invitations,
        totalInvitations: invitationsResponse.totalInvitations,
        offset: offset,
      }),
    });

    expect(effects.updateInvitationsList$).toBeObservable(expected);
  });

  it('revoke invitation', () => {
    const projectApiService = spectator.inject(ProjectApiService);
    const effects = spectator.inject(MembersEffects);
    const project = ProjectMockFactory();
    const invitation = InvitationMockFactory();

    projectApiService.revokeInvitation.mockReturnValue(
      cold('-b|', { b: null })
    );

    store.overrideSelector(selectCurrentProject, project);

    actions$ = hot('-a', {
      a: membersActions.revokeInvitation({ invitation }),
    });

    const expected = cold('--a', {
      a: membersActions.revokeInvitationSuccess(),
    });

    expect(effects.revokeInvitation$).toBeObservable(expected);
  });

  it('show undo confirmation', () => {
    const effects = spectator.inject(MembersEffects);
    const invitation = InvitationMockFactory();

    const testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });

    testScheduler.run((helpers) => {
      const { expectObservable, hot } = helpers;

      actions$ = hot('-a', {
        a: membersActions.undoCancelInvitationUi({ invitation }),
      });

      expectObservable(effects.showUndoConfirmation$).toBe('1001ms a', {
        a: membersActions.undoDoneAnimation({ invitation }),
      });
    });
  });

  it('prevent show undo if revoke dialog is open', () => {
    const effects = spectator.inject(MembersEffects);
    const invitation = InvitationMockFactory();

    const testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });

    store.overrideSelector(selectOpenRevokeInvitationDialog, invitation.email);

    testScheduler.run((helpers) => {
      const { expectObservable, hot } = helpers;

      actions$ = hot('-a', {
        a: membersActions.undoCancelInvitationUi({ invitation }),
      });

      expectObservable(effects.showUndoConfirmation$).toBe('');
    });
  });

  it('undo done animation', () => {
    const effects = spectator.inject(MembersEffects);
    const invitation = InvitationMockFactory();

    const testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });

    store.overrideSelector(selectUndoDoneAnimation, [invitation.email]);

    testScheduler.run((helpers) => {
      const { expectObservable, hot } = helpers;

      actions$ = hot('-a', {
        a: membersActions.undoDoneAnimation({ invitation }),
      });

      expectObservable(effects.undoDoneAnimation$).toBe('3001ms a', {
        a: membersActions.removeUndoDoneAnimation({ invitation }),
      });
    });
  });

  it('change member role', () => {
    const projectApiService = spectator.inject(ProjectApiService);
    const effects = spectator.inject(MembersEffects);
    const memberRole = {
      roleSlug: randSlug(),
      username: randUserName(),
      oldRole: {
        isAdmin: false,
        name: randRole(),
        slug: randSlug(),
      },
    };
    const memberRoleResponse = {
      user: {
        username: memberRole.username,
        fullName: randFullName(),
      },
      role: {
        isAdmin: false,
        name: memberRole.oldRole.name,
        slug: memberRole.roleSlug,
      },
    };

    projectApiService.updateMemberRole.mockReturnValue(
      cold('-b|', memberRoleResponse)
    );

    actions$ = hot('a', {
      a: membersActions.updateMemberRole(memberRole),
    });

    const expected = cold('-a', {
      a: membersActions.updateMemberRoleSuccess(),
    });

    expect(effects.updateMemberRole$).toBeObservable(expected);
  });

  it('change invitation role', () => {
    const projectApiService = spectator.inject(ProjectApiService);
    const effects = spectator.inject(MembersEffects);
    const invitationRole = {
      roleSlug: randSlug(),
      id: randomUUID(),
      oldRole: {
        isAdmin: false,
        name: randRole(),
        slug: randSlug(),
      },
    };
    const invitationRoleResponse = {
      user: {
        id: invitationRole.id,
        fullName: randFullName(),
      },
      role: {
        isAdmin: false,
        name: invitationRole.oldRole.name,
        slug: invitationRole.roleSlug,
      },
    };

    projectApiService.updateInvitationRole.mockReturnValue(
      cold('-b|', invitationRoleResponse)
    );

    actions$ = hot('a', {
      a: membersActions.updateInvitationRole(invitationRole),
    });

    const expected = cold('-a', {
      a: membersActions.updateInvitationRoleSuccess(),
    });

    expect(effects.updateInvitationRole$).toBeObservable(expected);
  });
});
