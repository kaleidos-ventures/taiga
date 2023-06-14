/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { Observable } from 'rxjs';
import { CanDeactivateService } from './can-deactivate.service';

export interface ComponentCanDeactivate {
  canDeactivate: () => Observable<boolean>;
}

export const CanDeactivateGuard: CanDeactivateFn<
  ComponentCanDeactivate
> = () => {
  const canDeactivateComponent = inject(CanDeactivateService);

  return canDeactivateComponent.check();
};
