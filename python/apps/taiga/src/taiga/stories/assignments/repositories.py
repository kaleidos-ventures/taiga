# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import Literal, TypedDict
from uuid import UUID

from asgiref.sync import sync_to_async
from taiga.base.db.models import QuerySet
from taiga.stories.assignments.models import StoryAssignment
from taiga.stories.stories.models import Story
from taiga.users.models import User

##########################################################
# filters and querysets
##########################################################

DEFAULT_QUERYSET = StoryAssignment.objects.all()


class StoryAssignmentFilters(TypedDict, total=False):
    id: UUID
    ref: int
    project_id: UUID
    story_id: UUID
    username: str
    role_id: UUID


def _apply_filters_to_queryset(
    qs: QuerySet[StoryAssignment],
    filters: StoryAssignmentFilters = {},
) -> QuerySet[StoryAssignment]:
    filter_data = dict(filters.copy())

    if "ref" in filter_data:
        filter_data["story__ref"] = filter_data.pop("ref")

    if "project_id" in filter_data:
        filter_data["story__project_id"] = filter_data.pop("project_id")

    if "username" in filter_data:
        filter_data["user__username"] = filter_data.pop("username")

    if "role_id" in filter_data:
        filter_data["user__project_memberships__role_id"] = filter_data.pop("role_id")

    return qs.filter(**filter_data)


StoryAssignmentSelectRelated = list[Literal["story", "user", "story_project"]]


def _apply_select_related_to_queryset(
    qs: QuerySet[StoryAssignment],
    select_related: StoryAssignmentSelectRelated,
) -> QuerySet[StoryAssignment]:
    select_related_data = []
    for sr in select_related:
        if sr == "story_project":
            select_related_data.append("story__project")
        else:
            select_related_data.append(sr)
    return qs.select_related(*select_related_data)


##########################################################
# create story assignment
##########################################################


@sync_to_async
def create_story_assignment(story: Story, user: User) -> tuple[StoryAssignment, bool]:
    return StoryAssignment.objects.select_related("story", "user").get_or_create(story=story, user=user)


##########################################################
# get story assignment
##########################################################


@sync_to_async
def get_story_assignment(
    filters: StoryAssignmentFilters = {}, select_related: StoryAssignmentSelectRelated = ["story", "user"]
) -> StoryAssignment | None:
    qs = _apply_filters_to_queryset(qs=DEFAULT_QUERYSET, filters=filters)
    qs = _apply_select_related_to_queryset(qs=qs, select_related=select_related)

    try:
        return qs.get()
    except StoryAssignment.DoesNotExist:
        return None


##########################################################
# delete story assignment
##########################################################


@sync_to_async
def delete_stories_assignments(filters: StoryAssignmentFilters = {}) -> int:
    qs = _apply_filters_to_queryset(qs=DEFAULT_QUERYSET, filters=filters)
    count, _ = qs.delete()
    return count
