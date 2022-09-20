# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL


from taiga.base.api import Pagination
from taiga.projects.models import Project
from taiga.stories import events as stories_events
from taiga.stories import repositories as stories_repositories
from taiga.stories.models import Story
from taiga.stories.services.exceptions import InvalidStatusError
from taiga.users.models import User
from taiga.workflows import dataclasses as dt


async def create_story(project: Project, workflow: dt.Workflow, name: str, status_slug: str, user: User) -> Story:
    try:
        workflow_status = next(status for status in workflow.statuses if status.slug == status_slug)
    except StopIteration:
        raise InvalidStatusError("The provided status is not valid.")

    story = await stories_repositories.create_story(
        name=name, project_id=project.id, workflow_id=workflow.id, status_id=workflow_status.id, user_id=user.id
    )

    await stories_events.emit_event_when_story_is_created(story=story)

    return story


async def get_paginated_stories_by_workflow(
    project_slug: str, workflow_slug: str, offset: int, limit: int
) -> tuple[Pagination, list[Story]]:

    total_stories = await stories_repositories.get_total_stories_by_workflow(
        project_slug=project_slug, workflow_slug=workflow_slug
    )

    stories = await stories_repositories.get_stories_by_workflow(
        project_slug=project_slug, workflow_slug=workflow_slug, offset=offset, limit=limit
    )

    pagination = Pagination(offset=offset, limit=limit, total=total_stories)

    return pagination, stories
