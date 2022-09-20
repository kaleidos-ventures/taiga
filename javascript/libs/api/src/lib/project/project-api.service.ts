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
import {
  Contact,
  Invitation,
  Membership,
  Project,
  ProjectCreation,
  Role,
  Workflow,
  Story,
} from '@taiga/data';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface MembersResponse {
  totalMemberships: number;
  memberships: Membership[];
}

export interface InvitationsResponse {
  totalInvitations: number;

  invitations: Invitation[];
}

@Injectable({
  providedIn: 'root',
})
export class ProjectApiService {
  constructor(private http: HttpClient, private config: ConfigService) {}

  public listProjects() {
    return this.http.get<Project[]>(`${this.config.apiUrl}/projects`);
  }

  public getProject(slug: Project['slug']) {
    return this.http.get<Project>(`${this.config.apiUrl}/projects/${slug}`);
  }

  public createProject(project: ProjectCreation) {
    const form = {
      workspaceSlug: project.workspaceSlug,
      name: project.name,
      color: project.color,
      logo: project.logo,
      description: project.description,
    };
    const formData = ApiUtilsService.buildFormData(form);
    return this.http.post<Project>(`${this.config.apiUrl}/projects`, formData);
  }

  public getMemberRoles(slug: Project['slug']) {
    return this.http.get<Role[]>(
      `${this.config.apiUrl}/projects/${slug}/roles`
    );
  }

  public getPermissions(slug: Project['slug']) {
    return this.getProject(slug).pipe(
      map((project: Project) => {
        return project.userPermissions;
      }),
      catchError(() => {
        return [];
      })
    );
  }

  public getPublicPermissions(slug: Project['slug']) {
    return this.http.get<string[]>(
      `${this.config.apiUrl}/projects/${slug}/public-permissions`
    );
  }

  public getworkspacePermissions(slug: Project['slug']) {
    return this.http.get<string[]>(
      `${this.config.apiUrl}/projects/${slug}/workspace-member-permissions`
    );
  }

  public myContacts(emails: string[]) {
    return this.http.post<Contact[]>(`${this.config.apiUrl}/my/contacts`, {
      emails,
    });
  }

  public putMemberRoles(
    slug: Project['slug'],
    roleSlug: Role['slug'],
    permissions: string[]
  ) {
    // only permission currently supported by back
    // python/apps/taiga/src/taiga/permissions/choices.py
    permissions = permissions.filter((permission) => {
      const validPermission = [
        'add_member',
        'delete_story',
        'delete_task',
        'modify_task',
        'view_task',
        'modify_story',
        'comment_story',
        'view_story',
        'add_task',
        'add_story',
        'comment_task',
        'delete_project',
        'modify_project',
      ];

      return validPermission.includes(permission);
    });

    return this.http.put<Role>(
      `${this.config.apiUrl}/projects/${slug}/roles/${roleSlug}/permissions`,
      {
        permissions,
      }
    );
  }

  public putPublicPermissions(slug: Project['slug'], permissions: string[]) {
    permissions = permissions.filter((permission) => {
      const validPermission = [
        'add_member',
        'delete_story',
        'delete_task',
        'modify_task',
        'view_task',
        'modify_story',
        'comment_story',
        'view_story',
        'add_task',
        'add_story',
        'comment_task',
        'delete_project',
        'modify_project',
      ];

      return validPermission.includes(permission);
    });
    return this.http.put<string[]>(
      `${this.config.apiUrl}/projects/${slug}/public-permissions`,
      {
        permissions,
      }
    );
  }

  public putworkspacePermissions(slug: Project['slug'], permissions: string[]) {
    permissions = permissions.filter((permission) => {
      const validPermission = [
        'add_member',
        'delete_story',
        'delete_task',
        'modify_task',
        'view_task',
        'modify_story',
        'comment_story',
        'view_story',
        'add_task',
        'add_story',
        'comment_task',
        'delete_project',
        'modify_project',
      ];

      return validPermission.includes(permission);
    });
    return this.http.put<string[]>(
      `${this.config.apiUrl}/projects/${slug}/workspace-member-permissions`,
      {
        permissions,
      }
    );
  }

