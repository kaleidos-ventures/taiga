/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Location } from '@angular/common';
import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, pairwise } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class RouteHistoryService {
  public previousUrl!: string;
  public previousFragment!: string;
  public urlChanged = new Subject<{ url: string; state: unknown }>();

  constructor(private router: Router, private location: Location) {
    this.location.onUrlChange((url, state) => {
      this.urlChanged.next({ url, state });
    });
  }

  public listen() {
    this.router.events
      .pipe(
        filter(
          (evt: unknown): evt is NavigationEnd => evt instanceof NavigationEnd
        ),
        pairwise()
      )
      .subscribe((events) => {
        const urlAfterRedirects = events[0].urlAfterRedirects.split('#');

        if (
          this.previousUrl !== urlAfterRedirects[0] ||
          this.previousFragment !== urlAfterRedirects[1]
        ) {
          this.previousUrl = urlAfterRedirects[0];
          this.previousFragment = urlAfterRedirects[1];
        }
      });
  }

  public getPreviousUrl(): string {
    return this.previousUrl;
  }

  public getPreviousFragment(): string {
    return this.previousFragment;
  }

  public back() {
    void this.router.navigateByUrl(this.previousUrl ?? '/');
  }
}
