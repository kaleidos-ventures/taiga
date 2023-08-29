/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { cold } from 'jest-marbles';
import { AttachmentsState } from './attachments.state';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { AttachmentMockFactory } from '@taiga/data';

describe('AttachmentsState', () => {
  let spectator: SpectatorService<AttachmentsState>;
  let service: AttachmentsState;

  const createService = createServiceFactory({
    service: AttachmentsState,
    mocks: [LocalStorageService],
  });

  beforeEach(() => {
    spectator = createService();
    service = spectator.inject(AttachmentsState);
  });

  it('fist page attachments', () => {
    const attachments = Array.from({ length: 20 }, () =>
      AttachmentMockFactory()
    );

    service.set({
      attachments,
    });

    expect(service.paginatedList$).toBeObservable(
      cold('a', {
        a: {
          page: 0,
          paginationItems: 9,
          total: 20,
          folded: false,
          canEdit: true,
          pages: 2,
          list: attachments.slice(0, 10),
        },
      })
    );
  });

  it('current page is exceeds total pages', () => {
    const attachments = Array.from({ length: 20 }, () =>
      AttachmentMockFactory()
    );

    service.set({
      attachments,
      page: 3,
    });

    expect(service.paginatedList$).toBeObservable(
      cold('a', {
        a: {
          page: 1,
          paginationItems: 9,
          total: 20,
          folded: false,
          canEdit: true,
          pages: 2,
          list: attachments.slice(10, 20),
        },
      })
    );
  });
});
