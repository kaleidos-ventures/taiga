/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Pipe, PipeTransform, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import prettyBytes from 'pretty-bytes';
import { LanguageService } from '~/app/services/language/language.service';

@Pipe({ name: 'transformSize', standalone: true })
export class TransformSizePipe implements PipeTransform {
  public languageService = inject(LanguageService);
  public lan!: string;

  constructor() {
    this.languageService
      .getUserLanguage()
      .pipe(takeUntilDestroyed())
      .subscribe((lan) => {
        this.lan = lan.code;
      });
  }

  public transform(size: number) {
    return prettyBytes(size, { locale: this.lan });
  }
}
