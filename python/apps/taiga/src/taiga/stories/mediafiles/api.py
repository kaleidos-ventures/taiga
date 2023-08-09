# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from fastapi import UploadFile
from taiga.base.api import AuthRequest, responses
from taiga.base.api.permissions import check_permissions
from taiga.base.validators import B64UUID
from taiga.exceptions.api.errors import ERROR_403, ERROR_404, ERROR_422
from taiga.mediafiles import services as mediafiles_services
from taiga.mediafiles.serializers import MediafileSerializer
from taiga.permissions import HasPerm
from taiga.routers import routes
from taiga.stories.stories.api import get_story_or_404

# PERMISSIONS
CREATE_STORY_MEDIAFILE = HasPerm("modify_story") | HasPerm("comment_story")

# HTTP 200 RESPONSES
MEDIAFILE_DETAIL_200 = responses.http_status_200(model=MediafileSerializer)

################################################
# add mediafile (create mediafile)
################################################


@routes.stories.post(
    "/projects/{project_id}/stories/{ref}/mediafiles",
    name="project.story.mediafiles.create",
    summary="Create mediafiles and attach to an story",
    responses=MEDIAFILE_DETAIL_200 | ERROR_403 | ERROR_404 | ERROR_422,
    response_model=None,
)
async def create_story_mediafiles(
    project_id: B64UUID,
    ref: int,
    request: AuthRequest,
    files: list[UploadFile],
) -> list[MediafileSerializer]:
    """
    Add some mediafiles to an story
    """
    story = await get_story_or_404(project_id, ref)
    await check_permissions(permissions=CREATE_STORY_MEDIAFILE, user=request.user, obj=story)

    return await mediafiles_services.create_mediafiles(
        files=files,
        project=story.project,
        object=story,
        created_by=request.user,
    )
