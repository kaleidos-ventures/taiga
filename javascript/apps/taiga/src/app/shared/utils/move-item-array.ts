/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

export function moveItemArray<T = unknown>(
  array: T[],
  fromIndex: number,
  toIndex: number
) {
  const newArray = [...array];

  const startIndex = fromIndex < 0 ? newArray.length + fromIndex : fromIndex;

  if (startIndex >= 0 && startIndex < newArray.length) {
    const endIndex = toIndex < 0 ? newArray.length + toIndex : toIndex;

    const [item] = newArray.splice(fromIndex, 1);
    newArray.splice(endIndex, 0, item);
  }

  return newArray;
}
