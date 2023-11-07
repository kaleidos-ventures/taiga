/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Project } from './project.model';
import { Story } from './story.model';
import { User } from './user.model';
import { UserComment } from './user-comment.model';

export interface Notification {
  id: string;
  createdBy: Pick<User, 'color' | 'username' | 'fullName'>;
  createdAt: string;
  readAt: string;
}

export interface NotificationStoryAssign extends Notification {
  type: 'stories.assign';
  content: {
    story: Pick<Story, 'ref' | 'title'>;
    project: Pick<Project, 'id' | 'name' | 'slug'>;
    assignedBy: Pick<User, 'color' | 'username' | 'fullName'>;
    assignedTo: Pick<User, 'color' | 'username' | 'fullName'>;
  };
}
export interface NotificationStoryUnassign extends Notification {
  type: 'stories.unassign';
  content: {
    story: Pick<Story, 'ref' | 'title'>;
    project: Pick<Project, 'id' | 'name' | 'slug'>;
    unassignedBy: Pick<User, 'color' | 'username' | 'fullName'>;
    unassignedTo: Pick<User, 'color' | 'username' | 'fullName'>;
  };
}

export interface NotificationStoryStatusChange extends Notification {
  type: 'stories.status_change';
  content: {
    story: Pick<Story, 'ref' | 'title'>;
    project: Pick<Project, 'id' | 'name' | 'slug'>;
    status: string;
    changedBy: Pick<User, 'color' | 'username' | 'fullName'>;
  };
}

export interface NotificationStoryCommentCreate extends Notification {
  type: 'story_comment.create';
  content: {
    story: Pick<Story, 'ref' | 'title'>;
    project: Pick<Project, 'id' | 'name' | 'slug'>;
    status: string;
    comment: UserComment;
    commentedBy: Pick<User, 'color' | 'username' | 'fullName'>;
  };
}

export interface NotificationStoryDelete extends Notification {
  type: 'stories.delete';
  content: {
    story: Pick<Story, 'ref' | 'title'>;
    project: Pick<Project, 'id' | 'name' | 'slug'>;
    deletedBy: Pick<User, 'color' | 'username' | 'fullName'>;
  };
}

export type NotificationType =
  | NotificationStoryAssign
  | NotificationStoryUnassign
  | NotificationStoryStatusChange
  | NotificationStoryCommentCreate
  | NotificationStoryDelete;
