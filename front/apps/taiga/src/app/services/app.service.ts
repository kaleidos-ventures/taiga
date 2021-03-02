/**
 * Copyright (c) 2014-2021 Taiga Agile LLC
 *
 * This source code is licensed under the terms of the
 * GNU Affero General Public License found in the LICENSE file in
 * the root directory of this source tree.
 */

import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { unexpectedError } from '@/app/app.actions';

@Injectable()
export class AppService {
  constructor(private store: Store) {}

  public unexpectedHttpErrorResponse(error: HttpErrorResponse) {
    this.store.dispatch(unexpectedError({error: {
      message: error.message,
    }}));
  }
}
