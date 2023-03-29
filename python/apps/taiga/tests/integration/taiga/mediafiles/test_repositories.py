# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import pytest
from taiga.mediafiles import repositories
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


#############################################################
# create_mediafiles
#############################################################


async def test_create_mediafiles_not_associated_to_an_object():
    project = await f.create_project()
    user = await f.create_user()
    files = [f.build_image_uploadfile(name="test1"), f.build_string_uploadfile(name="tests2", content="tests")]

    mediafile = await repositories.create_mediafiles(files=files, project=project, created_by=user)
    assert len(mediafile) == 2
    assert await project.mediafiles.acount() == 2

    assert mediafile[0].name == files[0].filename
    assert mediafile[0].content_type == "image/png"
    assert mediafile[0].size == 145

    assert mediafile[1].name == files[1].filename
    assert mediafile[1].content_type == "text/plain"
    assert mediafile[1].size == 5


async def test_create_mediafiles_associated_to_an_object():
    project = await f.create_project()
    story = await f.create_story(project=project)
    user = await f.create_user()

    files = [f.build_image_uploadfile(name="test1"), f.build_string_uploadfile(name="test2", content="tests")]

    mediafile = await repositories.create_mediafiles(
        files=files,
        project=project,
        created_by=user,
        object=story,
    )
    assert len(mediafile) == 2
    assert await project.mediafiles.acount() == 2
    assert await story.mediafiles.acount() == 2

    assert mediafile[0].name == files[0].filename
    assert mediafile[0].content_type == "image/png"
    assert mediafile[0].size == 145

    assert mediafile[1].name == files[1].filename
    assert mediafile[1].content_type == "text/plain"
    assert mediafile[1].size == 5
