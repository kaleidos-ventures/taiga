/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { HttpClient } from '@angular/common/http';
import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

@Component({
  selector: 'tg-ui-svg-sprite',
  template: '',
  styleUrls: ['./svg-sprite.component.css'],
})
export class SvgSpriteComponent implements OnChanges {
  @Input()
  public src = '';

  constructor(private http: HttpClient, private el: ElementRef) {}

  public loadSprite() {
    this.http.get(this.src, { responseType: 'text' }).subscribe((result) => {
      (this.el.nativeElement as HTMLElement).innerHTML = result;
    });
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.src) {
      this.loadSprite();
    }
  }
}
