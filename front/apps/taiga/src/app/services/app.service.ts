/**
 * Copyright (c) 2014-2021 Taiga Agile LLC
 *
 * This source code is licensed under the terms of the
 * GNU Affero General Public License found in the LICENSE file in
 * the root directory of this source tree.
 */

import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { unexpectedError } from '@/app/app.actions';
import { UnexpectedError } from '@taiga/data';

@Injectable({
  providedIn: 'root',
})
export class AppService {
  public formatHttpErrorResponse(error: HttpErrorResponse): UnexpectedError {
    return {
      message: error.message,
    };
  }
  public unexpectedHttpErrorResponseAction(error: HttpErrorResponse) {
    return unexpectedError({
      error: this.formatHttpErrorResponse(error),
    });
  }
}
