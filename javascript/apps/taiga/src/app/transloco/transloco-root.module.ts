/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { HttpClient } from '@angular/common/http';
import {
  TRANSLOCO_LOADER,
  Translation,
  TranslocoLoader,
  TRANSLOCO_CONFIG,
  translocoConfig,
  TranslocoModule
} from '@ngneat/transloco';
import { Injectable, NgModule } from '@angular/core';
import { TranslocoMessageFormatModule } from '@ngneat/transloco-messageformat';
import { environment } from '~/environments/environment';

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  constructor(private http: HttpClient) {}

  public getTranslation(lang: string) {
    return this.http.get<Translation>(`/assets/i18n/${lang}.json`);
  }
}

@NgModule({
  imports: [
    TranslocoMessageFormatModule.init()
  ],
  exports: [ TranslocoModule ],
  providers: [
    {
      provide: TRANSLOCO_CONFIG,
      useValue: translocoConfig({
        availableLangs: ['en', 'es'],
        defaultLang: 'en',
        fallbackLang: 'en',
        // Remove this option if your application doesn't support changing language in runtime.
        reRenderOnLangChange: true,
        prodMode: environment.production,
        flatten: {
          aot: environment.production
        }
      })
    },
    { provide: TRANSLOCO_LOADER, useClass: TranslocoHttpLoader }
  ]
})
export class TranslocoRootModule {}
