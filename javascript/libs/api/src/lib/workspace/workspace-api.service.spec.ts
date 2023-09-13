/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { randUuid } from '@ngneat/falso';
import {
  createHttpFactory,
  HttpMethod,
  SpectatorHttp,
} from '@ngneat/spectator';
import { provideMockStore } from '@ngrx/store/testing';
import { ConfigService } from '@taiga/cdk/services/config';
import { ConfigServiceMock } from '@taiga/cdk/services/config/config.service.mock';
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

  beforeEach(() => (spectator = createHttp()));

  it('list Workspaces', () => {
    const base = `${ConfigServiceMock.apiUrl}/my/workspaces`;
    spectator.service.fetchWorkspaceList().subscribe();
    const req = spectator.expectOne(base, HttpMethod.GET);
    expect(req.request.url).toEqual(base);
  });

  it('get Workspace', () => {
    const id = randUuid();
    const url = `${ConfigServiceMock.apiUrl}/my/workspaces/${id}`;
    spectator.service.fetchWorkspace(id).subscribe();
    const req = spectator.expectOne(url, HttpMethod.GET);
    expect(req.request.url).toEqual(url);
  });

  it('get Workspace detail', () => {
    const id = randUuid();
    const url = `${ConfigServiceMock.apiUrl}/workspaces/${id}`;
    spectator.service.fetchWorkspaceDetail(id).subscribe();
    const req = spectator.expectOne(url, HttpMethod.GET);
    expect(req.request.url).toEqual(url);
  });
});
