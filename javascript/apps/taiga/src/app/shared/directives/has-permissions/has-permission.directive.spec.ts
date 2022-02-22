/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import {
  createDirectiveFactory,
  SpectatorDirective,
} from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { ProjectMockFactory } from '@taiga/data';
import { HasPermissionDirective } from './has-permission.directive';

describe.skip('HasPermissionDirective', () => {
  let spectator: SpectatorDirective<HasPermissionDirective>;

  const initialState = { project: ProjectMockFactory() };
  let store: MockStore;

  const createDirective = createDirectiveFactory({
    directive: HasPermissionDirective,
    mocks: [],
    providers: [provideMockStore({ initialState })],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createDirective(
      `<div *hasPermission="
        ['view', 'edit'];
        entity: 'us';
        operation: 'OR'">
        Visible
      </div>`
    );
    store = spectator.inject(MockStore);
    store.select = jest.fn();
  });

  it('should be invisible', () => {
    expect(spectator.element).toBeVisible();
  });

  it('should be invisible', () => {
    expect(spectator.element.innerHTML).not.toBeVisible();
  });
});
