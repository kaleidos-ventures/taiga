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
      1: `warning${type}`,
      2: `secondary${type}`,
      3: `ok${type}`,
      4: `notice${type}`,
      5: `yellow${type}`,
      6: `info${type}`,
      7: `red${type}`,
      8: `green${type}`,
    };

    return colors[colorNumber];
  }

  public static getNextStatusColor(statusColors: number[]) {
    const colors: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0,
      7: 0,
      8: 0,
    };

    statusColors.forEach((color: number) => {
      colors[color] = colors[color] + 1;
    });
    const colorsOrdered = Object.keys(colors).sort(
      (a, b) => colors[+a] - colors[+b]
    );

    // returns the next available color in the order setted
    return +colorsOrdered[0];
  }

  public static normalizeText(text: string) {
    // normalize texts with uppercase/accent marks "Álava" -> 'alava'
    const partialNormalize = Diacritics.clean(text).toLowerCase();
    return partialNormalize.normalize('NFD').replace(/[Ð-ð]/g, 'd');
  }
}
