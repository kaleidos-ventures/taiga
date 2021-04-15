# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

#!/bin/bash
cat ./dist/elements/runtime-es5.js ./dist/elements/polyfills-es5.js ./dist/elements/main-es5.js > ./dist/elements/elements.js && ls -lah ./dist/elements/elements.js
