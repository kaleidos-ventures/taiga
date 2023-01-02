# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import pytest
from fastapi import status
from tests.utils import factories as f

pytestmark = pytest.mark.django_db(transaction=True)

WRONG_REF = 9999


##########################################################
# GET /projects/<id>/stories/<ref>/assignees
##########################################################


async def test_create_story_assignee_invalid_story(client):
    pj_admin = await f.create_user()
    project = await f.create_project(owner=pj_admin)
    await f.create_story(project=project)

    data = {"username": pj_admin.username}

    client.login(pj_admin)
    response = client.post(f"/projects/{project.b64id}/stories/{WRONG_REF}/assignees", json=data)
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_create_story_assignee_user_without_permissions(client):
    user = await f.create_user()
    pj_admin = await f.create_user()
    project = await f.create_project(owner=pj_admin)
    story = await f.create_story(project=project)

    data = {"username": pj_admin.username}

    client.login(user)
    response = client.post(f"/projects/{project.b64id}/stories/{story.ref}/assignees", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_create_story_assignee_ok(client):
    pj_admin = await f.create_user()
    project = await f.create_project(owner=pj_admin)
    story = await f.create_story(project=project)

    data = {"username": pj_admin.username}

    client.login(pj_admin)
    response = client.post(f"/projects/{project.b64id}/stories/{story.ref}/assignees", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text
