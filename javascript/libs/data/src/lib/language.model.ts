/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

export interface Language {
  code: string;
  name: string;
  englishName: string;
  textDirection: 'rtl' | 'ltr';
  isDefault: boolean;
  scriptType: 'latin' | 'hebrew' | 'cyrillic' | 'arabic' | 'chinese_and_devs';
}