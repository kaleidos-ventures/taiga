/**
 * Copyright (c) 2014-2021 Taiga Agile LLC
 *
 * This source code is licensed under the terms of the
 * GNU Affero General Public License found in the LICENSE file in
 * the root directory of this source tree.
 */

import { ApiUtilsService } from './api-utils.service';

describe('ApiUtilsService', () => {
  it('transform object to HttpParams with param3 key transformation', () => {
    const params = {
      param1: 1,
      param2: 'test',
      param3: [1, 'two'],
      param4: false,
      param5: undefined,
      param6: null,
    };

    const keyMap = {
      param3: 'Param3',
    };

    expect(
      ApiUtilsService.buildQueryParams(params, keyMap).toString()
    ).toEqual(`param1=1&param2=test&Param3=1,two&param4=false&param5=undefined&param6=null`);
  });

  it('transform object to FormData with param3 key transformation', () => {
    const params = {
      param1: 1,
      param2: 'test',
      param3: [1, 'two'],
      param4: false,
      param5: undefined,
      param6: null,
      param7: new File([], 'test.png'),
    };

    const keyMap = {
      param3: 'Param3',
    };

    const formData = ApiUtilsService.buildFormData(params, keyMap);

    expect(formData.get('param1')).toEqual(params.param1.toString());
    expect(formData.get('param2')).toEqual(params.param2);
    expect(formData.get('Param3')).toEqual(params.param3.join(','));
    expect(formData.get('param4')).toEqual(params.param4.toString());
    expect(formData.get('param5')).toEqual('undefined');
    expect(formData.get('param6')).toEqual('null');
    expect(formData.get('param7')).toBeInstanceOf(File);
    expect((formData.get('param7') as File).name).toEqual('test.png');
  });
});
