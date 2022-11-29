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
  randSlug,
  randUserName,
  randUuid,
  randWord,
} from '@ngneat/falso';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { InvitationApiService, ProjectApiService } from '@taiga/api';
import {
  Contact,
  InvitationResponse,
  MembershipMockFactory,
  RegisteredContactMockFactory,
  UserMockFactory,
} from '@taiga/data';
import { cold, hot } from 'jest-marbles';
import { Observable } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import { inviteUsersToProject } from '~/app/modules/feature-new-project/+state/actions/new-project.actions';
import { selectInvitations } from '~/app/modules/project/feature-overview/data-access/+state/selectors/project-overview.selectors';
import { AppService } from '~/app/services/app.service';
import {
  acceptInvitationId,
  acceptInvitationIdError,
  acceptInvitationIdSuccess,
  inviteUsersSuccess,
  revokeInvitation,
  searchUser,
  searchUserSuccess,
} from '../actions/invitation.action';
import { InvitationEffects } from './invitation.effects';

describe('InvitationEffects', () => {
  let actions$: Observable<Action>;
  let spectator: SpectatorService<InvitationEffects>;
  let store: MockStore;

  const createService = createServiceFactory({
    service: InvitationEffects,
    providers: [
      provideMockActions(() => actions$),
      provideMockStore({ initialState: {} }),
    ],
    mocks: [InvitationApiService, AppService, ProjectApiService, Router],
  });

  beforeEach(() => {
    spectator = createService();
    store = spectator.inject(MockStore);
  });

  it('send invitations', () => {
    store.overrideSelector(selectInvitations, []);
    const invitationApiService = spectator.inject(InvitationApiService);
    const effects = spectator.inject(InvitationEffects);

    const invitationMockPayload = [
      { email: 'hola@hola.es', roleSlug: 'general' },
    ];
    const invitationMockResponse: InvitationResponse = {
      invitations: [
        {
          role: { isAdmin: false, name: 'General', slug: 'general' },
          email: 'hola@hola.es',
        },
      ],
      alreadyMembers: 1,
    };

    invitationApiService.inviteUsers.mockReturnValue(
      cold('-b|', { b: invitationMockResponse })
    );

    actions$ = hot('-a', {
      a: inviteUsersToProject({
        id: randUuid(),
        invitation: invitationMockPayload,
      }),
    });

    const expected = cold('--a', {
      a: inviteUsersSuccess({
        newInvitations: invitationMockResponse.invitations,
        alreadyMembers: 1,
        totalInvitations: 1,
      }),
    });

    expect(effects.sendInvitations$).toBeObservable(expected);
  });

  it('Accept invitation id', () => {
    const user = UserMockFactory();
    const slug = randSlug();
    const id = randUuid();
    const username = user.username;
    const acceptInvitationIdMockPayload = [
      {
        user: {
          username: username,
          fullName: randUserName(),
        },
        role: {
          isAdmin: true,
          name: randUserName(),
          slug: slug,
        },
        email: randEmail({ length: 5 }),
      },
    ];
    const effects = spectator.inject(InvitationEffects);
    const projectApiService = spectator.inject(ProjectApiService);
    store.overrideSelector(selectUser, user);
    projectApiService.acceptInvitationId.mockReturnValue(
      cold('-a|', { a: acceptInvitationIdMockPayload })
    );

    actions$ = hot('-a', {
      a: acceptInvitationId({ id }),
    });

    const expected = cold('--a', {
      a: acceptInvitationIdSuccess({ projectId: id, username }),
    });

    expect(effects.acceptInvitationId$).toBeObservable(expected);
  });

  it('Accept invitation id error', () => {
    const id = randUuid();
    const effects = spectator.inject(InvitationEffects);
    const appService = spectator.inject(AppService);
    const projectApiService = spectator.inject(ProjectApiService);
    projectApiService.acceptInvitationId.mockReturnValue(
      cold(
        '-#|',
        {},
        {
          status: 400,
          error: {
            error: {
              detail: 'bad-request',
            },
          },
        }
      )
    );

    actions$ = hot('-a', {
      a: acceptInvitationId({ id }),
    });

    const expected = cold('--a', {
      a: acceptInvitationIdError({ projectId: id }),
    });

    expect(effects.acceptInvitationId$).toBeObservable(expected);

    expect(effects.acceptInvitationId$).toSatisfyOnFlush(() => {
      expect(appService.toastNotification).toHaveBeenCalled();
    });
  });

  it('Accept invitation revoke error', () => {
    const id = randUuid();
    const effects = spectator.inject(InvitationEffects);
    const appService = spectator.inject(AppService);
    const projectApiService = spectator.inject(ProjectApiService);
    projectApiService.acceptInvitationId.mockReturnValue(
      cold(
        '-#|',
        {},
        {
          status: 400,
          error: {
            error: {
              detail: 'invitation-revoked-error',
            },
          },
        }
      )
    );

    actions$ = hot('-a', {
      a: acceptInvitationId({ id }),
    });

    const expected = cold('--a', {
      a: revokeInvitation({ projectId: id }),
    });

    expect(effects.acceptInvitationId$).toBeObservable(expected);

    expect(effects.acceptInvitationId$).toSatisfyOnFlush(() => {
      expect(appService.toastNotification).toHaveBeenCalled();
    });
  });

  it('Search user: no results', () => {
    const user = UserMockFactory();
    store.overrideSelector(selectUser, user);
    const effects = spectator.inject(InvitationEffects);
    const invitationApiService = spectator.inject(InvitationApiService);
    const searchText: string = randWord();
    const suggestedUsers: Contact[] = [];

    const testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });

    testScheduler.run((helpers) => {
      const { expectObservable, cold, hot } = helpers;

      invitationApiService.searchUser.mockReturnValue(
        cold('-b|', { b: suggestedUsers })
      );

      actions$ = hot('-a', {
        a: searchUser({
          searchUser: { text: searchText, project: randSlug() },
          peopleAdded: [],
        }),
      });

      expectObservable(effects.searchUser$).toBe('202ms a', {
        a: searchUserSuccess({ suggestedUsers }),
      });
    });
  });

  it('Search user: results', () => {
    const user = UserMockFactory();
    store.overrideSelector(selectUser, user);
    const effects = spectator.inject(InvitationEffects);
    const invitationApiService = spectator.inject(InvitationApiService);
    const searchText: string = randWord();
    const suggestedUsers: Contact[] = [
      {
        username: `${searchText} ${randWord()}`,
        fullName: randWord(),
        email: randEmail(),
      },
    ];

    const testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });

    testScheduler.run((helpers) => {
      const { expectObservable, cold, hot } = helpers;

      invitationApiService.searchUser.mockReturnValue(
        cold('-b|', { b: suggestedUsers })
      );

      actions$ = hot('-a', {
        a: searchUser({
          searchUser: {
            text: searchText,
            project: randSlug(),
          },
          peopleAdded: [],
        }),
      });

      expectObservable(effects.searchUser$).toBe('202ms a', {
        a: searchUserSuccess({ suggestedUsers }),
      });
    });
  });

  it('Search user: suggested users and member', () => {
    const user = UserMockFactory();
    const member = MembershipMockFactory();
    store.overrideSelector(selectUser, user);
    const effects = spectator.inject(InvitationEffects);
    const invitationApiService = spectator.inject(InvitationApiService);
    const searchText: string = randWord();
    const suggestedUsers: Contact[] = [
      {
        username: member.user.username,
        fullName: member.user.fullName,
        userIsMember: true,
      },
      {
        username: `${searchText} ${randWord()}`,
        fullName: randWord(),
        email: randEmail(),
      },
    ];

    const testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });

    testScheduler.run((helpers) => {
      const { expectObservable, cold, hot } = helpers;

      invitationApiService.searchUser.mockReturnValue(
        cold('-b|', { b: suggestedUsers })
      );

      actions$ = hot('-a', {
        a: searchUser({
          searchUser: {
            text: searchText,
            project: randSlug(),
          },
          peopleAdded: [],
        }),
      });

      expectObservable(effects.searchUser$).toBe('202ms a', {
        a: searchUserSuccess({ suggestedUsers }),
      });
    });
  });

  it('Search user: suggested users, member and already added to list', () => {
    const user = UserMockFactory();
    const member = MembershipMockFactory();
    const addedToList = RegisteredContactMockFactory();
    store.overrideSelector(selectUser, user);
    const effects = spectator.inject(InvitationEffects);
    const invitationApiService = spectator.inject(InvitationApiService);
    const searchText: string = randWord();
    const suggestedUsers: Contact[] = [
      {
        username: `${searchText}1`,
        fullName: member.user.fullName,
        userIsMember: true,
      },
      {
        username: `${searchText}2`,
        fullName: addedToList.fullName,
        userIsAddedToList: true,
      },
      {
        username: `${searchText}3}`,
        fullName: randWord(),
        email: randEmail(),
      },
    ];

    const testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });

    testScheduler.run((helpers) => {
      const { expectObservable, cold, hot } = helpers;

      invitationApiService.searchUser.mockReturnValue(
        cold('-b|', { b: suggestedUsers })
      );

      actions$ = hot('-a', {
        a: searchUser({
          searchUser: {
            text: searchText,
            project: randSlug(),
          },
          peopleAdded: [addedToList],
        }),
      });

      expectObservable(effects.searchUser$).toBe('202ms a', {
        a: searchUserSuccess({ suggestedUsers }),
      });
    });
  });
});
