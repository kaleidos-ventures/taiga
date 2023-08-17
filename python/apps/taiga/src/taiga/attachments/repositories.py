# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import TypedDict, cast
from uuid import UUID

from fastapi import UploadFile
from taiga.attachments.models import Attachment
from taiga.base.db.models import BaseModel, Model, QuerySet, get_contenttype_for_model
from taiga.base.utils.files import get_size, uploadfile_to_file
from taiga.users.models import User

##########################################################
# filters and querysets
##########################################################


DEFAULT_QUERYSET = Attachment.objects.all()


class AttachmentFilters(TypedDict, total=False):
    id: UUID
    content_object: Model


async def _apply_filters_to_queryset(
    qs: QuerySet[Attachment],
    filters: AttachmentFilters = {},
) -> QuerySet[Attachment]:
    filter_data = dict(filters.copy())

    if "content_object" in filters:
        content_object = cast(BaseModel, filter_data.pop("content_object"))
        filter_data["object_content_type"] = await get_contenttype_for_model(content_object)
        filter_data["object_id"] = content_object.id

    return qs.filter(**filter_data)


##########################################################
# create comment
##########################################################


async def create_attachment(
    file: UploadFile,
    created_by: User,
    object: Model,
) -> Attachment:
    return await Attachment.objects.acreate(
        name=file.filename or "unknown",
        size=get_size(file.file),
        content_type=file.content_type or "unknown",
        file=uploadfile_to_file(file),
        content_object=object,
        created_by=created_by,
    )


##########################################################
# list attachments
##########################################################


async def list_attachments(
    filters: AttachmentFilters = {},
    offset: int | None = None,
    limit: int | None = None,
) -> list[Attachment]:
    qs = await _apply_filters_to_queryset(qs=DEFAULT_QUERYSET, filters=filters)

    if limit is not None and offset is not None:
        limit += offset

    return [a async for a in qs[offset:limit]]
