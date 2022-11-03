# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Any

from taiga.base.api import Pagination
from taiga.projects.projects.models import Project
from taiga.stories import events as stories_events
from taiga.stories import repositories as stories_repositories
from taiga.stories.models import Story
from taiga.stories.services import exceptions as ex
from taiga.users.models import User
from taiga.workflows import repositories as workflows_repositories
from taiga.workflows.models import WorkflowStatus
from taiga.workflows.schemas import WorkflowSchema


async def create_story(project: Project, workflow: WorkflowSchema, title: str, status_slug: str, user: User) -> Story:
    try:
        workflow_status = next(status for status in workflow.statuses if status.slug == status_slug)
    except StopIteration:
        raise ex.InvalidStatusError("The provided status is not valid.")

    order = await stories_repositories.get_max_order(status_id=workflow_status.id) + 100

    story = await stories_repositories.create_story(
        title=title,
        project_id=project.id,
        workflow_id=workflow.id,
        status_id=workflow_status.id,
        user_id=user.id,
        order=order,
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


async def reorder_stories(
    project: Project,
    workflow: WorkflowSchema,
    target_status_slug: str,
    stories_refs: list[int],
    reorder: dict[str, Any] | None = None,
) -> dict[str, Any]:
    # check target_status exists
    try:
        target_status = await workflows_repositories.get_status(
            project_slug=project.slug, workflow_slug=workflow.slug, status_slug=target_status_slug
        )
    except WorkflowStatus.DoesNotExist:
        raise ex.InvalidStatusError(f"Status {target_status_slug} doesn't exist in this project")

    # check anchor story exists
    if reorder:
        try:
            assert reorder["ref"] not in stories_refs
            reorder_story = await stories_repositories.get_story(
                workflow_id=workflow.id, status_id=target_status.id, ref=reorder["ref"]
            )
            reorder_place = reorder["place"]
        except Story.DoesNotExist:
            raise ex.InvalidStoryRefError(f"Ref {reorder['ref']} doesn't exist in this project")
        except AssertionError:
            raise ex.InvalidStoryRefError(f"Ref {reorder['ref']} should not be part of the stories to reorder")
    else:
        reorder_story = None
        reorder_place = None

    # check all stories "to reorder" exist
    stories_to_reorder = await stories_repositories.get_stories_to_reorder(workflow_id=workflow.id, refs=stories_refs)
    if len(stories_to_reorder) < len(stories_refs):
        raise ex.InvalidStoryRefError("One or more refs don't exist in this project")

    # update stories
    await stories_repositories.reorder_stories(
        target_status=target_status,
        stories_to_reorder=stories_to_reorder,
        reorder_story=reorder_story,
        reorder_place=reorder_place,
    )

    # event
    await stories_events.emit_when_stories_are_reordered(
        project=project, status=target_status, stories=stories_refs, reorder=reorder
    )

    return {"status": target_status, "stories": stories_refs, "reorder": reorder}


async def get_story(ref: int, project: Project) -> dict[str, Any] | None:
    story = await stories_repositories.get_story_with_neighbors_as_dict(project_id=project.id, ref=ref)

    if story:
        story["prev"] = story["prev"].ref if story["prev"] else None
        story["next"] = story["next"].ref if story["next"] else None

        return story

    return None
