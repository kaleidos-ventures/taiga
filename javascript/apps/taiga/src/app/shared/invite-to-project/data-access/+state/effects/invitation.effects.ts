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

import * as InvitationActions from '../actions/invitation.action';
import { InvitationApiService } from '@taiga/api';
import { fetch } from '@nrwl/angular';
import { AppService } from '~/app/services/app.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Contact } from '@taiga/data';

@Injectable()
export class InvitationEffects {
  public myContactsSuccess$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(InvitationActions.fetchMyContacts),
      fetch({
        run: (action) => {
          return this.invitationApiService.myContacts(action.emails).pipe(
            map((contacts: Contact[]) => {
              return InvitationActions.fetchMyContactsSuccess({ contacts });
            })
          );
        },
        onError: (_, httpResponse: HttpErrorResponse) =>
          this.appService.errorManagement(httpResponse),
      })
    );
  });

  constructor(
    private actions$: Actions,
    private invitationApiService: InvitationApiService,
    private appService: AppService
  ) {}
}
