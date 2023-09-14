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
import { TranslocoModule } from '@ngneat/transloco';
import { TuiButtonModule } from '@taiga-ui/core';

import { CommonModule, NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'tg-kanban-empty',
  templateUrl: './kanban-empty.component.html',
  styleUrls: ['./kanban-empty.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TranslocoModule, TuiButtonModule, CommonModule, NgOptimizedImage],
})
export class KanbanEmptyComponent {
  @Input()
  public userIsAdmin = false;

  @Output()
  public addStatus = new EventEmitter<void>();

  public add() {
    this.addStatus.next();
  }
}
