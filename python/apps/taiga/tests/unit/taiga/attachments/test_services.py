# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

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
        )
        assert len(attachments_list) == 3