  public getMembers(
    slug: string,
    offset = 0,
    limit = 10
  ): Observable<MembersResponse> {
    return this.http
      .get<Membership[]>(`${this.config.apiUrl}/projects/${slug}/memberships`, {
        observe: 'response',
        params: {
          offset,
          limit,
        },
      })
      .pipe(
        map((response) => {
          return {
            totalMemberships: Number(response.headers.get('pagination-total')),
            memberships: response.body ?? [],
          };
        })
      );
  }

  public getInvitations(
    slug: string,
    offset = 0,
    limit = 10
  ): Observable<InvitationsResponse> {
    return this.http
      .get<Invitation[]>(`${this.config.apiUrl}/projects/${slug}/invitations`, {
        observe: 'response',
        params: {
          offset,
          limit,
        },
      })
      .pipe(
        map((response) => {
          return {
            totalInvitations: Number(response.headers.get('pagination-total')),
            invitations: response.body ?? [],
          };
        })
      );
  }

  public acceptInvitationToken(token: string) {
    return this.http.post<Invitation[]>(
      `${this.config.apiUrl}/projects/invitations/${token}/accept`,
      {}
    );
  }

  public acceptInvitationSlug(slug: string) {
    return this.http.post(
      `${this.config.apiUrl}/projects/${slug}/invitations/accept`,
      {}
    );
  }

  public revokeInvitation(project: string, usernameOrEmail: string) {
    return this.http.post(
      `${this.config.apiUrl}/projects/${project}/invitations/revoke`,
      {
        usernameOrEmail,
      }
    );
  }

  public updateMemberRole(
    slug: string,
    userData: { username: string; roleSlug: string }
  ) {
    return this.http.patch(
      `${this.config.apiUrl}/projects/${slug}/memberships/${userData.username}`,
      {
        roleSlug: userData.roleSlug,
      }
    );
  }

  public getWorkflows(slug: string): Observable<Workflow[]> {
    return this.http.get<Workflow[]>(
      `${this.config.apiUrl}/projects/${slug}/workflows`
    );
  }

  public updateInvitationRole(
    slug: string,
    userData: { id: string; roleSlug: string }
  ) {
    return this.http.patch(
      `${this.config.apiUrl}/projects/${slug}/invitations/${userData.id}`,
      {
        roleSlug: userData.roleSlug,
      }
    );
  }

  public getAllStories(
    project: Project['slug'],
    workflow: Workflow['slug']
  ): Observable<{ stories: Story[]; offset: number }> {
    return new Observable((subscriber) => {
      const limit = 50;
      let offset = 0;

      const nextPage = () => {
        this.getStories(project, workflow, offset, limit).subscribe(
          (stories) => {
            offset += stories.length;

            subscriber.next({ stories, offset });

            if (stories.length < limit) {
              subscriber.complete();
            } else {
              nextPage();
            }
          }
        );
      };

      nextPage();
    });
  }

  public getStories(
    project: Project['slug'],
    workflow: Workflow['slug'],
    offset: number,
    limit: number
  ): Observable<Story[]> {
    return this.http.get<Story[]>(
      `${this.config.apiUrl}/projects/${project}/workflows/${workflow}/stories`,
      {
        params: {
          offset,
          limit,
        },
      }
    );
  }

  public createStory(
    story: Pick<Story, 'name' | 'status'>,
    project: Project['slug'],
    workflow: Workflow['slug']
  ): Observable<Story> {
    return this.http.post<Story>(
      `${this.config.apiUrl}/projects/${project}/workflows/${workflow}/stories`,
      {
        name: story.name,
        status: story.status.slug,
      }
    );
  }
}
