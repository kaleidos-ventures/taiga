/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { randNumber } from '@ngneat/falso';
import { ApiUtilsService } from '@taiga/api';
import { ConfigService } from '@taiga/core';

import {
  Contact,
  Project,
  ProjectCreation,
  Role,
  MembershipMockFactory,
  InvitationMockFactory,
} from '@taiga/data';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';

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
        'delete_us',
        'delete_task',
        'modify_task',
        'view_tasks',
        'modify_us',
        'comment_us',
        'view_us',
        'add_task',
        'add_us',
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
        'delete_us',
        'delete_task',
        'modify_task',
        'view_tasks',
        'modify_us',
        'comment_us',
        'view_us',
        'add_task',
        'add_us',
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
        'delete_us',
        'delete_task',
        'modify_task',
        'view_tasks',
        'modify_us',
        'comment_us',
        'view_us',
        'add_task',
        'add_us',
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

  public getMembers() {
    const users = [];

    for (let i = 0; i < randNumber({ min: 1, max: 30 }); i++) {
      users.push(MembershipMockFactory());
    }

    return of(users).pipe(delay(1000));
  }

  public getInvitations() {
    const users = [];

    for (let i = 0; i < randNumber({ min: 0, max: 4 }); i++) {
      users.push(InvitationMockFactory());
    }

    return of(users).pipe(delay(1000));
  }
}
