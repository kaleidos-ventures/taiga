/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

/* delete me */

import { HttpClient } from '@angular/common/http';
import { Injectable, NgModule } from '@angular/core';
import {
  Translation,
  TranslocoLoader,
  TranslocoModule,
  provideTransloco,
} from '@ngneat/transloco';
import { provideTranslocoMessageformat } from '@ngneat/transloco-messageformat';
import cacheBusting from '~/assets/i18n/i18n-cache-busting.json';
import { environment } from '~/environments/environment';

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  constructor(private http: HttpClient) {}

  public getTranslation(lang: keyof typeof cacheBusting) {
    /* eslint-disable */
    return this.http.get<Translation>(
      `/assets/i18n/${lang}.json?v=${cacheBusting[lang]}`
    );
    /* eslint-enable */
  }
}

@NgModule({
  exports: [TranslocoModule],
  providers: [
    provideTransloco({
      config: {
        availableLangs: ['en-US'],
        defaultLang: 'en-US',
        fallbackLang: 'en-US',
        reRenderOnLangChange: true,
        prodMode: environment.production,
        flatten: {
          aot: environment.production,
        },
      },
      loader: TranslocoHttpLoader,
    }),
    provideTranslocoMessageformat(),
  ],
})
export class TranslocoRootModule {}
