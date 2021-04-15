/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { unexpectedError } from '@taiga/core';
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
