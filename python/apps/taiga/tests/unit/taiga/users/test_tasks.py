# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from unittest.mock import patch

from taiga.users import tasks

##########################################################
# clean_expired_users
##########################################################


async def test_clean_expired_users():
    with patch("taiga.users.tasks.users_services", autospec=True) as fake_users_services:
        await tasks.clean_expired_users(0)
        fake_users_services.clean_expired_users.assert_awaited_once()
