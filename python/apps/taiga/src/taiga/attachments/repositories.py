# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import Literal, TypedDict, cast
from uuid import UUID

from fastapi import UploadFile
from taiga.attachments.models import Attachment
from taiga.base.db.models import BaseModel, Model, QuerySet, get_contenttype_for_model
from taiga.base.utils.files import get_size, uploadfile_to_file
from taiga.commons.storage import repositories as storage_repositories
from taiga.users.models import User

##########################################################
# filters and querysets
##########################################################


DEFAULT_QUERYSET = Attachment.objects.select_related("storaged_object").all()


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


AttachmentPrefetchRelated = list[
    Literal[
        "content_object",
        "project",
        "workspace",
    ]
]


async def _apply_prefetch_related_to_queryset(
    qs: QuerySet[Attachment],
    prefetch_related: AttachmentPrefetchRelated,
) -> QuerySet[Attachment]:
    prefetch_related_data = []

    for key in prefetch_related:
        if key == "workspace":
            prefetch_related_data.append("content_object__project__workspace")
        elif key == "project":
            prefetch_related_data.append("content_object__project")
        else:
            prefetch_related_data.append(key)

    return qs.prefetch_related(*prefetch_related_data)


##########################################################
# create attachment
##########################################################


async def create_attachment(
    file: UploadFile,
    created_by: User,
    object: Model,
) -> Attachment:
    storaged_object = await storage_repositories.create_storaged_object(uploadfile_to_file(file))

    return await Attachment.objects.acreate(
        storaged_object=storaged_object,
        name=file.filename or "unknown",
        size=get_size(file.file),
        content_type=file.content_type or "application/octet-stream",
        content_object=object,
        created_by=created_by,
    )


##########################################################
# list attachments
##########################################################


async def list_attachments(
    filters: AttachmentFilters = {},
    prefetch_related: AttachmentPrefetchRelated = [],
    offset: int | None = None,
    limit: int | None = None,
) -> list[Attachment]:
    qs = await _apply_filters_to_queryset(qs=DEFAULT_QUERYSET, filters=filters)
    qs = await _apply_prefetch_related_to_queryset(qs=qs, prefetch_related=prefetch_related)

    if limit is not None and offset is not None:
        limit += offset

    return [a async for a in qs[offset:limit]]


##########################################################
# get attachment
##########################################################


async def get_attachment(
    filters: AttachmentFilters = {},
    prefetch_related: AttachmentPrefetchRelated = [],
) -> Attachment | None:
    qs = await _apply_filters_to_queryset(qs=DEFAULT_QUERYSET, filters=filters)
    qs = await _apply_prefetch_related_to_queryset(qs=qs, prefetch_related=prefetch_related)

    try:
        return await qs.aget()
    except Attachment.DoesNotExist:
        return None


##########################################################
# delete attachments
##########################################################


async def delete_attachments(filters: AttachmentFilters) -> int:
    qs = await _apply_filters_to_queryset(qs=DEFAULT_QUERYSET, filters=filters)
    count, _ = await qs.adelete()
    return count
