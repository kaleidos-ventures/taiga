/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, filter, map, switchMap, take } from 'rxjs';
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import { TuiLanguage } from '@taiga-ui/i18n';
import { TUI_ENGLISH_LANGUAGE, TUI_SPANISH_LANGUAGE } from '@taiga-ui/i18n';
import editorLanguages from '~/assets/editor/languages.json';
import { LocalStorageService } from '~/app/shared/local-storage/local-storage.service';
import { Language } from '@taiga/data';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  #languages = new BehaviorSubject<Language[]>([]);

  constructor(private store: Store) {}
  public navigatorLanguage() {
    return navigator.language;
  }

  public setLanguages(languages: Language[]) {
    this.#languages.next(languages);
  }

  public getLanguages() {
    return this.#languages.asObservable();
  }

  public getUserLanguage() {
    return this.getLanguages().pipe(
      filter((langs) => !!langs.length),
      take(1),
      switchMap((langs) => {
        return this.store.select(selectUser).pipe(
          map((user) => {
            return {
              userLang: user?.lang ?? LocalStorageService.get('lang'),
              langs,
            };
          })
        );
      }),
      map((lanOptions) => {
        const userNavLang = lanOptions.userLang ?? this.navigatorLanguage();

        let userLang = lanOptions.langs.find((it) => it.code === userNavLang);

        if (userLang) {
          return userLang;
        }

        userLang = lanOptions.langs.find((it) =>
          it.code.startsWith(userNavLang.slice(0, 2))
        );

        if (userLang) {
          return userLang;
        }

        return lanOptions.langs.find((it) => it.isDefault)!;
      })
    );
  }

  public getTuiLanguage() {
    const languages: Record<string, TuiLanguage> = {
      'en-US': TUI_ENGLISH_LANGUAGE,
      'es-ES': TUI_SPANISH_LANGUAGE,
    };

    return this.getUserLanguage().pipe(
      map((lang) => {
        if (languages[lang.code]) {
          return languages[lang.code];
        }

        return TUI_ENGLISH_LANGUAGE;
      })
    );
  }

  public getEditorLanguage() {
    return this.getUserLanguage().pipe(
      map((lang) => {
        const lanCode = lang.code.split('-')[0];
        const editorLan = editorLanguages.includes(lanCode) ? lanCode : 'en';

        return {
          url: `/assets/editor/langs/${editorLan}.js`,
          code: editorLan,
        };
      })
    );
  }
}
