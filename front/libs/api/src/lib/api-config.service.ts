/**
 * Copyright (c) 2014-2021 Taiga Agile LLC
 *
 * This source code is licensed under the terms of the
 * GNU Affero General Public License found in the LICENSE file in
 * the root directory of this source tree.
 */

import { Injectable } from '@angular/core';
import { Config } from '@taiga/data';

@Injectable({
  providedIn: 'root',
})
export class ApiConfigService {
  private config!: Config;

  public get apiUrl() {
    return this.config.api;
  }

  public setConfig(config: Config) {
    this.config = config;
  }
}
