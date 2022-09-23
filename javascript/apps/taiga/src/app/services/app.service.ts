/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { HttpErrorResponse } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { HashMap, TranslocoService } from '@ngneat/transloco';
import { Store } from '@ngrx/store';
import { TuiAlertService, TuiNotification } from '@taiga-ui/core';
import { ErrorManagementOptions, UnexpectedError } from '@taiga/data';
import { forkJoin, of } from 'rxjs';
import { filter, take, takeUntil } from 'rxjs/operators';
import {
  forbidenError,
  unexpectedError,
} from '../modules/errors/+state/actions/errors.actions';

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
          closeOnNavigation: config.options.closeOnNavigation,
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
    closeOnNavigation?: boolean;
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

      const closeOnNavigation = data.closeOnNavigation ?? true;
      let notificationOpen = this.notificationsService.open(
        message,
        toastOptions
      );

      if (closeOnNavigation) {
        notificationOpen = notificationOpen.pipe(
          takeUntil(
            this.router.events.pipe(
              filter(
                (evt): evt is NavigationStart => evt instanceof NavigationStart
              )
            )
          )
        );
      }

      notificationOpen.subscribe();
    });
  }
}
