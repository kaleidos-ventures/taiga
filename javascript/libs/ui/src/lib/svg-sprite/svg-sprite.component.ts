/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { TuiSvgService } from '@taiga-ui/core';

@Component({
  selector: 'tg-ui-svg-sprite',
  template: '',
  styleUrls: ['./svg-sprite.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SvgSpriteComponent implements OnChanges {
  @Input()
  public src = '';

  constructor(
    private http: HttpClient,
    private el: ElementRef,
    private svgService: TuiSvgService
  ) {}

  public loadSprite() {
    this.http.get(this.src, { responseType: 'text' }).subscribe((result) => {
      this.svgWrapper.innerHTML = result;
      const svgDefinitions: Record<string, string> = {};
      const symbols = Array.from(this.svgWrapper.querySelectorAll('symbol'));

      symbols.forEach((symbol) => {
        const id = symbol.getAttribute('id');
        const override = symbol.dataset.override;

        if (id) {
          svgDefinitions[id] = symbol.outerHTML;
        }

        if (override) {
          override.split(',').forEach((overrideId) => {
            svgDefinitions[overrideId.trim()] = symbol.outerHTML;
          });
        }
      });

      this.svgService.define(svgDefinitions);
    });
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.src) {
      this.loadSprite();
    }
  }

  public get svgWrapper() {
    return this.el.nativeElement as HTMLElement;
  }
}
