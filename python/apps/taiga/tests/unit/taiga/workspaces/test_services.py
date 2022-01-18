# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from unittest.mock import AsyncMock, patch

import pytest
from taiga.workspaces import services
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


##########################################################
# get_my_workspaces_projects
##########################################################


async def test_get_my_workspaces_projects():
    user = await f.create_user()

    with patch("taiga.workspaces.services.workspaces_repo", new_callable=AsyncMock) as fake_workspaces_repo:
        await services.get_user_workspaces_with_latest_projects(user=user)
        fake_workspaces_repo.get_user_workspaces_with_latest_projects.assert_awaited_once_with(user=user)
