# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import pytest
from asgiref.sync import sync_to_async
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


##########################################################
# get_project_invitations
##########################################################


async def test_get_project_invitations():
    owner = await f.create_user()
    project = await f.create_project(owner=owner)
    general_role = await sync_to_async(project.roles.get)(slug="general")

    user1 = await f.create_user(full_name="AAA")
    await f.create_invitation(email=user1.email, user=user1, project=project, role=general_role, status="pending")
    user2 = await f.create_user(full_name="BBB")
    await f.create_invitation(email=user2.email, user=user2, project=project, role=general_role, status="pending")
    await f.create_invitation(
        email="non-existing@email.com", user=None, project=project, role=general_role, status="pending"
    )
    user = await f.create_user()
    await f.create_invitation(email=user.email, user=user, project=project, role=general_role, status="accepted")

    response = await repositories.get_project_invitations(project_slug=project.slug)
    assert len(response) == 3
    assert response[0].email == user1.email
    assert response[1].email == user2.email
