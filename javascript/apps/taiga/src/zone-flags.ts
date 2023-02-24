/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { zoneConfig } from '@rx-angular/cdk/zone-configurations';

zoneConfig.global.disable.XHR();
zoneConfig.global.disable.blocking();
zoneConfig.global.disable.on_property();
zoneConfig.events.disable.UNPATCHED_EVENTS(['scroll', 'wheel']);
