import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { environment } from './environments/environment';
import { Config } from '@taiga/data'

function init() {
  void import('./app/app.module').then((m) => {
    platformBrowserDynamic()
      .bootstrapModule(m.AppModule)
      .catch((err) => console.error(err));
  });
}

if (environment.production) {
  enableProdMode();
}

if (environment.configRemote) {
  void fetch(environment.configRemote)
    .then(response => response.json())
    .then((config) => {
      environment.configLocal = config as Config;

      init();
    });
} else {
  document.addEventListener('DOMContentLoaded', () => {
    init();
  });
}

