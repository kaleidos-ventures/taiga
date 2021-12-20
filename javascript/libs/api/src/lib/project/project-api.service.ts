/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiUtilsService } from '@taiga/api';
import { ConfigService } from '@taiga/core';

import { Project, ProjectCreation, Role } from '@taiga/data';

@Injectable({
  providedIn: 'root'
})
export class ProjectApiService {
  constructor(
    private http: HttpClient,
    private config: ConfigService
  ) { }

  public listProjects() {
    return this.http.get<Project[]>(`${this.config.apiUrl}/projects`);
  }

  public getProject(slug: Project['slug']) {
    return this.http.get<Project>(`${this.config.apiUrl}/projects/${slug}`);
  }

  public createProject(project: ProjectCreation) {
    const form = {
      workspaceSlug:  project.workspaceSlug,
      name: project.name,
      color: project.color,
      logo: project.logo,
      description: project.description,
    };
    const formData = ApiUtilsService.buildFormData(form);
    return this.http.post<Project>(`${this.config.apiUrl}/projects`, formData);
  }

  public getRoles(slug: Project['slug']) {
    return this.http.get<Role[]>(`${this.config.apiUrl}/projects/${slug}/roles`);
  }
}
