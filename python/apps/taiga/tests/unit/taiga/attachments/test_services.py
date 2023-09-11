# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import uuid
from unittest.mock import AsyncMock, patch

import pytest
from taiga.attachments import services
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


#####################################################
# create_attachment
#####################################################


async def test_create_attachment():
    story = f.build_story()
    uploadfiles = (f.build_image_uploadfile(),)
    attachment = f.build_attachment()

    with (
        patch("taiga.attachments.services.attachments_repositories", autospec=True) as fake_attachments_repositories,
    ):
        fake_attachments_repositories.create_attachment.return_value = attachment

        data = await services.create_attachment(
            file=uploadfiles,
            created_by=attachment.created_by,
            object=story,
        )

        assert data == attachment
        fake_attachments_repositories.create_attachment.assert_awaited_once_with(
            file=uploadfiles,
            created_by=attachment.created_by,
            object=story,
        )


async def test_create_attachment_and_emit_event_on_create():
    project = f.build_project()
    story = f.build_story(project=project)
    fake_event_on_create = AsyncMock()
    uploadfiles = (f.build_image_uploadfile(),)
    attachment = f.build_attachment()

    with (
        patch("taiga.attachments.services.attachments_repositories", autospec=True) as fake_attachments_repositories,
    ):
        fake_attachments_repositories.create_attachment.return_value = attachment

        await services.create_attachment(
            file=uploadfiles,
            created_by=attachment.created_by,
            object=story,
            event_on_create=fake_event_on_create,
        )

        fake_attachments_repositories.create_attachment.assert_awaited_once_with(
            file=uploadfiles,
            created_by=attachment.created_by,
            object=story,
        )
        fake_event_on_create.assert_awaited_once_with(attachment=attachment)


#####################################################
# list_attachments
#####################################################


async def test_list_attachments():
    story = f.build_story(id="")
    attachments = [
        f.build_attachment(),
        f.build_attachment(),
        f.build_attachment(),
    ]

    filters = {"content_object": story}

    with (
        patch("taiga.attachments.services.attachments_repositories", autospec=True) as fake_attachments_repositories,
    ):
        fake_attachments_repositories.list_attachments.return_value = attachments
        attachments_list = await services.list_attachments(
            content_object=story,
        )
        fake_attachments_repositories.list_attachments.assert_awaited_once_with(
            filters=filters,
            prefetch_related=["content_object", "project"],
        )
        assert len(attachments_list) == 3


##########################################################
# get_coment
##########################################################


async def test_get_attachment():
    story = f.build_story(id="story_id")
    attachment_id = uuid.uuid1()

    with (
        patch("taiga.attachments.services.attachments_repositories", autospec=True) as fake_attachments_repositories,
    ):
        await services.get_attachment(id=attachment_id, content_object=story)
        fake_attachments_repositories.get_attachment.assert_awaited_once_with(
            filters={"id": attachment_id, "content_object": story},
            prefetch_related=["content_object", "project"],
        )


##########################################################
# delete_coment
##########################################################


async def test_delete_attachment():
    attachment = f.build_attachment(id=uuid.uuid1())

    with (
        patch("taiga.attachments.services.attachments_repositories", autospec=True) as fake_attachments_repositories,
    ):
        fake_attachments_repositories.delete_attachments.return_value = True

        assert await services.delete_attachment(attachment=attachment)

        fake_attachments_repositories.delete_attachments.assert_awaited_once_with(
            filters={"id": attachment.id},
        )


async def test_delete_attachment_and_emit_event_on_delete():
    attachment = f.build_attachment(id=uuid.uuid1())
    fake_event_on_delete = AsyncMock()

    with (
        patch("taiga.attachments.services.attachments_repositories", autospec=True) as fake_attachments_repositories,
    ):
        fake_attachments_repositories.delete_attachments.return_value = True

        assert await services.delete_attachment(attachment=attachment, event_on_delete=fake_event_on_delete)

        fake_attachments_repositories.delete_attachments.assert_awaited_once_with(
            filters={"id": attachment.id},
        )
        fake_event_on_delete.assert_awaited_once_with(attachment=attachment)


async def test_delete_attachment_that_does_not_exist():
    attachment = f.build_attachment(id=uuid.uuid1())
    fake_event_on_delete = AsyncMock()

    with (
        patch("taiga.attachments.services.attachments_repositories", autospec=True) as fake_attachments_repositories,
    ):
        fake_attachments_repositories.delete_attachments.return_value = False

        assert not await services.delete_attachment(attachment=attachment, event_on_delete=fake_event_on_delete)

        fake_attachments_repositories.delete_attachments.assert_awaited_once_with(
            filters={"id": attachment.id},
        )
        fake_event_on_delete.assert_not_awaited()
