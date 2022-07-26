/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { HttpErrorResponse } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { TuiNotification, TuiAlertService } from '@taiga-ui/core';
import {
  unexpectedError,
  forbidenError,
} from '../modules/errors/+state/actions/errors.actions';
import { ErrorManagementOptions, UnexpectedError } from '@taiga/data';
import { Store } from '@ngrx/store';
import { HashMap, TranslocoService } from '@ngneat/transloco';
import { filter, take, takeUntil } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { NavigationStart, Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AppService {
  constructor(
    private store: Store,
    private translocoService: TranslocoService,
    private router: Router,
    @Inject(TuiAlertService)
    private readonly notificationsService: TuiAlertService
  ) {}

  public formatHttpErrorResponse(error: HttpErrorResponse): UnexpectedError {
    return {
      message: error.message,
    };
  }

  public errorManagement(
    error: HttpErrorResponse,
    errorOptions?: ErrorManagementOptions
  ) {
    const status = error.status as keyof ErrorManagementOptions;
    if (errorOptions && errorOptions[status]) {
      const config = errorOptions[status];
      if (config && config.type === 'toast') {
        return this.toastNotification({
          label: config.options.label,
          message: config.options.message,
          paramsMessage: config.options.paramsMessage,
          status: config.options.status,
          scope: config.options.scope,
        });
      }
    } else if (status === 403) {
      return this.store.dispatch(
        forbidenError({
          error: this.formatHttpErrorResponse(error),
        })
      );
    } else if (status === 500 || status === 400 || status === 404) {
      return this.store.dispatch(
        unexpectedError({
          error: this.formatHttpErrorResponse(error),
        })
      );
    }
  }

  public toastNotification(data: {
    label?: string;
    message: string;
    status: TuiNotification;
    scope?: string;
    autoClose?: boolean;
    paramsLabel?: HashMap<unknown>;
    paramsMessage?: HashMap<unknown>;
  }) {
    const autoCloseTimer = 7000;
    forkJoin([
      data.label
        ? this.translocoService
            .selectTranslate(data.label, {}, data.scope)
            .pipe(take(1))
        : of({}),
      this.translocoService
        .selectTranslate(data.message, {}, data.scope)
        .pipe(take(1)),
    ]).subscribe(() => {
      const label =
        data.label &&
        this.translocoService.translate(
          data.label,
          data.paramsLabel,
          data.scope
        );
      const message = this.translocoService.translate(
        data.message,
        data.paramsMessage,
        data.scope
      );
      const toastOptions = {
        hasIcon: true,
        hasCloseButton: true,
        autoClose: data.autoClose ? autoCloseTimer : false,
        label,
        status: data.status,
      };

      this.notificationsService
        .open(message, toastOptions)
        .pipe(
          takeUntil(
            this.router.events.pipe(
              filter(
                (evt: unknown): evt is NavigationStart =>
                  evt instanceof NavigationStart
              )
            )
          )
        )
        .subscribe();
    });
  }
}
