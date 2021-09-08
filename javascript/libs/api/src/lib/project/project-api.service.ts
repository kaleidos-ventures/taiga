/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { HttpClient } from '@angular/common/http';
import { ConfigService } from '@taiga/core';

import { Project } from '@taiga/data';


export class ProjectApiService {
  constructor(
    private http: HttpClient,
    private config: ConfigService
  ) { }

  public listProjects() {
    return this.http.get<Project[]>(`${this.config.apiUrl}/projects`);
  }

  public getProject(id: Project['id']) {
    return this.http.get<Project>(`${this.config.apiUrl}/projects/${id}`);
  }
}
