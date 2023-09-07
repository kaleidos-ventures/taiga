/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { TranslocoDirective } from '@ngneat/transloco';
import { TuiButtonModule } from '@taiga-ui/core';

@Component({
  selector: 'tg-members-pagination',
  standalone: true,
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoDirective, CommonModule, TuiButtonModule],
})
export class PaginationComponent {
  @Input()
  public total!: number;

  @Input()
  public hasPreviousPage!: boolean;

  @Input()
  public hasNextPage!: boolean;

  @Input()
  public pageStart!: number;

  @Input()
  public pageEnd!: number;

  @Output()
  public next = new EventEmitter();

  @Output()
  public previous = new EventEmitter();
}
