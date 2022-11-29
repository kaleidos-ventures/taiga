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
import { Project, Workspace, WorkspaceCreation } from '@taiga/data';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class WorkspaceApiService {
  constructor(private http: HttpClient, private config: ConfigService) {}

  public fetchWorkspaceList() {
    return this.http.get<Workspace[]>(`${this.config.apiUrl}/my/workspaces`);
  }

  public fetchWorkspace(id: Workspace['id']) {
    return this.http.get<Workspace>(
      `${this.config.apiUrl}/my/workspaces/${id}`
    );
  }

  public fetchWorkspaceDetail(id: Workspace['id']) {
    return this.http.get<Workspace>(`${this.config.apiUrl}/workspaces/${id}`);
  }

  public createWorkspace(workspaceCreation: WorkspaceCreation) {
    return this.http
      .post<Workspace>(`${this.config.apiUrl}/workspaces`, workspaceCreation)
      .pipe(
        map((workspace: Workspace) => {
          return {
            ...workspace,
            invitedProjects: [],
            latestProjects: [],
          };
        })
      );
  }

  public fetchWorkspaceProjects(id: Workspace['id']) {
    return this.http.get<Project[]>(
      `${this.config.apiUrl}/workspaces/${id}/projects`
    );
  }

  public fetchWorkspaceInvitedProjects(id: Workspace['id']) {
    return this.http.get<Project[]>(
      `${this.config.apiUrl}/workspaces/${id}/invited-projects`
    );
  }
}
