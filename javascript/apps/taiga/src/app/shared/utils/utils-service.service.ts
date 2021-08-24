/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

export class UtilsService {
  public static objKeysTransformer(
    input: Record<string, unknown> | ArrayLike<unknown>,
    transformerFn: (input: string) => string): Record<string, unknown> | ArrayLike<unknown> {
    if (input === null || typeof input !== 'object') {
      return input;
    } else if (Array.isArray(input)) {
      return input.map((it) => {
        return this.objKeysTransformer(it, transformerFn);
      });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      return Object.fromEntries(
        Object.entries(input).map(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            return [
              transformerFn(key),
              this.objKeysTransformer(value as Record<string, unknown>, transformerFn)
            ];
          }

          return [transformerFn(key), value];
        })
      ) as { [k: string]: unknown; };
    }
  }
}
