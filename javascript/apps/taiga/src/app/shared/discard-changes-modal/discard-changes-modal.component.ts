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
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalModule } from '@taiga/ui/modal';
import { CommonTemplateModule } from '../common-template.module';
import { TuiLinkModule } from '@taiga-ui/core';
import { RestoreFocusDirective } from '../directives/restore-focus/restore-focus.directive';

@Component({
  selector: 'tg-discard-changes-modal',
  standalone: true,
  imports: [
    CommonModule,
    ModalModule,
    CommonTemplateModule,
    TuiLinkModule,
    RestoreFocusDirective,
  ],
  templateUrl: './discard-changes-modal.component.html',
  styleUrls: ['./discard-changes-modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiscardChangesModalComponent {
  @Input()
  public open = false;

  @Output()
  public discard = new EventEmitter<void>();

  @Output()
  public cancel = new EventEmitter<void>();
}
