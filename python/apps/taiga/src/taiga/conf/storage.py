# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from pydantic import BaseSettings


class StorageSettings(BaseSettings):
    CLEAN_DELETED_STORAGE_OBJECTS_CRON: str = "0 4 * * *"  # default: once a day, at 4:00 AM
    DAYS_TO_STORE_DELETED_STORAGED_OBJECTS: int = 90  # 90 day
