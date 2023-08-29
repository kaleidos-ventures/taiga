/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Injectable, inject } from '@angular/core';
import { RxState } from '@rx-angular/state';
import { Attachment, LoadingAttachment } from '@taiga/data';
import { Subject, map } from 'rxjs';
import { LocalStorageService } from '../local-storage/local-storage.service';

interface State {
  attachments: Attachment[];
  loadingAttachments: LoadingAttachment[];
  page: number;
  folded: boolean;
  paginationItems: number;
  showSizeError: string[];
  canEdit: boolean;
}

const ATTACHMENTS_PER_PAGE = 10;

@Injectable()
export class AttachmentsState extends RxState<State> {
  public localStorageService = inject(LocalStorageService);

  public paginatedList$ = this.select().pipe(
    map((state) => {
      const { attachments, loadingAttachments } = state;
      const list = [...loadingAttachments, ...attachments];
      let { page } = state;

      const totalPages = Math.ceil(list.length / ATTACHMENTS_PER_PAGE);

      if (page >= totalPages) {
        page = totalPages - 1;
      }

      const pageList = list.slice(
        page * ATTACHMENTS_PER_PAGE,
        (page + 1) * ATTACHMENTS_PER_PAGE
      );

      return {
        page,
        paginationItems: state.paginationItems,
        total: list.length,
        folded: state.folded,
        canEdit: state.canEdit,
        pages: totalPages,
        list: pageList,
      };
    })
  );

  constructor() {
    super();

    this.select('folded').subscribe((folded) => {
      this.localStorageService.set('attachments-folded', folded);
    });

    this.set({
      attachments: [],
      loadingAttachments: [],
      page: 0,
      folded: this.localStorageService.get('attachments-folded') ?? false,
      paginationItems: 9,
      canEdit: true,
    });
  }

  public deleteAttachment$ = new Subject<Attachment['id']>();
}
