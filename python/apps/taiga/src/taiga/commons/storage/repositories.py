# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from datetime import datetime
from typing import TypedDict
from uuid import UUID

from taiga.base.db.exceptions import RestrictedError
from taiga.base.db.models import QuerySet
from taiga.base.utils.datetime import aware_utcnow
from taiga.base.utils.files import File
from taiga.commons.storage.models import StoragedObject

##########################################################
# filters and querysets
##########################################################


DEFAULT_QUERYSET = StoragedObject.objects.all()


class StoragedObjectFilters(TypedDict, total=False):
    id: UUID
    deleted_before: datetime


async def _apply_filters_to_queryset(
    qs: QuerySet[StoragedObject],
    filters: StoragedObjectFilters = {},
) -> QuerySet[StoragedObject]:
    filter_data = dict(filters.copy())

    if "deleted_before" in filter_data:
        deleted_before = filter_data.pop("deleted_before")
        filter_data["deleted_at__lt"] = deleted_before

    return qs.filter(**filter_data)


##########################################################
# create storaged object
##########################################################


async def create_storaged_object(
    file: File,
) -> StoragedObject:
    return await StoragedObject.objects.acreate(file=file)


##########################################################
# list storaged object
##########################################################


async def list_storaged_objects(filters: StoragedObjectFilters = {}) -> list[StoragedObject]:
    qs = await _apply_filters_to_queryset(qs=DEFAULT_QUERYSET, filters=filters)
    return [so async for so in qs]


##########################################################
# delete storaged object
########################################################


async def delete_storaged_object(
    storaged_object: StoragedObject,
) -> bool:
    try:
        await storaged_object.adelete()
        storaged_object.file.delete(save=False)
        return True
    except RestrictedError:
        # This happens when you try to delete a StoragedObject that is being used by someone
        # (using ForeignKey with on_delete=PROTECT).

        # TODO: log this
        return False


def mark_storaged_object_as_deleted(
    storaged_object: StoragedObject,
) -> None:
    storaged_object.deleted_at = aware_utcnow()
    storaged_object.save(update_fields=["deleted_at"])
