/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigService } from '@taiga/core';
import { Language } from '@taiga/data';

@Injectable({
  providedIn: 'root',
})
export class SystemApiService {
  constructor(private http: HttpClient, private config: ConfigService) {}

  public getLanguages() {
    return this.http.get<Language[]>(`${this.config.apiUrl}/system/languages`);
  }
}
