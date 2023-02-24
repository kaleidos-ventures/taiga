/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */
import { Language } from './language.model';

export const LanguageListMockFactory = () => {
  return [
    {
      code: 'ca',
      name: 'Català',
      englishName: 'Catalan',
      scriptType: 'latin',
      textDirection: 'ltr',
      isDefault: false,
    },
    {
      code: 'en-US',
      name: 'English (United States)',
      englishName: 'English (United States)',
      scriptType: 'latin',
      textDirection: 'ltr',
      isDefault: true,
    },
    {
      code: 'es-ES',
      name: 'Español (España)',
      englishName: 'Spanish (Spain)',
      scriptType: 'latin',
      textDirection: 'ltr',
      isDefault: false,
    },
    {
      code: 'eu',
      name: 'Euskara',
      englishName: 'Basque',
      scriptType: 'latin',
      textDirection: 'ltr',
      isDefault: false,
    },
    {
      code: 'pt',
      name: 'Português',
      englishName: 'Portuguese',
      scriptType: 'latin',
      textDirection: 'ltr',
      isDefault: false,
    },
    {
      code: 'pt-BR',
      name: 'Português (Brasil)',
      englishName: 'Portuguese (Brazil)',
      scriptType: 'latin',
      textDirection: 'ltr',
      isDefault: false,
    },
    {
      code: 'bg',
      name: 'български',
      englishName: 'Bulgarian',
      scriptType: 'cyrillic',
      textDirection: 'ltr',
      isDefault: false,
    },
    {
      code: 'ru',
      name: 'русский',
      englishName: 'Russian',
      scriptType: 'cyrillic',
      textDirection: 'ltr',
      isDefault: false,
    },
    {
      code: 'uk',
      name: 'українська',
      englishName: 'Ukrainian',
      scriptType: 'cyrillic',
      textDirection: 'ltr',
      isDefault: false,
    },
    {
      code: 'he',
      name: 'עברית',
      englishName: 'Hebrew',
      scriptType: 'hebrew',
      textDirection: 'rtl',
      isDefault: false,
    },
    {
      code: 'ar',
      name: 'العربية',
      englishName: 'Arabic',
      scriptType: 'arabic',
      textDirection: 'rtl',
      isDefault: false,
    },
    {
      code: 'fa',
      name: 'فارسی',
      englishName: 'Persian',
      scriptType: 'arabic',
      textDirection: 'rtl',
      isDefault: false,
    },
    {
      code: 'zh_Hans',
      name: '中文 (简体)',
      englishName: 'Chinese (Simplified)',
      scriptType: 'chinese_and_devs',
      textDirection: 'ltr',
      isDefault: false,
    },
    {
      code: 'zh_Hant',
      name: '中文 (繁體)',
      englishName: 'Chinese (Traditional)',
      scriptType: 'chinese_and_devs',
      textDirection: 'ltr',
      isDefault: false,
    },
    {
      code: 'ja',
      name: '日本語',
      englishName: 'Japanese',
      scriptType: 'chinese_and_devs',
      textDirection: 'ltr',
      isDefault: false,
    },
    {
      code: 'ko',
      name: '한국어',
      englishName: 'Korean',
      scriptType: 'chinese_and_devs',
      textDirection: 'ltr',
      isDefault: false,
    },
  ] as Language[];
};

export const LanguageMockFactory = (): Language => {
  const list = LanguageListMockFactory();

  return list[Math.floor(Math.random() * list.length)];
};
