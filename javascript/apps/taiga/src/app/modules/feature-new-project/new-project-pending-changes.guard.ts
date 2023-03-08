/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { CanDeactivateFn } from '@angular/router';
import { Observable } from 'rxjs';

export interface NewProjectCanDeactivate {
  canDeactivate: () => boolean | Observable<boolean>;
}

export const NewProjectPendingChangesGuard: CanDeactivateFn<
  NewProjectCanDeactivate
> = (component: NewProjectCanDeactivate) => {
  return component.canDeactivate();
};
