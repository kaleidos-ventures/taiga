# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import pytest
from fastapi import status
from tests.utils import factories as f
from tests.utils.bad_params import INVALID_B64ID, INVALID_REF, NOT_EXISTING_B64ID, NOT_EXISTING_REF

pytestmark = pytest.mark.django_db(transaction=True)


##########################################################
# POST /projects/<b64id>/stories/<ref>/stories/mediafiles
##########################################################


async def test_create_story_mediafile_200_ok(client):
    project = await f.create_project()
    story = await f.create_story(project=project)
    user = project.created_by
    file1 = f.build_image_file("image1")
    file2 = f.build_image_file("image2")
    file3 = f.build_image_file("image3")

    files = [
        ("files", (file1.name, file1, "image/png")),
        ("files", (file2.name, file2, "image/png")),
        ("files", (file3.name, file3, "image/png")),
    ]

    client.login(user)
    response = client.post(
        f"/projects/{project.b64id}/stories/{story.ref}/mediafiles",
        files=files,
    )
    assert response.status_code == status.HTTP_200_OK, response.text
    assert len(response.json()) == 3


async def test_create_story_mediafile_403_forbidden_error_no_permissions(client):
    project = await f.create_project(public_permissions=[])
    story = await f.create_story(project=project)
    user = await f.create_user()
    file = f.build_image_file("image")

    files = [
        ("files", (file.name, file, "image/png")),
    ]

    client.login(user)
    response = client.post(
        f"/projects/{project.b64id}/stories/{story.ref}/mediafiles",
        files=files,
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_create_story_mediafile_404_not_found_project_b64id(client):
    project = await f.create_project()
    story = await f.create_story(project=project)
    user = project.created_by
    file = f.build_image_file("image")

    files = [
        ("files", (file.name, file, "image/png")),
    ]

    client.login(user)
    response = client.post(
        f"/projects/{NOT_EXISTING_B64ID}/stories/{story.ref}/mediafiles",
        files=files,
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_create_story_mediafile_404_not_found_story_ref(client):
    project = await f.create_project()
    user = project.created_by
    file = f.build_image_file("image")

    files = [
        ("files", (file.name, file, "image/png")),
    ]

    client.login(user)
    response = client.post(
        f"/projects/{project.b64id}/stories/{NOT_EXISTING_REF}/mediafiles",
        files=files,
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_create_story_mediafile_422_unprocessable_entity_project_b64id(client):
    project = await f.create_project()
    story = await f.create_story(project=project)
    user = project.created_by
    file = f.build_image_file("image")

    files = [
        ("files", (file.name, file, "image/png")),
    ]

    client.login(user)
    response = client.post(
        f"/projects/{INVALID_B64ID}/stories/{story.ref}/mediafiles",
        files=files,
    )
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text


async def test_create_story_mediafile_422_unprocessable_entity_story_ref(client):
    project = await f.create_project()
    user = project.created_by
    file = f.build_image_file("image")

    files = [
        ("files", (file.name, file, "image/png")),
    ]

    client.login(user)
    response = client.post(
        f"/projects/{project.b64id}/stories/{INVALID_REF}/mediafiles",
        files=files,
    )
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text


async def test_create_story_mediafile_422_unprocessable_entity_bad_request(client):
    project = await f.create_project()
    story = await f.create_story(project=project)
    user = project.created_by

    client.login(user)
    response = client.post(
        f"/projects/{project.b64id}/stories/{story.ref}/mediafiles",
    )
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text
