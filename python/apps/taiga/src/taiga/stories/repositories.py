# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL
from decimal import Decimal
from typing import Any, TypedDict
from uuid import UUID

from asgiref.sync import sync_to_async
from taiga.base.repositories import neighbors as neighbors_repositories
from taiga.base.repositories.neighbors import Neighbor
from taiga.stories.models import Story

##########################################################
# filters and params
##########################################################


class StoriesFilters(TypedDict, total=False):
    refs: list[int]
    workflow_slug: str
    project_slug: str
    project_id: UUID
    status_id: UUID


def _get_stories_filters(filters: StoriesFilters) -> dict[str, Any]:
    filter_data = dict(filters.copy())

    if "refs" in filters:
        filter_data["ref__in"] = filter_data.pop("refs")

    if "workflow_slug" in filters:
        filter_data["workflow__slug"] = filter_data.pop("workflow_slug")

    if "project_slug" in filters:
        filter_data["project__slug"] = filter_data.pop("project_slug")

    return filter_data


class StoryFilters(TypedDict, total=False):
    id: UUID
    ref: int
    project_id: UUID


def _get_select_related(select_related: list[str]) -> list[str]:
    select_related_data = select_related.copy()

    if "workspace" in select_related_data:
        select_related_data.pop(select_related_data.index("workspace"))
        select_related_data.append("project__workspace")

    return select_related_data


##########################################################
# create story
##########################################################


@sync_to_async
def create_story(
    title: str, project_id: UUID, workflow_id: UUID, status_id: UUID, user_id: UUID, order: Decimal
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
# get story
##########################################################


def get_story_sync(filters: StoryFilters = {}, select_related: list[str] = ["status"]) -> Story | None:
    select_related_data = _get_select_related(select_related)
    try:
        return Story.objects.select_related(*select_related_data).get(**filters)
    except Story.DoesNotExist:
        return None


get_story = sync_to_async(get_story_sync)


##########################################################
# get stories
##########################################################


@sync_to_async
def get_stories(
    filters: StoriesFilters = {},
    order_by: list[str] = ["order"],
    offset: int | None = None,
    limit: int | None = None,
    select_related: list[str] = ["status"],
) -> list[Story]:

    filter_data = _get_stories_filters(filters)
    select_related_data = _get_select_related(select_related)

    qs = Story.objects.select_related(*select_related_data).filter(**filter_data).order_by(*order_by)

    if limit is not None and offset is not None:
        limit += offset

    return list(qs[offset:limit])


##########################################################
# update stories
##########################################################


@sync_to_async
def bulk_update_stories(stories_to_update: list[Story], fields_to_update: list[str]) -> None:
    Story.objects.bulk_update(stories_to_update, fields_to_update)


##########################################################
# misc
##########################################################


@sync_to_async
def get_total_stories(filters: StoriesFilters = {}) -> int:
    filter_data = _get_stories_filters(filters)
    qs = Story.objects.filter(**filter_data)
    return qs.count()


@sync_to_async
def get_story_neighbors(story: Story, filters: StoriesFilters = {}) -> Neighbor[Story]:
    filter_data = _get_stories_filters(filters)
    story_qs = Story.objects.filter(**filter_data).order_by("status", "order")
    return neighbors_repositories.get_neighbors_sync(obj=story, model_queryset=story_qs)


@sync_to_async
def get_stories_to_reorder(filters: StoriesFilters = {}) -> list[Story]:
    """
    This method is very similar to "get_stories" except this has to keep
    the order of the input references.
    """
    filter_data = _get_stories_filters(filters)
    qs = Story.objects.filter(**filter_data)

    refs = filters["refs"]
    result = [None] * len(refs)  # create an empty list the size of the references list
    for story in qs:
        result[refs.index(story.ref)] = story  # type: ignore[call-overload]

    return result  # type: ignore[return-value]
