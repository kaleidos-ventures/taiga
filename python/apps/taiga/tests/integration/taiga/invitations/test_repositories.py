# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import pytest
from taiga.invitations import repositories
from taiga.invitations.models import Invitation
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


async def test_create_invitations():
    user = await f.create_user()
    user2 = await f.create_user()
    project = await f.create_project(owner=user)
    role = await f.create_role(project=project)
    role2 = await f.create_role(project=project)
    objs = [
        Invitation(
            user=user2,
            project=project,
            role=role,
            email=user2.email,
            invited_by=user,
        ),
        Invitation(
            user=None,
            project=project,
            role=role2,
            email="test@email.com",
            invited_by=user,
        ),
    ]
    response = await repositories.create_invitations(objs=objs)
    assert len(response) == 2
