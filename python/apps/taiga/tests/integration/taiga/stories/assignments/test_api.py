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
# GET /projects/<id>/stories/<ref>/assignments
##########################################################


async def test_create_story_assignment_invalid_story(client):
    pj_admin = await f.create_user()
    project = await f.create_project(owner=pj_admin)
    await f.create_story(project=project)

    data = {"username": pj_admin.username}

    client.login(pj_admin)
    response = client.post(f"/projects/{project.b64id}/stories/{WRONG_REF}/assignments", json=data)
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_create_story_assignment_user_without_permissions(client):
    user = await f.create_user()
    pj_admin = await f.create_user()
    project = await f.create_project(owner=pj_admin)
    story = await f.create_story(project=project)

    data = {"username": pj_admin.username}

    client.login(user)
    response = client.post(f"/projects/{project.b64id}/stories/{story.ref}/assignments", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_create_story_assignment_ok(client):
    pj_admin = await f.create_user()
    project = await f.create_project(owner=pj_admin)
    story = await f.create_story(project=project)

    data = {"username": pj_admin.username}

    client.login(pj_admin)
    response = client.post(f"/projects/{project.b64id}/stories/{story.ref}/assignments", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text


##########################################################
# DELETE /projects/<id>/stories/<ref>/assignments/<username>
##########################################################


async def test_delete_story_assignment_invalid_story(client):
    pj_admin = await f.create_user()
    project = await f.create_project(owner=pj_admin)
    story = await f.create_story(project=project)
    await f.create_story_assignment(story=story, user=pj_admin)

    client.login(pj_admin)
    response = client.delete(f"/projects/{project.b64id}/stories/{WRONG_REF}/assignments/{pj_admin.username}")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_delete_story_assignment_user_without_permissions(client):
    user = await f.create_user()
    pj_admin = await f.create_user()
    project = await f.create_project(owner=pj_admin)
    story = await f.create_story(project=project)
    await f.create_story_assignment(story=story, user=pj_admin)

    client.login(user)
    response = client.delete(f"/projects/{project.b64id}/stories/{story.ref}/assignments/{pj_admin.username}")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_delete_story_assignment_user_not_assigned(client):
    user = await f.create_user()
    pj_admin = await f.create_user()
    project = await f.create_project(owner=pj_admin)
    story = await f.create_story(project=project)
    await f.create_story_assignment(story=story, user=pj_admin)

    client.login(pj_admin)
    response = client.delete(f"/projects/{project.b64id}/stories/{story.ref}/assignments/{user.username}")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_delete_story_assignment_ok(client):
    pj_admin = await f.create_user()
    project = await f.create_project(owner=pj_admin)
    story = await f.create_story(project=project)
    await f.create_story_assignment(story=story, user=pj_admin)

    client.login(pj_admin)
    response = client.delete(f"/projects/{project.b64id}/stories/{story.ref}/assignments/{pj_admin.username}")
    assert response.status_code == status.HTTP_204_NO_CONTENT, response.text
