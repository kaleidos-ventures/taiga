/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ClipboardModule } from '@angular/cdk/clipboard';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { TuiLinkModule, TuiSvgModule } from '@taiga-ui/core';
import { CommonTemplateModule } from '~/app/shared/common-template.module';
import { AutoFocusDirective } from '~/app/shared/directives/auto-focus/auto-focus.directive';
import { OutsideClickDirective } from '~/app/shared/directives/outside-click/outside-click.directive';
import { ShortcutDirective } from '~/app/shared/directives/shorcut/shorcut.directive';

@Component({
  selector: 'tg-field-conflict',
  standalone: true,
  imports: [
    CommonTemplateModule,
    TuiSvgModule,
    ClipboardModule,
    ShortcutDirective,
    AutoFocusDirective,
    OutsideClickDirective,
    TuiLinkModule,
  ],
  templateUrl: './field-conflict.component.html',
  styleUrls: ['./field-conflict.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldConflictComponent {
  @Input()
  public username!: string;

  @Input()
  public field!: string;

  @Input()
  public copyValue!: string;

  @Output()
  public cancel = new EventEmitter<void>();

  @Output()
  public accept = new EventEmitter<void>();

  public copied = false;
  public copyView = false;

  public acceptNewVersion() {
    if (this.copied) {
      this.accept.emit();
    } else {
      this.copyView = true;
    }
  }

  public copy() {
    this.copied = true;
  }

  public copyAfterAccept() {
    this.copy();

    setTimeout(() => {
      this.accept.next();
    }, 2000);
  }
}
