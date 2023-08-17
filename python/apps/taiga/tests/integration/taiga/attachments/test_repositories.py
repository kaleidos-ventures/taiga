# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import pytest
from taiga.attachments import repositories
from tests.utils import factories as f

pytestmark = pytest.mark.django_db(transaction=True)


#############################################################
# create_attachments
#############################################################


async def test_create_attachment():
    project = await f.create_project()
    story = await f.create_story(project=project)
    user = await f.create_user()
    file = f.build_image_uploadfile(name="test")

    attachment = await repositories.create_attachment(
        file=file,
        created_by=user,
        object=story,
    )

    assert await story.attachments.acount() == 1
    assert attachment.name == file.filename
    assert attachment.content_type == "image/png"
    assert attachment.size == 145


##########################################################
# list_attachments
##########################################################


async def test_list_attachments():
    story1 = await f.create_story()
    story2 = await f.create_story()
    attachment11 = await f.create_attachment(content_object=story1)
    attachment12 = await f.create_attachment(content_object=story1)
    attachment21 = await f.create_attachment(content_object=story2)

    attachments = await repositories.list_attachments()

    assert len(attachments) == 3
    assert attachment12 == attachments[0]
    assert attachment11 == attachments[1]
    assert attachment21 == attachments[2]


async def test_list_attachments_by_content_object():
    story1 = await f.create_story()
    story2 = await f.create_story()
    attachment11 = await f.create_attachment(content_object=story1)
    attachment12 = await f.create_attachment(content_object=story1)
    await f.create_attachment(content_object=story2)

    attachments = await repositories.list_attachments(filters={"content_object": story1})

    assert len(attachments) == 2
    assert attachment12 == attachments[0]
    assert attachment11 == attachments[1]


async def test_list_attachments_paginated_by_content_object():
    story1 = await f.create_story()
    story2 = await f.create_story()
    await f.create_attachment(content_object=story1)
    attachment12 = await f.create_attachment(content_object=story1)
    await f.create_attachment(content_object=story2)

    attachments = await repositories.list_attachments(filters={"content_object": story1}, offset=0, limit=1)

    assert len(attachments) == 1
    assert attachment12 == attachments[0]
