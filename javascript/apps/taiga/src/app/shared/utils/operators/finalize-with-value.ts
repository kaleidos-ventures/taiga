/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { defer, finalize, Observable, tap } from 'rxjs';

export function finalizeWithValue<T>(callback: (value: T) => void) {
  return (source: Observable<T>) =>
    defer(() => {
      let lastValue: T;
      return source.pipe(
        tap((value) => (lastValue = value)),
        finalize(() => callback(lastValue))
      );
    });
}
