# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from functools import partial

from taiga.attachments import services as attachments_services
from taiga.attachments.models import Attachment
from taiga.attachments.serializers import AttachmentSerializer
from taiga.base.api import AuthRequest
from taiga.base.api.permissions import check_permissions
from taiga.base.validators import B64UUID, UploadFile
from taiga.exceptions.api.errors import ERROR_403, ERROR_404, ERROR_422
from taiga.permissions import HasPerm
from taiga.routers import routes
from taiga.stories.attachments import events
from taiga.stories.stories.api import get_story_or_404

# PERMISSIONS
CREATE_STORY_ATTACHMENT = HasPerm("modify_story") | HasPerm("comment_story")
LIST_STORY_ATTACHMENTS = HasPerm("view_story")

################################################
# create story attachment
################################################


@routes.story_attachments.post(
    "/projects/{project_id}/stories/{ref}/attachments",
    name="project.story.attachments.create",
    summary="Attach a file to a story",
    responses=ERROR_403 | ERROR_404 | ERROR_422,
    response_model=AttachmentSerializer,
)
async def create_story_attachments(
    project_id: B64UUID,
    ref: int,
    request: AuthRequest,
    file: UploadFile,
) -> Attachment:
    """
    Create and attachment asociate to a story
    """
    story = await get_story_or_404(project_id, ref)
    await check_permissions(permissions=CREATE_STORY_ATTACHMENT, user=request.user, obj=story)

    event_on_create = partial(events.emit_event_when_story_attachment_is_created, project=story.project)
    return await attachments_services.create_attachment(
        file=file,
        object=story,
        created_by=request.user,
        event_on_create=event_on_create,
    )


##########################################################
# list story comments
##########################################################


@routes.story_attachments.get(
    "/projects/{project_id}/stories/{ref}/attachments",
    name="project.story.attachments.list",
    summary="List story attachments",
    response_model=list[AttachmentSerializer],
    responses=ERROR_403 | ERROR_404 | ERROR_422,
)
async def list_story_attachment(
    project_id: B64UUID,
    ref: int,
    request: AuthRequest,
) -> list[Attachment]:
    """
    List the story attachments
    """
    story = await get_story_or_404(project_id=project_id, ref=ref)
    await check_permissions(permissions=LIST_STORY_ATTACHMENTS, user=request.user, obj=story)
    return await attachments_services.list_attachments(
        content_object=story,
    )
