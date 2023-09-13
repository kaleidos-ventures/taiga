/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigService } from '@taiga/cdk/services/config';
import { Language } from '@taiga/data';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SystemApiService {
  constructor(private http: HttpClient, private config: ConfigService) {}

  public getLanguages() {
    return this.http
      .get<Language[]>(`${this.config.apiUrl}/system/languages`)
      .pipe(
        map((languages) => {
          return languages.map((language) => {
            if (language.code.includes('es')) {
              return { ...language, isDefault: true };
            }

            return { ...language, isDefault: false };
          });
        })
      );
  }
}
