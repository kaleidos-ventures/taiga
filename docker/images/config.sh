#!/bin/sh

# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

FILE=/usr/share/nginx/html/assets/config.json
if [ ! -f "$FILE" ]; then
    gomplate -f /config.json.template -o /usr/share/nginx/html/assets/config.json
    echo "Configuration with env vars done."
else
    echo "config.json file found. Skipping configuration with env vars."
fi
