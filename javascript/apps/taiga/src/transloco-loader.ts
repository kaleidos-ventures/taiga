import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TranslocoLoader, Translation } from '@ngneat/transloco';
import cacheBusting from '~/assets/i18n/i18n-cache-busting.json';

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
