/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { zoneConfig } from '@rx-angular/cdk';

zoneConfig.global.disable.requestAnimationFrame();
zoneConfig.global.disable.timers();
zoneConfig.global.disable.XHR();
zoneConfig.global.disable.blocking();
zoneConfig.global.disable.on_property();
zoneConfig.events.disable.UNPATCHED_EVENTS([
  'scroll',
  'mousemove',
  'mouseleave',
  'wheel',
  'focus',
  'blur'
]);
