/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

export function pick<T extends object, K extends keyof T>(
  object: T,
  keys: readonly K[]
) {
  return keys.reduce((acc, name) => {
    if (name in object) {
      acc[name] = object[name];
    }
    return acc;
  }, {} as Pick<T, K>);
}
