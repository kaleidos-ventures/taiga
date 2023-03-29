# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from asgiref.sync import sync_to_async
from fastapi import UploadFile
from taiga.base.db.models import Model
from taiga.base.utils.files import get_size, uploadfile_to_file
from taiga.mediafiles.models import Mediafile
from taiga.projects.projects.models import Project
from taiga.users.models import User


async def create_mediafiles(
    files: list[UploadFile],
    project: Project,
    created_by: User,
    object: Model | None = None,
) -> list[Mediafile]:
    @sync_to_async
    def _create_mediafile_objects() -> list[Mediafile]:
        return [
            Mediafile(
                name=f.filename,
                size=get_size(f.file),
                content_type=f.content_type,
                file=uploadfile_to_file(f),
                project=project,
                content_object=object,
                created_by=created_by,
            )
            for f in files
        ]

    objs = await _create_mediafile_objects()
    return await Mediafile.objects.abulk_create(objs=objs)
