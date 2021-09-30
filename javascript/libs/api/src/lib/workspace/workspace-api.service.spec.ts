/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createHttpFactory, HttpMethod, SpectatorHttp } from '@ngneat/spectator';
import { provideMockStore } from '@ngrx/store/testing';
import { ConfigService, ConfigServiceMock } from '@taiga/core';
import { WorkspaceApiService } from './workspace-api.service';

import * as faker from 'faker';

describe('WorkspaceApiService', () => {
  let spectator: SpectatorHttp<WorkspaceApiService>;
  const createHttp = createHttpFactory({
    service: WorkspaceApiService,
    providers: [
      { provide: ConfigService, useValue: ConfigServiceMock },
      provideMockStore(),
    ],
  });

  beforeEach(() => spectator = createHttp());

  it('list Workspaces', () => {
    const base = `${ConfigServiceMock.apiUrl}/workspaces`;
    const id = faker.datatype.number();
    const url = `${base}?owner_id=${id}`;

    spectator.service.fetchWorkspaceList(id).subscribe();

    const req = spectator.expectOne(url, HttpMethod.GET);
    expect(req.request.url).toEqual(base);
    expect(req.request.params.get('owner_id')).toEqual(id.toString());
  });
  
  it('get Workspace', () => {
    const id = faker.datatype.number();
    const url = `${ConfigServiceMock.apiUrl}/workspaces/${id}`;

    spectator.service.fetchWorkspace(id).subscribe();

    const req = spectator.expectOne(url, HttpMethod.GET);
    expect(req.request.url).toEqual(url);
  });
});
