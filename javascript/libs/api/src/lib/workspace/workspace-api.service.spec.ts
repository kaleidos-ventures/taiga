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

import { randDomainSuffix } from '@ngneat/falso';

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

    spectator.service.fetchWorkspaceList().subscribe();

    const req = spectator.expectOne(base, HttpMethod.GET);
    expect(req.request.url).toEqual(base);
  });

  it('get Workspace', () => {
    const slug = randDomainSuffix({ length: 3 }).join('-');
    const url = `${ConfigServiceMock.apiUrl}/workspaces/${slug}`;

    spectator.service.fetchWorkspace(slug).subscribe();

    const req = spectator.expectOne(url, HttpMethod.GET);
    expect(req.request.url).toEqual(url);
  });
});
