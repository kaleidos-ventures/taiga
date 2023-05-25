# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import pytest
from fastapi import status
from tests.utils import factories as f

pytestmark = pytest.mark.django_db(transaction=True)

FULL_PERMISSIONS = {
    "add_story",
    "comment_story",
    "delete_story",
    "modify_story",
    "view_story",
}
NO_ADD_STORY_PERMISSIONS = FULL_PERMISSIONS - {"add_story"}
WRONG_ID = "wrong_id"
WRONG_B64ID = "awu3KvlrEe2h_el7Ht7XHQ"
WRONG_SLUG = "wrong_slug"
WRONG_REF = 9999


##########################################################
# LIST projects/<id>/stories/<ref>/comments
##########################################################


async def test_list_story_comments_200_min_params(client):
    project = await f.create_project()
    story = await f.create_story(project=project)
    await f.create_story_comment(content_object=story, created_by=story.project.created_by, text="comment")

    client.login(story.project.created_by)
    response = client.get(f"/projects/{story.project.b64id}/stories/{story.ref}/comments")
    assert response.status_code == status.HTTP_200_OK, response.text
    assert len(response.json()) == 1


async def test_list_story_comments_200_max_params(client):
    project = await f.create_project()
    story = await f.create_story(project=project)
    await f.create_story_comment(content_object=story, created_by=story.project.created_by, text="comment")

    offset = 0
    limit = 1
    order_params = "order=-createdAt"

    client.login(story.project.created_by)
    response = client.get(
        f"/projects/{story.project.b64id}/stories/{story.ref}/comments?offset={offset}&limit={limit}&{order_params}"
    )
    assert response.status_code == status.HTTP_200_OK, response.text
    assert len(response.json()) == 1
    assert response.headers["Pagination-Offset"] == "0"
    assert response.headers["Pagination-Limit"] == "1"
    assert response.headers["Pagination-Total"] == "1"


async def test_list_story_comments_404_project(client):
    pj_admin = await f.create_user()

    client.login(pj_admin)
    response = client.get(f"/projects/{WRONG_B64ID}/stories/{WRONG_REF}/comments")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_list_story_comments_404_story(client):
    project = await f.create_project()

    client.login(project.created_by)
    response = client.get(f"/projects/{project.b64id}/stories/{WRONG_REF}/comments")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_list_story_comments_422_story(client):
    project = await f.create_project()

    client.login(project.created_by)
    response = client.get(f"/projects/{project.b64id}/stories/{WRONG_REF}/comments")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_list_story_comments_403(client):
    not_allowed_user = await f.create_user()
    project = await f.create_project()
    story = await f.create_story(project=project)
    await f.create_story_comment(content_object=story, created_by=story.project.created_by, text="comment")

    client.login(not_allowed_user)
    response = client.get(f"/projects/{story.project.b64id}/stories/{story.ref}/comments")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text
