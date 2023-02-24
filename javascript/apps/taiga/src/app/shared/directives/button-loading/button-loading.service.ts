/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Injectable, OnDestroy } from '@angular/core';
import { of } from 'rxjs';
import { delay, map, take, tap } from 'rxjs/operators';
import { ButtonLoadingDirective } from './button-loading.directive';

@Injectable({
  providedIn: 'root',
})
export class ButtonLoadingService implements OnDestroy {
  private button?: ButtonLoadingDirective;
  private initTimer: number | null = null;
  private initLoadingTimeout?: ReturnType<typeof setTimeout>;
  private backToInitialStateTimeout?: ReturnType<typeof setTimeout>;

  public start() {
    this.button?.start();

    this.initLoadingTimeout = setTimeout(() => {
      this.initTimer = new Date().getTime();
      this.button?.inProgressState();
    }, 2000);
  }

  public waitLoading() {
    return <T>(data: T) => {
      return this.whenReady().pipe(
        map(() => {
          return data;
        })
      );
    };
  }

  public whenReady() {
    if (!this.initTimer) {
      this.destroyTimers();
      this.button?.defaultState();

      return of(null);
    }

    const delaySuccess = 2000 - (new Date().getTime() - this.initTimer);

    return of(null)
      .pipe(delay(delaySuccess < 0 ? 0 : delaySuccess))
      .pipe(
        tap(() => {
          this.button?.doneState();
          this.initTimer = null;

          this.backToInitialStateTimeout = setTimeout(() => {
            this.button?.defaultState();
          }, 5000);
        }),
        delay(1000), // time to see the success msg
        take(1)
      );
  }

  public error() {
    this.destroyTimers();

    this.initTimer = null;
    this.button?.defaultState();
  }

  public register(button: ButtonLoadingDirective) {
    this.button = button;
  }

  public ngOnDestroy() {
    this.destroyTimers();
  }

  private destroyTimers() {
    if (this.backToInitialStateTimeout) {
      clearTimeout(this.backToInitialStateTimeout);
    }

    if (this.initLoadingTimeout) {
      clearTimeout(this.initLoadingTimeout);
    }
  }
}
