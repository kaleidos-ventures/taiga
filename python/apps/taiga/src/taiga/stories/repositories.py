# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from uuid import UUID

from asgiref.sync import sync_to_async
from django.db.models import QuerySet
from taiga.stories.models import Story


@sync_to_async
def create_story(
    title: str,
    project_id: UUID,
    workflow_id: UUID,
    status_id: UUID,
    user_id: UUID,
) -> Story:

    story = Story.objects.create(
        title=title,
        project_id=project_id,
        workflow_id=workflow_id,
        status_id=status_id,
        created_by_id=user_id,
    )

    return Story.objects.select_related("project", "workflow", "status", "project__workspace").get(id=story.id)


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


def _get_stories_by_workflow_qs(project_slug: str, workflow_slug: str) -> QuerySet[Story]:
    stories_qs = Story.objects.select_related("project", "workflow", "status").filter(
        project__slug=project_slug, workflow__slug=workflow_slug
    )
    return stories_qs
