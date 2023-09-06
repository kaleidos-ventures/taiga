# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import pytest
from taiga.attachments import repositories as attachments_repositories
from taiga.attachments.models import Attachment
from taiga.attachments.signals import mark_attachment_file_to_delete
from taiga.workspaces.workspaces import repositories as workspaces_repositories
from tests.utils import db as db_utils
from tests.utils import factories as f
from tests.utils import signals as signals_utils

pytestmark = pytest.mark.django_db(transaction=True)


def test_mark_attachment_file_to_delete_is_connected():
    assert mark_attachment_file_to_delete in signals_utils.get_receivers_for_model("post_delete", Attachment)


async def test_mark_attachment_file_to_delete_when_delete_first_level_related_model():
    story = await f.create_story()
    attachment = await f.create_attachment(content_object=story)
    file = attachment.file

    assert file.deleted_at is None

    assert await attachments_repositories.delete_attachments(filters={"id": attachment.id})
    await db_utils.refresh_model_from_db(file)

    assert file.deleted_at


async def test_mark_attachment_file_to_delete_when_delete_n_level_related_object():
    workspace = await f.create_workspace()
    project1 = await f.create_project(workspace=workspace)
    project2 = await f.create_project(workspace=workspace)
    story1 = await f.create_story(project=project1)
    story2 = await f.create_story(project=project2)
    attachment11 = await f.create_attachment(content_object=story1)
    attachment12 = await f.create_attachment(content_object=story1)
    attachment21 = await f.create_attachment(content_object=story2)

    file11 = attachment11.file
    file12 = attachment12.file
    file21 = attachment21.file

    assert file11.deleted_at is None
    assert file12.deleted_at is None
    assert file21.deleted_at is None

    assert await workspaces_repositories.delete_workspaces(filters={"id": workspace.id})

    await db_utils.refresh_model_from_db(file11)
    await db_utils.refresh_model_from_db(file12)
    await db_utils.refresh_model_from_db(file21)

    assert file11.deleted_at
    assert file12.deleted_at
    assert file21.deleted_at
