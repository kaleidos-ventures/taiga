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
import { InvitationApiService } from '@taiga/api';
import { AppService } from '~/app/services/app.service';
import { Observable } from 'rxjs';
import { randEmail, randSlug } from '@ngneat/falso';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

import { InvitationEffects } from './invitation.effects';
import {
  fetchMyContacts,
  fetchMyContactsSuccess,
  inviteUsersSuccess,
} from '../actions/invitation.action';
import { inviteUsersNewProject } from '~/app/modules/feature-new-project/+state/actions/new-project.actions';
import { cold, hot } from 'jest-marbles';
import { Contact, Invitation } from '@taiga/data';
import { selectInvitations } from '~/app/modules/project/feature-overview/data-access/+state/selectors/project-overview.selectors';

describe('InvitationEffects', () => {
  let actions$: Observable<Action>;
  let spectator: SpectatorService<InvitationEffects>;
  let store: MockStore;

  const createService = createServiceFactory({
    service: InvitationEffects,
    providers: [provideMockActions(() => actions$), provideMockStore({ initialState: {} }),],
    mocks: [InvitationApiService, AppService],
  });

  beforeEach(() => {
    spectator = createService();
    store = spectator.inject(MockStore);
  });

  it('get contacts from user to invite: no match with my contacts', () => {
    const emails = randEmail({ length: 10 });
    const contacts: Contact[] = [];
    const invitationApiService = spectator.inject(InvitationApiService);
    const effects = spectator.inject(InvitationEffects);

    invitationApiService.myContacts.mockReturnValue(
      cold('-b|', { b: contacts })
    );

    actions$ = hot('-a', { a: fetchMyContacts({ emails }) });

    const expected = cold('--a', {
      a: fetchMyContactsSuccess({ contacts }),
    });

    expect(effects.myContacts$).toBeObservable(expected);
  });

  it('get contacts from user to invite: match with my contacts', () => {
    const emails = randEmail({ length: 5 });
    const contacts: Contact[] = [
      { email: 'user1001@taiga.demo', username: '', fullName: '' },
    ];
    const invitationApiService = spectator.inject(InvitationApiService);
    const effects = spectator.inject(InvitationEffects);

    invitationApiService.myContacts.mockReturnValue(
      cold('-b|', { b: contacts })
    );

    actions$ = hot('-a', {
      a: fetchMyContacts({ emails: [...emails, 'user1001@taiga.demo'] }),
    });

    const expected = cold('--a', {
      a: fetchMyContactsSuccess({ contacts }),
    });

    expect(effects.myContacts$).toBeObservable(expected);
  });

  it('send invitations', () => {
    store.overrideSelector(selectInvitations, []);
    const invitationApiService = spectator.inject(InvitationApiService);
    const effects = spectator.inject(InvitationEffects);

    const invitationMockPayload = [
      { email: 'hola@hola.es', roleSlug: 'general' },
    ];
    const invitationMockResponse: Invitation[] = [
      {
        role: { isAdmin: false, name: 'General', slug: 'general' },
        email: 'hola@hola.es',
      },
    ];

    invitationApiService.inviteUsers.mockReturnValue(
      cold('-b|', { b: invitationMockResponse })
    );

    actions$ = hot('-a', {
      a: inviteUsersNewProject({
        slug: randSlug(),
        invitation: invitationMockPayload,
      }),
    });

    const expected = cold('--a', {
      a: inviteUsersSuccess({ newInvitations: invitationMockResponse, allInvitationsOrdered: invitationMockResponse }),
    });

    expect(effects.sendInvitations$).toBeObservable(expected);
  });
});
