/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Injectable } from '@angular/core';
import { Config } from '@taiga/data';
import { v4 } from 'uuid';
import { ConfigValidator } from './config.validator';

export const CORRELATION_ID = v4();

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  public readonly correlationId = CORRELATION_ID;
  #config!: Config;

  public setConfig(config: Config) {
    const conf = ConfigValidator.parse(config);

    this.#config = conf;
  }

  public get config(): Config {
    return this.#config;
  }

  public get apiUrl(): string {
    return this.config.api;
  }

  public get wsUrl(): string {
    return this.config.ws;
  }

  public get supportEmail(): string {
    return this.config.supportEmail;
  }

  public get social() {
    return this.config.social;
  }

  public get accessTokenLifetime() {
    // 1000ms * 60s -> 1min, as back sets the lifetime per minute
    return 1000 * 60 * this.config.accessTokenLifetime;
  }

  public get globalBanner() {
    return this.config.globalBanner;
  }
}
