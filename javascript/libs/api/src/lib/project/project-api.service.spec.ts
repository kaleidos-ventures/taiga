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
import { randDomainSuffix } from '@ngneat/falso';
import { ProjectApiService } from './project-api.service';

describe('ProjectApiService', () => {
  let spectator: SpectatorHttp<ProjectApiService>;
  const createHttp = createHttpFactory({
    service: ProjectApiService,
    providers: [
      { provide: ConfigService, useValue: ConfigServiceMock },
      provideMockStore(),
    ],
  });

  beforeEach(() => spectator = createHttp());

  it('getProject', () => {
    const slug = randDomainSuffix({ length: 3 }).join('-');
    const url = `${ConfigServiceMock.apiUrl}/projects/${slug}`;

    spectator.service.getProject(slug).subscribe();

    const req = spectator.expectOne(url, HttpMethod.GET);
    expect(req.request.url).toEqual(url);
  });
});
