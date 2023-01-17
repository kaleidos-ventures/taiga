# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from decimal import Decimal
from typing import Any, Final, Literal, TypedDict
from uuid import UUID

from asgiref.sync import sync_to_async
from taiga.base.db.models import QuerySet
from taiga.base.occ import repositories as occ_repositories
from taiga.base.repositories import neighbors as neighbors_repositories
from taiga.base.repositories.neighbors import Neighbor
from taiga.stories.stories.models import Story
from taiga.stories.stories.schemas import StorySchema
from taiga.users import repositories as users_repositories
from taiga.users.models import User
from taiga.workflows import repositories as workflows_repositories

##########################################################
# filters and querysets
##########################################################

DEFAULT_QUERYSET = Story.objects.all()


class StoryFilters(TypedDict, total=False):
    id: UUID
    ref: int
    refs: list[int]
    workflow_slug: str
    project_id: UUID
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


StoryPrefetchRelated = list[
    Literal[
        "assignees",
    ]
]


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
) -> Story:

    story = Story.objects.create(
        title=title,
        project_id=project_id,
        workflow_id=workflow_id,
        status_id=status_id,
        created_by_id=user_id,
        order=order,
    )

    return get_story_sync(
        filters={"id": story.id},
        select_related=["project", "workflow", "status", "workspace"],
    )  # type: ignore[return-value]


##########################################################
# list stories
##########################################################


def list_stories_sync(
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


list_stories = sync_to_async(list_stories_sync)


@sync_to_async
def list_stories_schemas(
    filters: StoryFilters = {},
    order_by: StoryOrderBy = ["order"],
    offset: int | None = None,
    limit: int | None = None,
    select_related: StorySelectRelated = ["status"],
    prefetch_related: StoryPrefetchRelated = ["assignees"],
) -> list[StorySchema]:

    stories = list_stories_sync(
        filters=filters,
        order_by=order_by,
        offset=offset,
        limit=limit,
        select_related=select_related,
        prefetch_related=prefetch_related,
    )

    stories_schemas = []
    for story in stories:
        stories_schemas.append(story_to_schema(story))

    return stories_schemas


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
# misc
##########################################################


@sync_to_async
def get_total_stories(filters: StoryFilters = {}) -> int:
    qs = _apply_filters_to_queryset(qs=DEFAULT_QUERYSET, filters=filters)

    return qs.count()


@sync_to_async
def get_story_neighbors(story: Story, filters: StoryFilters = {}) -> Neighbor[Story]:
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

    refs = filters["refs"]
    result = [None] * len(refs)  # create an empty list the size of the references list
    for story in qs:
        result[refs.index(story.ref)] = story  # type: ignore[call-overload]

    return result  # type: ignore[return-value]


def story_to_schema(story: Story) -> StorySchema:
    return StorySchema(
        ref=story.ref,
        title=story.title,
        status=workflows_repositories.workflow_status_to_schema(story.status),
        version=story.version,
        assignees=[users_repositories.user_base_to_schema(user) for user in story.assignees.all()],
    )


@sync_to_async
def get_story_assignees(story: Story) -> list[User]:
    return list(story.assignees.all())
