/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Injectable } from '@angular/core';
import { Router, RoutesRecognized } from '@angular/router';
import { filter, pairwise } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RouteHistoryService {

  private previousUrl!: string;

  constructor(
    private router: Router,
  ) {
    this.router.events
      .pipe(
        filter((evt: unknown) => evt instanceof RoutesRecognized),
        pairwise()
      ).subscribe((events) => {
        this.previousUrl = (events[0] as RoutesRecognized).urlAfterRedirects;
      });
  }

  public getPreviousUrl(): string {
    return this.previousUrl;
  }
}
