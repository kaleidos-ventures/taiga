# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from decimal import Decimal
from typing import Any
from uuid import UUID

from asgiref.sync import sync_to_async
from django.db.models import QuerySet
from taiga.stories.models import Story
from taiga.workflows.models import WorkflowStatus

##########################################################
# create stories
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

    return Story.objects.select_related("project", "workflow", "status", "project__workspace").get(id=story.id)


##########################################################
# get stories
##########################################################


@sync_to_async
def get_story(**kwargs: Any) -> Story:
    return Story.objects.filter(**kwargs).get()


def _get_stories_qs(**kwargs: Any) -> QuerySet[Story]:
    refs = kwargs.pop("refs", None)

    qs = Story.objects.select_related("status").filter(**kwargs)

    if refs:
        qs = qs.filter(ref__in=refs)

    return qs


@sync_to_async
def get_total_stories(**kwargs: Any) -> int:
    qs = _get_stories_qs(**kwargs)
    return qs.count()


@sync_to_async
def get_stories(**kwargs: Any) -> list[Story]:
    qs = _get_stories_qs(**kwargs).order_by("order")
    return list(qs)


@sync_to_async
def get_stories_to_reorder(**kwargs: Any) -> list[Story]:
    """
    This method is very similar to "get_stories" except this has to keep
    the order of the input references.
    """
    qs = _get_stories_qs(**kwargs)

    refs = kwargs["refs"]
    result = [None] * len(refs)  # create an empty list the size of the references list
    for story in qs:
        result[refs.index(story.ref)] = story  # type: ignore[call-overload]

    return result  # type: ignore[return-value]


def _get_stories_by_workflow_qs(project_slug: str, workflow_slug: str) -> QuerySet[Story]:
    stories_qs = Story.objects.select_related("project", "workflow", "status").filter(
        project__slug=project_slug, workflow__slug=workflow_slug
    )
    return stories_qs


@sync_to_async
def get_total_stories_by_workflow(project_slug: str, workflow_slug: str) -> int:
    qs = _get_stories_by_workflow_qs(project_slug=project_slug, workflow_slug=workflow_slug)
    return qs.count()


@sync_to_async
def get_stories_by_workflow(project_slug: str, workflow_slug: str, offset: int = 0, limit: int = 0) -> list[Story]:
    qs = _get_stories_by_workflow_qs(project_slug=project_slug, workflow_slug=workflow_slug).order_by(
        "order", "created_at"
    )
    if limit:
        return list(qs[offset : offset + limit])

    return list(qs)


##########################################################
# update stories
##########################################################

DEFAULT_POST_OFFSET = 100  # default offset when adding a story at the end
DEFAULT_FIRST_ORDER = Decimal(0)  # default pre_position when adding a story at the beginning


@sync_to_async
def reorder_stories(
    target_status: WorkflowStatus,
    stories_to_reorder: list[Story],
    reorder_story: Story | None = None,
    reorder_place: str | None = None,
) -> None:
    total_slots = len(stories_to_reorder) + 1
    if not reorder_place and not reorder_story:
        pre_story = Story.objects.filter(status=target_status).order_by("-order").first()
        if pre_story:
            pre_order = pre_story.order
        else:
            pre_order = DEFAULT_FIRST_ORDER
        post_order = pre_order + (DEFAULT_POST_OFFSET * total_slots)

    elif reorder_story and reorder_place == "after":
        pre_order = reorder_story.order
        post_story = Story.objects.filter(status=target_status, order__gt=reorder_story.order).order_by("order").first()
        if post_story:
            post_order = post_story.order
        else:
            post_order = pre_order + (DEFAULT_POST_OFFSET * total_slots)

    elif reorder_story and reorder_place == "before":
        post_order = reorder_story.order
        pre_story = Story.objects.filter(status=target_status, order__lt=reorder_story.order).order_by("-order").first()
        if pre_story:
            pre_order = pre_story.order
        else:
            pre_order = DEFAULT_FIRST_ORDER

    offset = (post_order - pre_order) / total_slots
    for i, story in enumerate(stories_to_reorder):
        story.status = target_status
        story.order = pre_order + (offset * (i + 1))

    Story.objects.bulk_update(stories_to_reorder, ["status", "order"])


##########################################################
# misc
##########################################################


@sync_to_async
def get_max_order(**kwargs: Any) -> Any:
    qs = _get_stories_qs(**kwargs)
    story = qs.order_by("-order").first()
    if story:
        return story.order

    return 0
