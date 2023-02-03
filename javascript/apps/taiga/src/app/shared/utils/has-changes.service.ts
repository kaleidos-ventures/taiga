/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Injectable } from '@angular/core';

export interface HasChanges {
  hasChanges: () => boolean;
}

@Injectable()
export class HasChangesService {
  private components: HasChanges[] = [];

  public addComponent(component: HasChanges) {
    this.components.push(component);
  }

  public deleteComponent(component: HasChanges) {
    this.components = this.components.filter((it) => it !== component);
  }

  public check() {
    return !!this.components.find((it) => it.hasChanges());
  }
}
