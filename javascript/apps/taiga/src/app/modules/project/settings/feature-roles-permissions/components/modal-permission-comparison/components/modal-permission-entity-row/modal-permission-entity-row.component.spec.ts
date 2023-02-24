/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { randText } from '@ngneat/falso';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { ProjectsSettingsFeatureRolesPermissionsService } from '~/app/modules/project/settings/feature-roles-permissions/services/feature-roles-permissions.service';
import { getTranslocoModule } from '~/app/transloco/transloco-testing.module';
import { ModalPermissionEntityRowComponent } from './modal-permission-entity-row.component';

describe('ModalPermissionEntityRowComponent', () => {
  let spectator: Spectator<ModalPermissionEntityRowComponent>;
  const createComponent = createComponentFactory({
    component: ModalPermissionEntityRowComponent,
    imports: [getTranslocoModule()],
    schemas: [NO_ERRORS_SCHEMA],
    mocks: [ProjectsSettingsFeatureRolesPermissionsService],
  });

  beforeEach(() => {
    spectator = createComponent({
      detectChanges: false,
    });
  });

  it('is Restricted - false', () => {
    const text = randText();

    expect(spectator.component.isRestricted(text)).toBeFalsy();
  });

  it('is Restricted - true', () => {
    const text = 'project_settings.roles_permissions.restricted';

    expect(spectator.component.isRestricted(text)).toBeTruthy();
  });

  it('toggle dropdown', () => {
    spectator.component.open = false;
    spectator.component.toggleDropdown();

    expect(spectator.component.open).toBeTruthy();
  });
});
