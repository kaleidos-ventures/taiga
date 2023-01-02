# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Literal, TypedDict
from uuid import UUID

from asgiref.sync import sync_to_async
from taiga.base.db.models import QuerySet
from taiga.stories.assignees.models import StoryAssignee
from taiga.stories.stories.models import Story
from taiga.users.models import User

##########################################################
# filters and querysets
##########################################################

DEFAULT_QUERYSET = StoryAssignee.objects.all()


class StoryAssigneeFilters(TypedDict, total=False):
    story_id: UUID
    username: str


def _apply_filters_to_queryset(
    qs: QuerySet[StoryAssignee],
    filters: StoryAssigneeFilters = {},
) -> QuerySet[StoryAssignee]:
    filter_data = dict(filters.copy())

    if "story_id" in filter_data:
        filter_data["story__id"] = filter_data.pop("story_id")

    if "username" in filter_data:
        filter_data["user__username"] = filter_data.pop("username")

    qs = qs.filter(**filter_data)
    return qs


StoryAssigneeSelectRelated = list[
    Literal[
        "story",
        "user",
    ]
]


def _apply_select_related_to_queryset(
    qs: QuerySet[StoryAssignee],
    select_related: StoryAssigneeSelectRelated,
) -> QuerySet[StoryAssignee]:
    select_related_data = []

    for key in select_related:
        select_related_data.append(key)

    qs = qs.select_related(*select_related_data)
    return qs


##########################################################
# create story assignee
##########################################################


@sync_to_async
def create_story_assignee(story: Story, user: User) -> tuple[StoryAssignee, bool]:
    return StoryAssignee.objects.select_related("story", "user").get_or_create(story=story, user=user)


##########################################################
# get story assignee
##########################################################


def get_story_assignee_sync(
    filters: StoryAssigneeFilters = {}, select_related: StoryAssigneeSelectRelated = ["story", "user"]
) -> StoryAssignee | None:
    qs = _apply_filters_to_queryset(qs=DEFAULT_QUERYSET, filters=filters)
    qs = _apply_select_related_to_queryset(qs=qs, select_related=select_related)

    try:
        return qs.get()
    except StoryAssignee.DoesNotExist:
        return None


get_story_assignee = sync_to_async(get_story_assignee_sync)
