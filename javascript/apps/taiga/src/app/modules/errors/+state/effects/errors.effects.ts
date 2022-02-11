/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';

import { map } from 'rxjs/operators';
import * as ErrorActions from '../actions/errors.actions';
import { Router } from '@angular/router';

@Injectable()
export class ErrorsEffects {
  public unexpectedError$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(ErrorActions.unexpectedError),
        map(() => {
          void this.router.navigateByUrl('/500', { skipLocationChange: true });
        })
      );
    },
    { dispatch: false }
  );

  constructor(private router: Router, private actions$: Actions) {}
}
