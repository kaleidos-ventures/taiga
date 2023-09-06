# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from datetime import timedelta
from unittest.mock import call, patch

from taiga.base.utils.datetime import aware_utcnow
from taiga.commons.storage import services
from tests.utils import factories as f


async def test_clean_deleted_storaged_objects():
    storaged_objects = [
        f.build_storaged_object(),
        f.build_storaged_object(),
    ]
    before_datetime = aware_utcnow() - timedelta(days=1)

    with patch("taiga.commons.storage.services.storage_repositories", autospec=True) as fake_storage_repositories:
        fake_storage_repositories.list_storaged_objects.return_value = storaged_objects
        fake_storage_repositories.delete_storaged_object.return_value = True

        assert await services.clean_deleted_storaged_objects(before=before_datetime) == 2

        fake_storage_repositories.list_storaged_objects.assert_awaited_once_with(
            filters={"deleted_before": before_datetime}
        )

        fake_storage_repositories.delete_storaged_object.assert_has_awaits(
            [
                call(storaged_objects[0]),
                call(storaged_objects[1]),
            ],
        )
