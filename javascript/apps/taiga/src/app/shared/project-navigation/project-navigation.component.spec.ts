/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { ProjectNavigationComponent } from './project-navigation.component';

// The selector to mock
import { selectUser } from './state/user.selectors';

describe('ProjectNavigationComponent', () => {
  let spectator: Spectator<ProjectNavigationComponent>;
  let store: MockStore;
  const createComponent = createComponentFactory(ProjectNavigationComponent);

  // fake state
  const initialState = { loggedIn: false };

  beforeEach(() => {
    spectator = createComponent({
      // The component inputs
      props: {
        name: 'example'
      },
      // Override the component's providers
      providers: [
        provideMockStore({ initialState }),
      ],
      // Whether to run change detection (defaults to true)
      detectChanges: false
    });

    store = spectator.inject(MockStore);
  });

  it('example', () => {
    // change ngrx state
    store.setState({ loggedIn: true });

    // mock selector
    store.overrideSelector(selectUser, {
      id: 1,
      name: 'test',
    });

    // trigger emission from all selectors
    store.refreshState();
    spectator.detectChanges();

    // This test checks that the input attribute name becomes a class in the component structure
    expect(spectator.query('div')).toHaveClass('example');
  });
});
