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
import { map } from 'rxjs';
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
      const { attachments, loadingAttachments, page } = state;
      const list = [...loadingAttachments, ...attachments];

      return {
        page,
        paginationItems: state.paginationItems,
        total: list.length,
        folded: state.folded,
        canEdit: state.canEdit,
        pages: Math.ceil(list.length / ATTACHMENTS_PER_PAGE),
        list: list.slice(
          page * ATTACHMENTS_PER_PAGE,
          (page + 1) * ATTACHMENTS_PER_PAGE
        ),
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
}
