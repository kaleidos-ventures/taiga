# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from unittest.mock import patch

import pytest
from taiga.workspaces import services
from tests.utils import factories as f

pytestmark = pytest.mark.django_db

##########################################################
# get_my_workspaces_projects
##########################################################


def test_get_my_workspaces_projects():
    user = f.UserFactory()

    with patch("taiga.workspaces.services.workspaces_repo") as fake_workspaces_repo:
        services.get_user_workspaces_with_latest_projects(user=user)
        assert fake_workspaces_repo.get_user_workspaces_with_latest_projects.called_once_with(user)
