# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from datetime import datetime

from taiga.commons.storage import repositories as storage_repositories


async def clean_deleted_storaged_objects(before: datetime) -> int:
    storaged_objects = await storage_repositories.list_storaged_objects(filters={"deleted_before": before})
    deleted = 0
    for storaged_object in storaged_objects:
        if await storage_repositories.delete_storaged_object(storaged_object=storaged_object):
            deleted += 1

    return deleted
