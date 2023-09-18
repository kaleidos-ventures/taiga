/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { HttpClient, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiUtilsService } from '@taiga/api';
import { ConfigService } from '@taiga/cdk/services/config';
import {
  Attachment,
  Contact,
  EditProject,
  Invitation,
  MediaFile,
  Membership,
  Project,
  ProjectCreation,
  Role,
  Status,
  Story,
  StoryDetail,
  StoryUpdate,
  User,
  UserComment,
  Workflow,
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

  public getProject(id: Project['id']) {
    return this.http.get<Project>(`${this.config.apiUrl}/projects/${id}`);
  }

  public createProject(project: ProjectCreation) {
    const form = {
      workspaceId: project.workspaceId,
      name: project.name,
      color: project.color,
      logo: project.logo,
      description: project.description,
    };

    const formData = ApiUtilsService.buildFormData(form);
    return this.http.post<Project>(`${this.config.apiUrl}/projects`, formData);
  }

  public editProject(project: EditProject) {
    const data = {
      name: project.name,
      description: project.description,
      logo: project.logo,
    };

    if (data.logo === undefined) {
      delete data.logo;
    }

    const formData = ApiUtilsService.buildFormData(data);

    return this.http.patch<Project>(
      `${this.config.apiUrl}/projects/${project.id}`,
      formData
    );
  }

  public deleteProject(id: Project['id']) {
    return this.http.delete<Project>(`${this.config.apiUrl}/projects/${id}`);
  }

  public getMemberRoles(id: Project['id']) {
    return this.http.get<Role[]>(`${this.config.apiUrl}/projects/${id}/roles`);
  }

  public getPermissions(id: Project['id']) {
    return this.getProject(id).pipe(
      map((project: Project) => {
        return project.userPermissions;
      }),
      catchError(() => {
        return [];
      })
    );
  }

  public getPublicPermissions(id: Project['id']) {
    return this.http.get<string[]>(
      `${this.config.apiUrl}/projects/${id}/public-permissions`
    );
  }

  public myContacts(emails: string[]) {
    return this.http.post<Contact[]>(`${this.config.apiUrl}/my/contacts`, {
      emails,
    });
  }

  public putMemberRoles(
    id: Project['id'],
    roleSlug: Role['slug'],
    permissions: string[]
  ) {
    permissions = permissions.filter((permission) => {
      const validPermission = [
        'add_member',
        'delete_story',
        'modify_story',
        'comment_story',
        'view_story',
        'add_story',
        'delete_project',
        'modify_project',
      ];

      return validPermission.includes(permission);
    });

    return this.http.put<Role>(
      `${this.config.apiUrl}/projects/${id}/roles/${roleSlug}/permissions`,
      {
        permissions,
      }
    );
  }

  public putPublicPermissions(id: Project['id'], permissions: string[]) {
    permissions = permissions.filter((permission) => {
      const validPermission = [
        'add_member',
        'delete_story',
        'modify_story',
        'comment_story',
        'view_story',
        'add_story',
        'delete_project',
        'modify_project',
      ];

      return validPermission.includes(permission);
    });
    return this.http.put<string[]>(
      `${this.config.apiUrl}/projects/${id}/public-permissions`,
      {
        permissions,
      }
    );
  }

  public getMembers(id: string): Observable<MembersResponse> {
    return this.http
      .get<Membership[]>(`${this.config.apiUrl}/projects/${id}/memberships`)
      .pipe(
        map((response) => {
          return {
            totalMemberships: response.length,
            memberships: response,
          };
        })
      );
  }

  public getInvitations(id: string): Observable<InvitationsResponse> {
    return this.http
      .get<Invitation[]>(`${this.config.apiUrl}/projects/${id}/invitations`)
      .pipe(
        map((response) => {
          return {
            totalInvitations: response.length,
            invitations: response,
          };
        })
      );
  }

  public acceptInvitationToken(token: string) {
    return this.http.post<Invitation>(
      `${this.config.apiUrl}/projects/invitations/${token}/accept`,
      {}
    );
  }

  public acceptInvitationId(id: string) {
    return this.http.post(
      `${this.config.apiUrl}/projects/${id}/invitations/accept`,
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
    id: string,
    userData: { username: string; roleSlug: string }
  ) {
    return this.http.patch(
      `${this.config.apiUrl}/projects/${id}/memberships/${userData.username}`,
      {
        roleSlug: userData.roleSlug,
      }
    );
  }

  public getWorkflows(id: string): Observable<Workflow[]> {
    return this.http.get<Workflow[]>(
      `${this.config.apiUrl}/projects/${id}/workflows`
    );
  }

  public getWorkflow(
    projectId: Project['id'],
    workflow: Workflow['slug']
  ): Observable<Workflow> {
    return this.http.get<Workflow>(
      `${this.config.apiUrl}/projects/${projectId}/workflows/${workflow}`
    );
  }

  public createWorkflow(
    workflow: Workflow['name'],
    project: Project['id']
  ): Observable<Workflow> {
    return this.http.post<Workflow>(
      `${this.config.apiUrl}/projects/${project}/workflows`,
      {
        name: workflow,
      }
    );
  }

  public updateInvitationRole(
    id: string,
    userData: { id: string; roleSlug: string }
  ) {
    return this.http.patch(
      `${this.config.apiUrl}/projects/${id}/invitations/${userData.id}`,
      {
        roleSlug: userData.roleSlug,
      }
    );
  }

  public getAllStories(
    project: Project['id'],
    workflow: Workflow['slug']
  ): Observable<{ stories: Story[]; offset: number; complete: boolean }> {
    return new Observable((subscriber) => {
      const limit = 100;
      let offset = 0;

      const nextPage = () => {
        this.getStories(project, workflow, offset, limit).subscribe(
          (stories) => {
            offset += stories.length;

            const complete = stories.length < limit;

            subscriber.next({ stories, offset, complete });

            if (complete) {
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
    project: Project['id'],
    workflow: Workflow['slug'],
    offset: number,
    limit: number
  ): Observable<Story[]> {
    return this.http
      .get<Story[]>(
        `${this.config.apiUrl}/projects/${project}/workflows/${workflow}/stories`,
        {
          params: {
            offset,
            limit,
          },
        }
      )
      .pipe(
        map((stories) => {
          return stories.map((story) => {
            return story;
          });
        })
      );
  }

  public createStory(
    story: Pick<Story, 'title' | 'status'>,
    project: Project['id'],
    workflow: Workflow['slug']
  ): Observable<Story> {
    return this.http.post<Story>(
      `${this.config.apiUrl}/projects/${project}/workflows/${workflow}/stories`,
      {
        title: story.title,
        status: story.status.id,
      }
    );
  }

  public moveStory(
    story: {
      ref: Story['ref'];
      status: Status['id'];
    },
    project: Project['id'],
    workflow: Workflow['slug'],
    reorder?: {
      place: 'after' | 'before';
      ref: Story['ref'];
    }
  ) {
    return this.http.post<{
      status: Status;
      stories: Story['ref'][];
    }>(
      `${this.config.apiUrl}/projects/${project}/workflows/${workflow}/stories/reorder`,
      {
        status: story.status,
        stories: [story.ref],
        reorder,
      }
    );
  }

  public getStory(
    projectId: Project['id'],
    storyRef: StoryDetail['ref']
  ): Observable<StoryDetail> {
    return this.http.get<StoryDetail>(
      `${this.config.apiUrl}/projects/${projectId}/stories/${storyRef}`
    );
  }

  public updateStory(projectId: Project['id'], story: StoryUpdate) {
    return this.http.patch<StoryDetail>(
      `${this.config.apiUrl}/projects/${projectId}/stories/${story.ref}`,
      {
        ...story,
      }
    );
  }

  public deleteStory(projectId: Project['id'], storyRef: Story['ref']) {
    return this.http.delete<StoryDetail>(
      `${this.config.apiUrl}/projects/${projectId}/stories/${storyRef}`
    );
  }

  public assingStory(
    projectId: Project['id'],
    storyRef: Story['ref'],
    user: User['username']
  ) {
    return this.http.post<{
      user: User['username' | 'fullName' | 'color'];
      story: Story['ref' | 'title'];
    }>(
      `${this.config.apiUrl}/projects/${projectId}/stories/${storyRef}/assignments`,
      {
        username: user,
      }
    );
  }

  public unAssignStory(
    projectId: Project['id'],
    storyRef: Story['ref'],
    user: User['username']
  ) {
    return this.http.delete(
      `${this.config.apiUrl}/projects/${projectId}/stories/${storyRef}/assignments/${user}`
    );
  }

  public removeMember(projectId: Project['id'], username: User['username']) {
    return this.http.delete(
      `${this.config.apiUrl}/projects/${projectId}/memberships/${username}`
    );
  }

  public uploadStoriesMediafiles(
    projectId: string,
    ref: Story['ref'],
    files: File[]
  ) {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append('files', file);
    });

    return this.http.post<MediaFile[]>(
      `${this.config.apiUrl}/projects/${projectId}/stories/${ref}/mediafiles`,
      formData
    );
  }

  public deleteProjectMembership(
    id: Project['id'],
    username: User['username']
  ) {
    return this.http.delete<void>(
      `${this.config.apiUrl}/projects/${id}/memberships/${username}`
    );
  }

  public getComments(
    projectId: Project['id'],
    ref: Story['ref'],
    order: string,
    offset: number,
    limit: number
  ): Observable<{
    comments: UserComment[];
    total: number;
    activeComments: number;
  }> {
    return this.http
      .get<UserComment[]>(
        `${this.config.apiUrl}/projects/${projectId}/stories/${ref}/comments`,
        {
          observe: 'response',
          params: {
            order,
            offset,
            limit,
          },
        }
      )
      .pipe(
        map((response) => {
          return {
            total: Number(response.headers.get('pagination-total')),
            comments: response.body ?? [],
            activeComments: Number(
              response.headers.get('taiga-total-comments')
            ),
          };
        })
      );
  }

  public editComment(
    commentId: UserComment['id'],
    text: UserComment['text'],
    storyRef: Story['ref'],
    projectId: Project['id']
  ) {
    return this.http.patch<UserComment>(
      `${this.config.apiUrl}/projects/${projectId}/stories/${storyRef}/comments/${commentId}`,
      {
        text,
      }
    );
  }

  public deleteComment(
    projectId: Project['id'],
    commentId: UserComment['id'],
    storyRef: Story['ref']
  ) {
    return this.http.delete<Required<UserComment>>(
      `${this.config.apiUrl}/projects/${projectId}/stories/${storyRef}/comments/${commentId}`
    );
  }

  public createStatus(
    project: Project['id'],
    status: Pick<Status, 'name' | 'color'>,
    workflow: Workflow['slug']
  ) {
    return this.http.post<Status>(
      `${this.config.apiUrl}/projects/${project}/workflows/${workflow}/statuses`,
      status
    );
  }

  public newComment(projectId: Project['id'], ref: Story['ref'], text: string) {
    return this.http.post<UserComment>(
      `${this.config.apiUrl}/projects/${projectId}/stories/${ref}/comments`,
      {
        text,
      }
    );
  }

  public editStatus(
    project: Project['id'],
    status: Pick<Status, 'name' | 'id'>,
    workflow: Workflow['slug']
  ) {
    return this.http.patch<Status>(
      `${this.config.apiUrl}/projects/${project}/workflows/${workflow}/statuses/${status.id}`,
      {
        name: status.name,
      }
    );
  }

  public deleteStatus(
    project: Project['id'],
    workflow: Workflow['slug'],
    status: Status['id'],
    moveToStatus?: Status['id']
  ) {
    return this.http.delete(
      `${
        this.config.apiUrl
      }/projects/${project}/workflows/${workflow}/statuses/${status}${
        moveToStatus ? `?moveTo=${moveToStatus}` : ''
      }`
    );
  }

  public moveStatus(
    statuses: Status['id'][],
    project: Project['id'],
    workflow: Workflow['slug'],
    reorder?: {
      place: 'after' | 'before';
      status: Status['id'];
    }
  ) {
    return this.http.post<{
      status: Status;
      stories: Story['ref'][];
    }>(
      `${this.config.apiUrl}/projects/${project}/workflows/${workflow}/statuses/reorder`,
      {
        statuses,
        reorder,
      }
    );
  }

  public getAttachments(projectId: Project['id'], ref: Story['ref']) {
    return this.http.get<Attachment[]>(
      `${this.config.apiUrl}/projects/${projectId}/stories/${ref}/attachments`
    );
  }

  public uploadAttachment(
    projectId: Project['id'],
    storyRef: Story['ref'],
    file: File
  ) {
    const formData = new FormData();

    formData.append('file', file);

    const req = new HttpRequest(
      'POST',
      `${this.config.apiUrl}/projects/${projectId}/stories/${storyRef}/attachments`,
      formData,
      {
        reportProgress: true,
      }
    );

    return this.http.request<Attachment>(req);
  }

  public deleteAttachment(
    projectId: Project['id'],
    storyRef: Story['ref'],
    attachmentId: Attachment['id']
  ) {
    return this.http.delete(
      `${this.config.apiUrl}/projects/${projectId}/stories/${storyRef}/attachments/${attachmentId}`
    );
  }
}
