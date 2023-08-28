# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import cast

from taiga.attachments.models import Attachment
from taiga.events import events_manager
from taiga.projects.projects.models import Project
from taiga.stories.attachments.events.content import CreateStoryAttachmentContent, DeleteStoryAttachmentContent
from taiga.stories.stories.models import Story

CREATE_STORY_ATTACHMENT = "stories.attachments.create"
DELETE_STORY_ATTACHMENT = "stories.attachments.delete"


async def emit_event_when_story_attachment_is_created(
    attachment: Attachment,
    project: Project,
) -> None:
    story = cast(Story, attachment.content_object)

    await events_manager.publish_on_project_channel(
        project=project,
        type=CREATE_STORY_ATTACHMENT,
        content=CreateStoryAttachmentContent(
            ref=story.ref,
            attachment=attachment,
        ),
    )


async def emit_event_when_story_attachment_is_deleted(
    attachment: Attachment,
    project: Project,
) -> None:
    story = cast(Story, attachment.content_object)

    await events_manager.publish_on_project_channel(
        project=project,
        type=DELETE_STORY_ATTACHMENT,
        content=DeleteStoryAttachmentContent(
            ref=story.ref,
            attachment=attachment,
        ),
    )
