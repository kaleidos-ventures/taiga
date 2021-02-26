/**
 * Copyright (c) 2014-2021 Taiga Agile LLC
 *
 * This source code is licensed under the terms of the
 * GNU Affero General Public License found in the LICENSE file in
 * the root directory of this source tree.
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Config } from './config.model';
import { EnvironmentService } from '@/app/services/environment.service';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  public get config(): Config {
    return this._config;
  }

  public _config!: Config;

  constructor(private readonly http: HttpClient, private readonly environmentService: EnvironmentService) {}

  public fetch(): Promise<Config> {
    const environment = this.environmentService.getEnvironment();

    return new Promise((resolve, reject) => {
      if (environment.configLocal) {
        this._config = environment.configLocal;
        resolve(this.config);
      } else if (environment.configRemote) {
        this.http.get<Config>(environment.configRemote).subscribe((config) => {
          this._config = config;
          resolve(this.config);
        });
      } else {
        reject('No config provided');
      }
    });
  }

  public get apiUrl(): string {
    return this.config.api;
  }
}
