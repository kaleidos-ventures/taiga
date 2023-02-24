/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnInit,
} from '@angular/core';
import { TuiSizeL, TuiSizeM, TuiSizeS } from '@taiga-ui/core';

export type Swatches =
  | 'primary'
  | 'secondary'
  | 'white'
  | 'black'
  | 'gray'
  | 'info'
  | 'green'
  | 'ok'
  | 'yellow'
  | 'warning'
  | 'red'
  | 'notice';

@Component({
  selector: 'tg-ui-badge',
  templateUrl: './badge.component.html',
  styleUrls: ['./badge.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeComponent implements OnInit {
  @Input()
  public label = '';

  @Input()
  public icon = '';

  @Input()
  public color = '';

  @Input()
  public size: TuiSizeS | TuiSizeM | TuiSizeL = 'm';

  constructor(private elementRef: ElementRef) {}

  public ngOnInit(): void {
    const element = this.elementRef.nativeElement as HTMLElement;
    element.style.setProperty('--badge-color', `var(--color-${this.color}80)`);
    element.style.setProperty(
      '--badge-background',
      `var(--color-${this.color}10)`
    );
    element.style.setProperty('--badge-icon', `var(--color-${this.color}60)`);
  }
}
