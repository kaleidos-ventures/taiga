# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import pytest
from asgiref.sync import sync_to_async
from fastapi import status
from taiga.base.utils.datetime import aware_utcnow
from taiga.comments import repositories as comments_repositories
from tests.utils import factories as f

pytestmark = pytest.mark.django_db(transaction=True)


WRONG_B64ID = "-----wrong_b64id------"
WRONG_REF = 0


##########################################################
# POST projects/<id>/stories/<ref>/comments
##########################################################


async def test_create_story_comment_success(client):
    project = await f.create_project()
    story = await f.create_story(project=project)

    data = {"text": "<p>Sample comment</p>"}

    client.login(story.project.created_by)
    response = client.post(f"/projects/{story.project.b64id}/stories/{story.ref}/comments", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_create_story_comment_error_nonexistent_project(client):
    user = await f.create_user()
    story = await f.create_story()

    data = {"text": "<p>Sample comment</p>"}

    client.login(user)
    response = client.post(f"/projects/{WRONG_B64ID}/stories/{story.ref}/comments", json=data)
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_create_story_comment_error_nonexistent_story(client):
    project = await f.create_project()

    data = {"text": "<p>Sample comment</p>"}

    client.login(project.created_by)
    response = client.post(f"/projects/{project.b64id}/stories/{WRONG_REF}/comments", json=data)
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_create_story_comment_error_invalid_form(client):
    project = await f.create_project()

    data = {"invalid_param": "<p>Sample comment</p>"}

    client.login(project.created_by)
    response = client.post(f"/projects/{project.b64id}/stories/{WRONG_REF}/comments", json=data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text


##########################################################
# GET projects/<id>/stories/<ref>/comments
##########################################################


async def test_list_story_comments_success(client):
    project = await f.create_project()
    story = await f.create_story(project=project)
    await f.create_comment(content_object=story, created_by=story.project.created_by, text="comment")

    client.login(story.project.created_by)
    response = client.get(f"/projects/{story.project.b64id}/stories/{story.ref}/comments")
    assert response.status_code == status.HTTP_200_OK, response.text
    assert len(response.json()) == 1


async def test_list_story_comments_success_with_custom_pagination(client):
    project = await f.create_project()
    story = await f.create_story(project=project)
    await f.create_comment(content_object=story, created_by=story.project.created_by, text="comment")

    offset = 0
    limit = 1
    order = "-createdAt"
    query_params = f"offset={offset}&limit={limit}&order={order}"

    client.login(story.project.created_by)
    response = client.get(f"/projects/{story.project.b64id}/stories/{story.ref}/comments?{query_params}")
    assert response.status_code == status.HTTP_200_OK, response.text
    assert len(response.json()) == 1
    assert response.headers["Pagination-Offset"] == "0"
    assert response.headers["Pagination-Limit"] == "1"
    assert response.headers["Pagination-Total"] == "1"


async def test_list_story_comments_error_nonexistent_project(client):
    user = await f.create_user()

    client.login(user)
    response = client.get(f"/projects/{WRONG_B64ID}/stories/{WRONG_REF}/comments")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_list_story_comments_error_nonexistent_story(client):
    project = await f.create_project()

    client.login(project.created_by)
    response = client.get(f"/projects/{project.b64id}/stories/{WRONG_REF}/comments")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_list_story_comments_error_no_permissions(client):
    not_allowed_user = await f.create_user()
    project = await f.create_project()
    story = await f.create_story(project=project)

    client.login(not_allowed_user)
    response = client.get(f"/projects/{story.project.b64id}/stories/{story.ref}/comments")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_list_story_comments_error_invalid_order(client):
    project = await f.create_project()
    story = await f.create_story(project=project)
    await f.create_comment(content_object=story, created_by=story.project.created_by, text="comment")

    order = "-id"
    query_params = f"order={order}"

    client.login(story.project.created_by)
    response = client.get(f"/projects/{story.project.b64id}/stories/{story.ref}/comments?{query_params}")
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text


##########################################################
# PATCH projects/<id>/stories/<ref>/comments/<id>
##########################################################


async def test_update_story_comment_success(client):
    project = await f.create_project()
    story = await f.create_story(project=project, created_by=project.created_by)
    comment = await f.create_comment(content_object=story, created_by=story.created_by)

    data = {"text": "Updated comment"}

    client.login(story.created_by)
    response = client.patch(f"/projects/{story.project.b64id}/stories/{story.ref}/comments/{comment.b64id}", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_update_story_comment_error_nonexistent_project(client):
    project = await f.create_project()
    story = await f.create_story(project=project, created_by=project.created_by)
    comment = await f.create_comment(content_object=story, created_by=story.created_by)

    data = {"text": "Updated comment"}

    client.login(story.created_by)
    response = client.patch(f"/projects/{WRONG_B64ID}/stories/{story.ref}/comments/{comment.b64id}", json=data)
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_update_story_comment_error_nonexistent_story(client):
    project = await f.create_project()
    story = await f.create_story(project=project, created_by=project.created_by)
    comment = await f.create_comment(content_object=story, created_by=story.created_by)

    data = {"text": "Updated comment"}

    client.login(story.created_by)
    response = client.patch(f"/projects/{story.project.b64id}/stories/{WRONG_REF}/comments/{comment.b64id}", json=data)
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_update_story_comment_error_nonexistent_comment(client):
    project = await f.create_project()
    story = await f.create_story(project=project, created_by=project.created_by)
    await f.create_comment(content_object=story, created_by=story.created_by)

    data = {"text": "Updated comment"}

    client.login(story.created_by)
    response = client.patch(f"/projects/{story.project.b64id}/stories/{story.ref}/comments/{WRONG_B64ID}", json=data)
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_update_story_comment_error_no_permissions(client):
    not_allowed_user = await f.create_user()
    project = await f.create_project()
    story = await f.create_story(project=project, created_by=project.created_by)
    comment = await f.create_comment(content_object=story, created_by=story.created_by)

    data = {"text": "Updated comment"}

    client.login(not_allowed_user)
    response = client.patch(f"/projects/{story.project.b64id}/stories/{story.ref}/comments/{comment.b64id}", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_update_story_comment_error_deleted_comment(client):
    project = await f.create_project()
    story = await f.create_story(project=project, created_by=project.created_by)
    comment = await f.create_comment(content_object=story, created_by=story.created_by)
    await comments_repositories.update_comment(
        comment=comment,
        values={
            "text": "",
            "deleted_by": story.created_by,
            "deleted_at": aware_utcnow(),
        },
    )

    data = {"text": "Updated comment"}

    client.login(story.created_by)
    response = client.patch(f"/projects/{story.project.b64id}/stories/{story.ref}/comments/{comment.b64id}", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


##########################################################
# DELETE projects/<id>/stories/<ref>/comments/<id>
##########################################################


async def test_delete_story_comments_success_with_admin_user(client):
    project = await f.create_project()
    admin_user = project.created_by
    owner_user = await f.create_user()
    story = await f.create_story(project=project)
    comment = await f.create_comment(content_object=story, created_by=owner_user, text="comment")

    assert await comments_repositories.get_comment(filters={"id": comment.id}) == comment
    client.login(admin_user)
    response = client.delete(f"/projects/{story.project.b64id}/stories/{story.ref}/comments/{comment.b64id}")
    assert response.status_code == status.HTTP_200_OK, response.text
    assert response.json()["text"] == ""


async def test_delete_story_comments_success_with_owner_user(client):
    project = await f.create_project()
    generic_role = await project.roles.aget(is_admin=False)
    owner_user = await f.create_user()
    await f.create_project_membership(user=owner_user, role=generic_role)
    story = await f.create_story(project=project)
    comment = await f.create_comment(content_object=story, created_by=owner_user, text="comment")

    assert await comments_repositories.get_comment(filters={"id": comment.id}) == comment
    client.login(owner_user)
    response = client.delete(f"/projects/{story.project.b64id}/stories/{story.ref}/comments/{comment.b64id}")
    assert response.status_code == status.HTTP_200_OK, response.text
    assert response.json()["text"] == ""


async def test_delete_story_comment_error_no_permissions(client):
    project = await f.create_project()
    generic_role = await project.roles.aget(is_admin=False)
    owner_user = await f.create_user()
    await f.create_project_membership(user=owner_user, role=generic_role)
    member_user = await f.create_user()
    await f.create_project_membership(user=member_user, role=generic_role)
    story = await f.create_story(project=project)
    comment = await f.create_comment(content_object=story, created_by=owner_user, text="comment")

    assert await comments_repositories.get_comment(filters={"id": comment.id}) == comment
    client.login(member_user)
    response = client.delete(f"/projects/{story.project.b64id}/stories/{story.ref}/comments/{comment.b64id}")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_delete_story_comments_error_deleted_comment(client):
    project = await f.create_project()
    admin_user = project.created_by
    owner_user = await f.create_user()
    story = await f.create_story(project=project)
    comment = await f.create_comment(content_object=story, created_by=owner_user, text="comment")
    await comments_repositories.update_comment(
        comment=comment,
        values={
            "text": "",
            "deleted_by": owner_user,
            "deleted_at": aware_utcnow(),
        },
    )

    assert await comments_repositories.get_comment(filters={"id": comment.id}) == comment
    client.login(admin_user)
    response = client.delete(f"/projects/{story.project.b64id}/stories/{story.ref}/comments/{comment.b64id}")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_delete_story_comment_error_no_comment_permissions(client):
    project = await f.create_project()
    generic_role = await project.roles.aget(is_admin=False)
    member_user = await f.create_user()
    await f.create_project_membership(user=member_user, role=generic_role)
    story = await f.create_story(project=project)
    comment = await f.create_comment(content_object=story, created_by=member_user, text="comment")
    assert await comments_repositories.get_comment(filters={"id": comment.id}) == comment

    # remove can comment permissions
    generic_role.permissions = ["view_story"]
    await sync_to_async(generic_role.save)()

    client.login(member_user)
    response = client.delete(f"/projects/{story.project.b64id}/stories/{story.ref}/comments/{comment.b64id}")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text
    assert await comments_repositories.get_comment(filters={"id": comment.id}) == comment


async def test_delete_story_comments_error_nonexistent_project(client):
    user = await f.create_user()

    client.login(user)
    response = client.delete(f"/projects/{WRONG_B64ID}/stories/{WRONG_REF}/comments/{WRONG_B64ID}")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_delete_story_comments_error_nonexistent_404_story(client):
    project = await f.create_project()

    client.login(project.created_by)
    response = client.delete(f"/projects/{project.b64id}/stories/{WRONG_REF}/comments/{WRONG_B64ID}")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_delete_story_comments_error_nonexistent_404_comment(client):
    project = await f.create_project()
    story = await f.create_story(project=project)

    client.login(project.created_by)
    response = client.delete(f"/projects/{project.b64id}/stories/{story.ref}/comments/{WRONG_B64ID}")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text
