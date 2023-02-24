# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from unittest.mock import patch

from taiga.tokens import tasks

##########################################################
# clean_expired_tokens
##########################################################


async def test_clean_expired_tokens():
    with patch("taiga.tokens.tasks.tokens_services", autospec=True) as fake_tokens_services:
        await tasks.clean_expired_tokens(0)
        fake_tokens_services.clean_expired_tokens.assert_awaited_once()
