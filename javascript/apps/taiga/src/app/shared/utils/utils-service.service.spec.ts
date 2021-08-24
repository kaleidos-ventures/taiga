/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { UtilsService } from './utils-service.service';

describe('UtilsService', () => {
  it('transform object to FormData with param3 key transformation', () => {
    const params = {
      url: 'test',
      body: {
        theUser: {
          user_id: 3,
          permissions: [
            'test1',
            'test2',
            'test3',
          ],
          contacts: [
            { user_name: 'Contact1'},
            { user_name: 'Contact2'},
          ],
        },
      },
    };

    const transformedObj = UtilsService.objKeysTransformer(params, (x: string) => x.toUpperCase());

    expect(transformedObj).toEqual({
      URL: 'test',
      BODY: {
        THEUSER: {
          USER_ID: 3,
          PERMISSIONS: [
            'test1',
            'test2',
            'test3',
          ],
          CONTACTS: [
            { USER_NAME: 'Contact1'},
            { USER_NAME: 'Contact2'},
          ],
        },
      },
    });
  });
});
