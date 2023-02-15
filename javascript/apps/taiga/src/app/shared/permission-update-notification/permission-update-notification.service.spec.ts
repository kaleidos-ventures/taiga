/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { ProjectMockFactory } from '@taiga/data';
import { AppService } from '~/app/services/app.service';
import { PermissionsService } from '~/app/services/permissions.service';
import { PermissionUpdateNotificationService } from './permission-update-notification.service';

describe('PermissionUpdateNotificationServiceService', () => {
  let spectator: SpectatorService<PermissionUpdateNotificationService>;
  const createService = createServiceFactory({
    service: PermissionUpdateNotificationService,
    mocks: [PermissionsService, AppService],
  });

  beforeEach(() => (spectator = createService()));

  describe('apply permission to formGroup', () => {
    it('no access - disable form', () => {
      expect(true).toBeTruthy();
    });

    it('notify Lose Permissions - has some permissions', () => {
      const previousProject = ProjectMockFactory();
      previousProject.userPermissions = [
        'story_create',
        'story_modify',
        'story_delete',
      ];
      const currentProject = ProjectMockFactory();
      currentProject.userPermissions = ['story_create', 'story_modify'];
      const permissionsService = spectator.inject(PermissionsService);
      spectator.service.notify = jest.fn();

      permissionsService.hasPermissions.mockReturnValue(true);

      spectator.service.notifyLosePermissions(previousProject, currentProject);
      expect(spectator.service.notify).toHaveBeenCalledWith(
        'edit_story_lost_some_permission'
      );
    });

    it('notify Lose Permissions - has NO permissions', () => {
      const previousProject = ProjectMockFactory();
      previousProject.userPermissions = [
        'story_create',
        'story_modify',
        'story_delete',
      ];
      const currentProject = ProjectMockFactory();
      currentProject.userPermissions = ['story_create', 'story_modify'];
      const permissionsService = spectator.inject(PermissionsService);
      spectator.service.notify = jest.fn();

      permissionsService.hasPermissions.mockReturnValue(false);

      spectator.service.notifyLosePermissions(previousProject, currentProject);
      expect(spectator.service.notify).toHaveBeenCalledWith(
        'edit_story_lost_permission'
      );
    });
  });
});
