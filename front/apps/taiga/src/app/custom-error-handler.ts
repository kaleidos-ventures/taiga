/**
 * Copyright (c) 2014-2021 Taiga Agile LLC
 *
 * This source code is licensed under the terms of the
 * GNU Affero General Public License found in the LICENSE file in
 * the root directory of this source tree.
 */

import { ErrorHandler } from '@angular/core';
import { Store } from '@ngrx/store';
import { unhandleError } from '@/app/app.actions'

export class CustomErrorHandler implements ErrorHandler {
  constructor(private store: Store) {}

  handleError(error: unknown) {
    this.store.dispatch(unhandleError({error}))
  }
}
