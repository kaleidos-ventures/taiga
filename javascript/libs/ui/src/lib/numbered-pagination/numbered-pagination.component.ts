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
  OnChanges,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@ngneat/transloco';
import { TuiButtonModule } from '@taiga-ui/core';

@Component({
  selector: 'tg-ui-numbered-pagination',
  standalone: true,
  imports: [CommonModule, TranslocoModule, TuiButtonModule],
  templateUrl: './numbered-pagination.component.html',
  styleUrls: ['./numbered-pagination.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NumberedPaginationComponent implements OnChanges {
  @Input()
  public maxPageElements = 9;

  @Input({ required: true })
  public currentPage!: number;

  @Input({ required: true })
  public totalPages!: number;

  @Output()
  public pageChange = new EventEmitter<number>();

  public hasPreviousPage = false;
  public hasNextPage = false;
  public pages: (number | null)[] = [];

  public ngOnChanges(): void {
    if (this.maxPageElements && this.totalPages) {
      const numPages = Array.from({ length: this.totalPages }, (_, i) => i);
      let finalPages = numPages as (number | null)[];
      const maxPageElements =
        this.maxPageElements >= 5 ? this.maxPageElements : 5;
      const diff = maxPageElements - 2;

      if (this.totalPages > maxPageElements) {
        if (this.currentPage < diff) {
          finalPages = [...numPages.slice(0, diff), null, this.totalPages - 1];
        } else if (this.totalPages - this.currentPage < diff) {
          finalPages = [0, null, ...numPages.slice(-diff)];
        } else {
          const middle = this.maxPageElements - 4;
          const middlePages = [];

          for (
            let i = -Math.floor(middle / 2);
            i < Math.ceil(middle / 2);
            i++
          ) {
            middlePages.push(this.currentPage + i);
          }

          finalPages = [0, null, ...middlePages, null, this.totalPages - 1];
        }
      }

      this.hasNextPage = this.currentPage < this.totalPages - 1;
      this.hasPreviousPage = this.currentPage > 0;
      this.pages = finalPages;
    }
  }

  public trackByIndex(index: number) {
    return index;
  }

  public setPage(page: number) {
    this.pageChange.next(page);
  }
}
