/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { CanDeactivate } from '@angular/router';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface NewProjectCanDeactivate {
  canDeactivate: () => boolean | Observable<boolean>;
}

@Injectable({ providedIn: 'root' })
export class NewProjectPendingChangesGuard
  implements CanDeactivate<NewProjectCanDeactivate>
{
  public canDeactivate(
    component: NewProjectCanDeactivate
  ): boolean | Observable<boolean> {
    return component.canDeactivate();
  }
}
