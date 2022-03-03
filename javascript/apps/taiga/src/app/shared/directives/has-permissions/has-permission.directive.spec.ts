/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import {
  createDirectiveFactory,
  SpectatorDirective,
} from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { PermissionsService } from '~/app/services/permissions.service';
import { HasPermissionDirective } from './has-permission.directive';

describe('HasPermissionDirective', () => {
  let spectator: SpectatorDirective<HasPermissionDirective>;

  const createDirective = createDirectiveFactory({
    directive: HasPermissionDirective,
    mocks: [PermissionsService],
    providers: [],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createDirective(`
      <div *hasPermission="
        ['view', 'edit'];
        entity: 'us';
        operation: 'OR'">
        Visible
      </div>
    `);
  });

  it('should be visile', () => {
    const permissionsService = spectator.inject(PermissionsService);

    permissionsService.hasPermissions$.mockReturnValue(of(true));

    spectator.detectChanges();

    expect(spectator.fixture.nativeElement.innerHTML).toHaveText('Visible');
  });

  it('should be invisible', () => {
    const permissionsService = spectator.inject(PermissionsService);

    permissionsService.hasPermissions$.mockReturnValue(of(false));

    spectator.detectChanges();

    expect(spectator.fixture.nativeElement.innerHTML).not.toHaveText('Visible');
  });
});
