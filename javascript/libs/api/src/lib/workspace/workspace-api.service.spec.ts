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
    const url = `${ConfigServiceMock.apiUrl}/workspaces`;

    spectator.service.listWokspaces().subscribe();

    const req = spectator.expectOne(url, HttpMethod.GET);
    expect(req.request.url).toEqual(url);
  });
  
  it('get Workspace', () => {
    const id = 1;
    const url = `${ConfigServiceMock.apiUrl}/workspaces/${id}`;

    spectator.service.fetchWorkspace(id).subscribe();

    const req = spectator.expectOne(url, HttpMethod.GET);
    expect(req.request.url).toEqual(url);
  });
});
