/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { environment } from './environments/environment';
import { Config } from '@taiga/data';

function init() {
  void import('./app/app.module').then((m) => {
    platformBrowserDynamic()
      .bootstrapModule(m.AppModule, { ngZoneEventCoalescing: true })
      .catch((err) => console.error(err));
  });
}

if (environment.production) {
  enableProdMode();
}

if (environment.configRemote) {
  void fetch(environment.configRemote)
    .then((response) => response.json())
    .then((config) => {
      environment.configLocal = config as Config;

      init();
    });
} else {
  document.addEventListener('DOMContentLoaded', () => {
    init();
  });
}
