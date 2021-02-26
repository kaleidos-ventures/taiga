/**
 * Copyright (c) 2014-2022 Taiga Agile LLC
 *
 * This source code is licensed under the terms of the
 * GNU Affero General Public License found in the LICENSE file in
 * the root directory of this source tree.
 */

import { createHttpFactory, HttpMethod, SpectatorHttp } from '@ngneat/spectator';
import { EnvironmentService } from '@/app/services/environment.service';
import { Config } from './config.model';
import { ConfigService } from './config.service';

describe('ConfigService', () => {
  const fakeConfig: Config = {
    api: 'http://fake',
  };

  let spectator: SpectatorHttp<ConfigService>;
  let configService: ConfigService;

  const createHttp = createHttpFactory({
    service: ConfigService,
    mocks: [ EnvironmentService ],
  });

  beforeEach(() => {
    spectator = createHttp();
    configService = spectator.service;
  });

  it('fetch local config', () => {
    const mockedEnviorement = spectator.inject(EnvironmentService);

    mockedEnviorement.getEnvironment.and.returnValue({
      configLocal: fakeConfig,
    });

    void configService.fetch();

    expect(configService.config).toEqual(fakeConfig);
  });

  it('fetch remote config', () => {
    const configRemote = 'http://fake-config-location';
    const mockedEnviorement = spectator.inject(EnvironmentService);

    mockedEnviorement.getEnvironment.and.returnValue({
      configRemote,
    });

    void configService.fetch();

    const req = spectator.expectOne(configRemote, HttpMethod.GET);
    req.flush(fakeConfig);

    expect(configService.config).toEqual(fakeConfig);
  });
});
