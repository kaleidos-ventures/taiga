/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { InvitationApiService, ProjectApiService } from '@taiga/api';
import { AppService } from '~/app/services/app.service';
import { Observable } from 'rxjs';
import { randEmail, randSlug, randUserName, randWord } from '@ngneat/falso';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

import { InvitationEffects } from './invitation.effects';
import {
  acceptInvitationSlugSuccess,
  acceptInvitationSlug,
  searchUser,
  searchUserSuccess,
  inviteUsersSuccess,
  acceptInvitationSlugError,
} from '../actions/invitation.action';
import { inviteUsersToProject } from '~/app/modules/feature-new-project/+state/actions/new-project.actions';
import { cold, hot } from 'jest-marbles';
import { Contact, InvitationResponse, UserMockFactory } from '@taiga/data';
import { selectInvitations, selectMembers } from '~/app/modules/project/feature-overview/data-access/+state/selectors/project-overview.selectors';
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import { TestScheduler } from 'rxjs/testing';

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
    mocks: [InvitationApiService, AppService, ProjectApiService],
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
        slug: randSlug(),
        invitation: invitationMockPayload,
      }),
    });

    const expected = cold('--a', {
      a: inviteUsersSuccess({
        newInvitations: invitationMockResponse.invitations,
        allInvitationsOrdered: invitationMockResponse.invitations,
        alreadyMembers: 1,
      }),
    });

    expect(effects.sendInvitations$).toBeObservable(expected);
  });

  it('Accept invitation slug', () => {
    const user = UserMockFactory();
    const slug = randSlug();
    const username = user.username;
    const acceptInvitationSlugMockPayload = [
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
    projectApiService.acceptInvitationSlug.mockReturnValue(
      cold('-a|', { a: acceptInvitationSlugMockPayload })
    );

    actions$ = hot('-a', {
      a: acceptInvitationSlug({ slug }),
    });

    const expected = cold('--a', {
      a: acceptInvitationSlugSuccess({ projectSlug: slug, username }),
    });

    expect(effects.acceptInvitationSlug$).toBeObservable(expected);
  });

  it('Accept invitation slug error', () => {
    const slug = randSlug();
    const effects = spectator.inject(InvitationEffects);
    const appService = spectator.inject(AppService);
    const projectApiService = spectator.inject(ProjectApiService);
    projectApiService.acceptInvitationSlug.mockReturnValue(
      cold(
        '-#|',
        {},
        {
          status: 400,
        }
      )
    );

    actions$ = hot('-a', {
      a: acceptInvitationSlug({ slug }),
    });

    const expected = cold('--a', {
      a: acceptInvitationSlugError({ projectSlug: slug }),
    });

    expect(effects.acceptInvitationSlug$).toBeObservable(expected);

    expect(effects.acceptInvitationSlug$).toSatisfyOnFlush(() => {
      expect(appService.toastNotification).toHaveBeenCalled();
    });
  });

  it('Search user: no results', () => {
    const user = UserMockFactory();
    store.overrideSelector(selectMembers, []);
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
        a: searchUser({ searchUser: { text: searchText } }),
      });

      expectObservable(effects.searchUser$).toBe('202ms a', {
        a: searchUserSuccess({ suggestedUsers }),
      });
    });
  });

  it('Search user: results', () => {
    const user = UserMockFactory();
    store.overrideSelector(selectMembers, []);
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
          },
        }),
      });

      expectObservable(effects.searchUser$).toBe('202ms a', {
        a: searchUserSuccess({ suggestedUsers }),
      });
    });
  });
});
