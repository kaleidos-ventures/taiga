/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { LocationStrategy } from '@angular/common';
import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Status } from '@taiga/data';
import Diacritics from 'diacritic';
import { take } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class UtilsService {
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private locationStrategy: LocationStrategy
  ) {}

  public static objKeysTransformer(
    input: Record<string, unknown> | ArrayLike<unknown>,
    transformerFn: (input: string) => string
  ): Record<string, unknown> | ArrayLike<unknown> {
    if (input === null || typeof input !== 'object') {
      return input;
    } else if (Array.isArray(input)) {
      return input.map(
        (it: Parameters<typeof UtilsService.objKeysTransformer>[0]) => {
          return this.objKeysTransformer(it, transformerFn);
        }
      );
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      return Object.fromEntries(
        Object.entries(input).map(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            return [
              transformerFn(key),
              this.objKeysTransformer(
                value as Record<string, unknown>,
                transformerFn
              ),
            ];
          }

          return [transformerFn(key), value];
        })
      ) as { [k: string]: unknown };
    }
  }

  public static getState<K>(
    store: Store,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selector: (state: Record<string, any>) => K
  ): K {
    let state: K;

    store
      .select(selector)
      .pipe(take(1))
      .subscribe((data) => {
        state = data;
      });

    return state!;
  }

  public navigatorLanguage() {
    return navigator.language;
  }

  public getUrl(commands: number[] | string[] | string) {
    const routerCommands = Array.isArray(commands) ? commands : [commands];

    const urlTree = this.router.createUrlTree(routerCommands, {
      relativeTo: this.route,
    });

    return this.locationStrategy.prepareExternalUrl(
      this.router.serializeUrl(urlTree)
    );
  }

  public static statusColor(colorNumber: number, type = 60) {
    const colors: Record<Status['color'], string> = {
      1: `gray${type}`,
      2: `ok${type}`,
      3: `notice${type}`,
      4: `info${type}`,
    };

    return colors[colorNumber];
  }

  public static normalizeText(text: string) {
    // normalize texts with uppercase/accent marks "Álava" -> 'alava'
    const partialNormalize = Diacritics.clean(text).toLowerCase();
    return partialNormalize.normalize('NFD').replace(/[Ð-ð]/g, 'd');
  }
}
