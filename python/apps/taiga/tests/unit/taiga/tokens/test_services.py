# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from unittest.mock import patch

from taiga.tokens import services

##########################################################
# clean_expired_tokens
##########################################################


async def test_clean_expired_tokens():
    with patch("taiga.tokens.services.tokens_repositories", autospec=True) as fake_tokens_repositories:
        await services.clean_expired_tokens()
        fake_tokens_repositories.clean_expired_tokens.assert_awaited_once()
