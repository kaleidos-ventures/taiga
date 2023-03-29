# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from fastapi import UploadFile
from taiga.base.db.models import Model
from taiga.mediafiles import repositories as mediafiles_repositories
from taiga.mediafiles.serializers import MediafileSerializer
from taiga.mediafiles.serializers import services as mediafiles_serializers
from taiga.projects.projects.models import Project
from taiga.users.models import User


async def create_mediafiles(
    files: list[UploadFile], project: Project, created_by: User, object: Model | None = None
) -> list[MediafileSerializer]:
    mediafiles = await mediafiles_repositories.create_mediafiles(
        files=files,
        project=project,
        object=object,
        created_by=created_by,
    )
    return [mediafiles_serializers.serialize_mediafile(m) for m in mediafiles]
