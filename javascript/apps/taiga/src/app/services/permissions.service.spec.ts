/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { FormControl, FormGroup } from '@angular/forms';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { ProjectMockFactory } from '@taiga/data';
import { PermissionsService } from './permissions.service';

describe('PermissionsService', () => {
  let spectator: SpectatorService<PermissionsService>;
  let store: MockStore;
  const initialState = {};

  const createService = createServiceFactory({
    service: PermissionsService,
    providers: [provideMockStore({ initialState })],
  });

  beforeEach(() => {
    spectator = createService();
    store = spectator.inject(MockStore);
  });

  it('format raw permissions to valid formGroup value', () => {
    const formGroup = new FormGroup({
      us: new FormGroup({
        create: new FormControl(false),
        modify: new FormControl(false),
        delete: new FormControl(false),
        comment: new FormControl(false),
      }),
    });

    const value = spectator.service.formatRawPermissions([
      'view_us',
      'add_us',
      'modify_us',
      'delete_us',
      'comment_us',
    ]);

    formGroup.patchValue(value);

    expect(formGroup.value).toEqual({
      us: {
        create: true,
        modify: true,
        delete: true,
        comment: true,
      },
    });
  });

  it('hasPermissions', () => {
    const project = ProjectMockFactory();

    project.myPermissions = [
      'view_us',
      'modify_us',
      'view_issues',
      'modify_issue',
    ];
    project.amIAdmin = false;

    store.setState({
      project: {
        currentProjectSlug: project.slug,
        projects: {
          [project.slug]: project,
        },
      },
    });

    expect(spectator.service.hasPermissions('us', 'view')).toEqual(true);
    expect(spectator.service.hasPermissions('us', 'delete')).toEqual(false);
    expect(spectator.service.hasPermissions('sprint', 'view')).toEqual(false);

    expect(
      spectator.service.hasPermissions(['us', 'issue'], ['view', 'modify'])
    ).toEqual(true);
    expect(
      spectator.service.hasPermissions(
        ['us', 'issue'],
        ['view', 'modify', 'delete']
      )
    ).toEqual(false);
    expect(
      spectator.service.hasPermissions(
        ['us', 'issue', 'sprint'],
        ['view', 'modify']
      )
    ).toEqual(false);

    expect(
      spectator.service.hasPermissions(
        ['us', 'issue', 'sprint'],
        ['view', 'modify'],
        'OR'
      )
    ).toEqual(true);
  });
});
