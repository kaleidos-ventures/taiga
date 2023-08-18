/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Injectable } from '@angular/core';
import { TuiNotification } from '@taiga-ui/core';
import { Project } from '@taiga/data';
import { AppService } from '~/app/services/app.service';
import { PermissionsService } from '~/app/services/permissions.service';

@Injectable({
  providedIn: 'root',
})
export class PermissionUpdateNotificationService {
  constructor(
    private permissionService: PermissionsService,
    private appService: AppService
  ) {}

  public notifyLosePermissions(
    previousProject: Project,
    currentProject: Project
  ) {
    if (
      previousProject?.userPermissions.length >
      currentProject?.userPermissions.length
    ) {
      const hasStoryPermissions = this.permissionService.hasPermissions(
        'story',
        ['create', 'delete', 'modify'],
        'OR'
      );
      const hasStoryViewPermissions = this.permissionService.hasPermissions(
        'story',
        ['view'],
        'OR'
      );
      const hadStoryCommentPermissions =
        previousProject?.userPermissions.includes('comment_story');
      const hasStoryCommentPermissions = this.permissionService.hasPermissions(
        'story',
        ['comment'],
        'OR'
      );
      const lostOnePermission =
        previousProject?.userPermissions.length -
          currentProject?.userPermissions.length ===
        1;

      if (
        hadStoryCommentPermissions &&
        !hasStoryCommentPermissions &&
        lostOnePermission
      ) {
        this.notify('lost_comment_permissions');
      } else if (hasStoryPermissions) {
        this.notify('edit_story_lost_some_permission');
      } else if (hasStoryViewPermissions) {
        this.notify('edit_story_lost_permission');
      }
    }
  }

  public notify(translation: string) {
    this.appService.toastNotification({
      message: translation,
      status: TuiNotification.Warning,
      scope: 'kanban',
      autoClose: true,
    });
  }
}
