# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from decimal import Decimal
from typing import Any, Final, Literal, TypedDict
from uuid import UUID

from asgiref.sync import sync_to_async
from taiga.base.db.models import QuerySet
from taiga.base.occ import repositories as occ_repositories
from taiga.base.repositories import neighbors as neighbors_repositories
from taiga.base.repositories.neighbors import Neighbor
from taiga.stories.stories.models import Story
from taiga.users.models import User

##########################################################
# filters and querysets
##########################################################

DEFAULT_QUERYSET = Story.objects.all()


class StoryFilters(TypedDict, total=False):
    id: UUID
    ref: int
    refs: list[int]
    project_id: UUID
    workflow_id: UUID
    workflow_slug: str
    status_id: UUID


def _apply_filters_to_queryset(
    qs: QuerySet[Story],
    filters: StoryFilters = {},
) -> QuerySet[Story]:
    filter_data = dict(filters.copy())

    if "refs" in filters:
        filter_data["ref__in"] = filter_data.pop("refs")

    if "workflow_slug" in filters:
        filter_data["workflow__slug"] = filter_data.pop("workflow_slug")

    return qs.filter(**filter_data)


StorySelectRelated = list[
    Literal[
        "created_by",
        "project",
        "workflow",
        "status",
        "workspace",
        "title_updated_by",
        "description_updated_by",
    ]
]


def _apply_select_related_to_queryset(
    qs: QuerySet[Story],
    select_related: StorySelectRelated,
) -> QuerySet[Story]:
    select_related_data = []

    for key in select_related:
        if key == "workspace":
            select_related_data.append("project__workspace")
        else:
            select_related_data.append(key)

    return qs.select_related(*select_related_data)


StoryPrefetchRelated = list[Literal["assignees",]]


def _apply_prefetch_related_to_queryset(qs: QuerySet[Story], prefetch_related: StoryPrefetchRelated) -> QuerySet[Story]:
    return qs.prefetch_related(*prefetch_related)


StoryOrderBy = list[
    Literal[
        "order",
        "-order",
        "status",
    ]
]


def _apply_order_by_to_queryset(qs: QuerySet[Story], order_by: StoryOrderBy) -> QuerySet[Story]:
    return qs.order_by(*order_by)


##########################################################
# create story
##########################################################


@sync_to_async
def create_story(
    title: str,
    project_id: UUID,
    workflow_id: UUID,
    status_id: UUID,
    user_id: UUID,
    order: Decimal,
    description: str | None = None,
) -> Story:
    return Story.objects.create(
        title=title,
        description=description,
        project_id=project_id,
        workflow_id=workflow_id,
        status_id=status_id,
        created_by_id=user_id,
        order=order,
    )


##########################################################
# list stories
##########################################################


@sync_to_async
def list_stories(
    filters: StoryFilters = {},
    order_by: StoryOrderBy = ["order"],
    offset: int | None = None,
    limit: int | None = None,
    select_related: StorySelectRelated = ["status"],
    prefetch_related: StoryPrefetchRelated = [],
) -> list[Story]:
    qs = _apply_filters_to_queryset(qs=DEFAULT_QUERYSET, filters=filters)
    qs = _apply_select_related_to_queryset(qs=qs, select_related=select_related)
    qs = _apply_prefetch_related_to_queryset(qs=qs, prefetch_related=prefetch_related)
    qs = _apply_order_by_to_queryset(qs=qs, order_by=order_by)

    if limit is not None and offset is not None:
        limit += offset

    return list(qs[offset:limit])


##########################################################
# get story
##########################################################


def get_story_sync(
    filters: StoryFilters = {},
    select_related: StorySelectRelated = ["status"],
    prefetch_related: StoryPrefetchRelated = ["assignees"],
) -> Story | None:
    qs = _apply_filters_to_queryset(qs=DEFAULT_QUERYSET, filters=filters)
    qs = _apply_select_related_to_queryset(qs=qs, select_related=select_related)
    qs = _apply_prefetch_related_to_queryset(qs=qs, prefetch_related=prefetch_related)

    try:
        return qs.get()
    except Story.DoesNotExist:
        return None


get_story = sync_to_async(get_story_sync)


##########################################################
# update stories
##########################################################

PROTECTED_ATTRS_ON_UPDATE: Final[list[str]] = [
    "title",
    "description",
]


async def update_story(id: UUID, current_version: int | None = None, values: dict[str, Any] = {}) -> bool:
    return await occ_repositories.update(
        model_class=Story,
        id=id,
        current_version=current_version,
        values=values,
        protected_attrs=PROTECTED_ATTRS_ON_UPDATE,
    )


@sync_to_async
def bulk_update_stories(objs_to_update: list[Story], fields_to_update: list[str]) -> None:
    Story.objects.bulk_update(objs_to_update, fields_to_update)


##########################################################
# delete story
##########################################################


@sync_to_async
def delete_stories(filters: StoryFilters = {}) -> int:
    qs = _apply_filters_to_queryset(qs=DEFAULT_QUERYSET, filters=filters)
    count, _ = qs.delete()
    return count


##########################################################
# misc
##########################################################


@sync_to_async
def get_total_stories(filters: StoryFilters = {}) -> int:
    qs = _apply_filters_to_queryset(qs=DEFAULT_QUERYSET, filters=filters)

    return qs.count()


@sync_to_async
def list_story_neighbors(story: Story, filters: StoryFilters = {}) -> Neighbor[Story]:
    qs = _apply_filters_to_queryset(qs=DEFAULT_QUERYSET, filters=filters)
    qs = _apply_order_by_to_queryset(qs=qs, order_by=["status", "order"])

    return neighbors_repositories.get_neighbors_sync(obj=story, model_queryset=qs)


@sync_to_async
def list_stories_to_reorder(filters: StoryFilters = {}) -> list[Story]:
    """
    This method is very similar to "list_stories" except this has to keep
    the order of the input references.
    """
    qs = _apply_filters_to_queryset(qs=DEFAULT_QUERYSET, filters=filters)
    qs = _apply_select_related_to_queryset(qs=qs, select_related=["status", "project", "created_by"])
    qs = _apply_prefetch_related_to_queryset(qs=qs, prefetch_related=["assignees"])

    stories = {s.ref: s for s in qs}
    return [stories[ref] for ref in filters["refs"] if stories.get(ref) is not None]


@sync_to_async
def list_story_assignees(story: Story) -> list[User]:
    return list(story.assignees.all().order_by("-story_assignments__created_at"))


async def bulk_update_workflow_to_stories(
    statuses_ids: list[UUID], old_workflow_id: UUID, new_workflow_id: UUID
) -> None:
    await Story.objects.filter(status_id__in=statuses_ids, workflow_id=old_workflow_id).aupdate(
        workflow_id=new_workflow_id
    )
