/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Injectable } from '@angular/core';
import { of } from 'rxjs';

@Injectable()
export class ButtonLoadingServiceMock {
  public start = jest.fn();
  public register = jest.fn();
  public error = jest.fn();

  public waitLoading() {
    return <T>(data: T) => {
      return of(data);
    };
  }

  public whenReady() {
    of(null);
  }
}
