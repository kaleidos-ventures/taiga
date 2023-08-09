/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigService } from '@taiga/core';
import {
  Project,
  Workspace,
  WorkspaceCreation,
  WorkspaceMembership,
  InvitationWorkspaceMember,
  InvitationWorkspaceInfo,
} from '@taiga/data';
import { Observable } from 'rxjs';
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

  public updateWorkspace(id: Workspace['id'], workspace: Partial<Workspace>) {
    return this.http.patch(`${this.config.apiUrl}/workspaces/${id}`, workspace);
  }

  public deleteWorkspace(id: Workspace['id']) {
    return this.http.delete<Workspace>(
      `${this.config.apiUrl}/workspaces/${id}`
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

  public getWorkspaceMembers(
    id: Workspace['id']
  ): Observable<{ totalMembers: number; members: WorkspaceMembership[] }> {
    return this.http
      .get<WorkspaceMembership[]>(
        `${this.config.apiUrl}/workspaces/${id}/memberships`
      )
      .pipe(
        map((response) => {
          return {
            totalMembers: response.length,
            members: response,
          };
        })
      );
  }

  public removeWorkspaceMember(
    id: Workspace['id'],
    member: WorkspaceMembership['user']['username']
  ) {
    return this.http.delete<Workspace>(
      `${this.config.apiUrl}/workspaces/${id}/memberships/${member}`
    );
  }

  public getWorkspaceNonMembers(
    id: Workspace['id'],
    offset = 0,
    limit = 10
  ): Observable<{ totalMembers: number; members: WorkspaceMembership[] }> {
    return this.http
      .get<WorkspaceMembership[]>(
        `${this.config.apiUrl}/workspaces/${id}/guests`,
        {
          observe: 'response',
          params: {
            offset,
            limit,
          },
        }
      )
      .pipe(
        map((response) => {
          return {
            totalMembers: Number(response.headers.get('pagination-total')),
            members: response.body ?? [],
          };
        })
      );
  }

  public getWorkspaceInvitationMembers(id: Workspace['id']): Observable<{
    totalMembers: number;
    members: InvitationWorkspaceMember[];
  }> {
    return this.http
      .get<InvitationWorkspaceMember[]>(
        `${this.config.apiUrl}/workspaces/${id}/invitations`
      )
      .pipe(
        map((response) => {
          return {
            totalMembers: response.length,
            members: response,
          };
        })
      );
  }

  public acceptInvitationToken(token: string) {
    return this.http.post<InvitationWorkspaceInfo>(
      `${this.config.apiUrl}/workspaces/invitations/${token}/accept`,
      {}
    );
  }
}
