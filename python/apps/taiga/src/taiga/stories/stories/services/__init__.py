# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from decimal import Decimal
from typing import Any, cast
from uuid import UUID

from taiga.base.api import Pagination
from taiga.base.repositories.neighbors import Neighbor
from taiga.base.utils.datetime import aware_utcnow
from taiga.projects.projects.models import Project
from taiga.stories.stories import events as stories_events
from taiga.stories.stories import notifications as stories_notifications
from taiga.stories.stories import repositories as stories_repositories
from taiga.stories.stories.models import Story
from taiga.stories.stories.serializers import ReorderStoriesSerializer, StoryDetailSerializer, StorySummarySerializer
from taiga.stories.stories.serializers import services as serializers_services
from taiga.stories.stories.services import exceptions as ex
from taiga.users.models import User
from taiga.workflows import repositories as workflows_repositories
from taiga.workflows.models import Workflow, WorkflowStatus

DEFAULT_ORDER_OFFSET = Decimal(100)  # default offset when adding a story
DEFAULT_PRE_ORDER = Decimal(0)  # default pre_position when adding a story at the beginning


##########################################################
# create story
##########################################################


async def create_story(
    project: Project, workflow: Workflow, status_id: UUID, user: User, title: str, description: str | None
) -> StoryDetailSerializer:
    # Validate data
    workflow_status = await workflows_repositories.get_workflow_status(
        filters={"id": status_id, "workflow_id": workflow.id}
    )
    if not workflow_status:
        raise ex.InvalidStatusError("The provided status is not valid.")

    latest_story = await stories_repositories.list_stories(
        filters={"status_id": workflow_status.id}, order_by=["-order"], offset=0, limit=1
    )
    order = DEFAULT_ORDER_OFFSET + (latest_story[0].order if latest_story else 0)

    # Create story
    story = await stories_repositories.create_story(
        title=title,
        description=description,
        project_id=project.id,
        workflow_id=workflow.id,
        status_id=workflow_status.id,
        user_id=user.id,
        order=order,
    )

    # Get detailed story
    detailed_story = await get_story_detail(project_id=project.id, ref=story.ref)

    # Emit event
    await stories_events.emit_event_when_story_is_created(project=project, story=detailed_story)

    return detailed_story


##########################################################
# list stories
##########################################################


async def list_paginated_stories(
    project_id: UUID,
    workflow_slug: str,
    offset: int,
    limit: int,
) -> tuple[Pagination, list[StorySummarySerializer]]:
    total_stories = await stories_repositories.get_total_stories(
        filters={"workflow_slug": workflow_slug, "project_id": project_id}
    )

    stories_serializer = await get_serialized_stories(project_id, workflow_slug, limit, offset)

    pagination = Pagination(offset=offset, limit=limit, total=total_stories)

    return pagination, stories_serializer


async def list_all_stories(project_id: UUID, workflow_slug: str) -> list[StorySummarySerializer]:
    stories_serializer = await get_serialized_stories(project_id, workflow_slug)

    return stories_serializer


async def get_serialized_stories(
    project_id: UUID, workflow_slug: str, limit: int | None = None, offset: int | None = None
) -> list[StorySummarySerializer]:
    stories = await stories_repositories.list_stories(
        filters={"workflow_slug": workflow_slug, "project_id": project_id},
        offset=offset,
        limit=limit,
        select_related=["created_by", "project", "workflow", "status"],
        prefetch_related=["assignees"],
    )
    return [
        serializers_services.serialize_story_list(
            story=story, assignees=await stories_repositories.list_story_assignees(story)
        )
        for story in stories
    ]


##########################################################
# get story
##########################################################


async def get_story(project_id: UUID, ref: int) -> Story | None:
    return await stories_repositories.get_story(
        filters={"ref": ref, "project_id": project_id},
        select_related=["project", "workspace", "workflow", "created_by"],
        prefetch_related=["assignees"],
    )


async def get_story_detail(
    project_id: UUID, ref: int, neighbors: Neighbor[Story] | None = None
) -> StoryDetailSerializer:
    story = cast(
        Story,
        await stories_repositories.get_story(
            filters={"ref": ref, "project_id": project_id},
            select_related=[
                "created_by",
                "project",
                "workflow",
                "status",
                "workspace",
                "title_updated_by",
                "description_updated_by",
            ],
            prefetch_related=["assignees"],
        ),
    )

    if not neighbors:
        neighbors = await stories_repositories.list_story_neighbors(
            story=story, filters={"workflow_id": story.workflow_id}
        )

    assignees = await stories_repositories.list_story_assignees(story=story)

    return serializers_services.serialize_story_detail(story=story, neighbors=neighbors, assignees=assignees)


##########################################################
# update stories
##########################################################


async def update_story(
    story: Story,
    current_version: int,
    updated_by: User,
    values: dict[str, Any] = {},
) -> StoryDetailSerializer:
    # Values to update
    update_values = await _validate_and_process_values_to_update(story=story, updated_by=updated_by, values=values)

    # Old neighbors
    old_neighbors = None
    if update_values.get("workflow", None):
        old_neighbors = await stories_repositories.list_story_neighbors(
            story=story, filters={"workflow_id": story.workflow_id}
        )

    # Update story
    if not await stories_repositories.update_story(
        id=story.id,
        current_version=current_version,
        values=update_values,
    ):
        raise ex.UpdatingStoryWithWrongVersionError("Updating a story with the wrong version.")

    # Get detailed story
    detailed_story = await get_story_detail(project_id=story.project_id, ref=story.ref, neighbors=old_neighbors)

    # Emit event
    await stories_events.emit_event_when_story_is_updated(
        project=story.project,
        story=detailed_story,
        updates_attrs=[*update_values],
    )

    # Emit notifications
    if "workflow" in update_values:
        await stories_notifications.notify_when_story_workflow_change(
            story=story,
            workflow=update_values["workflow"].name,
            status=update_values["status"].name,
            emitted_by=updated_by,
        )
    elif "status" in update_values:
        await stories_notifications.notify_when_story_status_change(
            story=story,
            status=update_values["status"].name,
            emitted_by=updated_by,
        )

    return detailed_story


async def _validate_and_process_values_to_update(
    story: Story, updated_by: User, values: dict[str, Any]
) -> dict[str, Any]:
    output = values.copy()

    if "title" in output:
        output.update(
            title_updated_by=updated_by,
            title_updated_at=aware_utcnow(),
        )

    if "description" in output:
        output.update(
            description_updated_by=updated_by,
            description_updated_at=aware_utcnow(),
        )

    if status_id := output.pop("status", None):
        status = await workflows_repositories.get_workflow_status(
            filters={"workflow_id": story.workflow_id, "id": status_id}
        )
        if not status or output.get("workflow", None):
            raise ex.InvalidStatusError("The provided status is not valid.")

        if status.id != story.status_id:
            output.update(status=status, order=await _calculate_next_order(status_id=status.id))

    elif workflow_slug := output.pop("workflow", None):
        workflow = await workflows_repositories.get_workflow(
            filters={"project_id": story.project_id, "slug": workflow_slug}, prefetch_related=["statuses"]
        )
        if not workflow:
            raise ex.InvalidWorkflowError("The provided workflow is not valid.")

        if workflow.slug != story.workflow.slug:
            # Set first status
            first_status_list = await workflows_repositories.list_workflow_statuses(
                filters={"workflow_id": workflow.id}, order_by=["order"], offset=0, limit=1
            )

            if not first_status_list:
                raise ex.WorkflowHasNotStatusesError("The provided workflow hasn't any statuses.")
            else:
                first_status = first_status_list[0]

            output.update(
                workflow=workflow,
                status=first_status,
                order=await _calculate_next_order(status_id=first_status.id),
            )

    return output


##########################################################
# update reorder stories
##########################################################


async def _calculate_offset(
    total_stories_to_reorder: int,
    target_status: WorkflowStatus,
    reorder_place: str | None = None,
    reorder_story: Story | None = None,
) -> tuple[Decimal, Decimal]:
    total_slots = total_stories_to_reorder + 1

    if not reorder_story:
        latest_story = await stories_repositories.list_stories(
            filters={"status_id": target_status.id}, order_by=["-order"], offset=0, limit=1
        )
        if latest_story:
            pre_order = latest_story[0].order
        else:
            pre_order = DEFAULT_PRE_ORDER
        post_order = pre_order + (DEFAULT_ORDER_OFFSET * total_slots)

    else:
        neighbors = await stories_repositories.list_story_neighbors(
            story=reorder_story, filters={"status_id": reorder_story.status_id}
        )
        if reorder_place == "after":
            pre_order = reorder_story.order
            if neighbors.next:
                post_order = neighbors.next.order
            else:
                post_order = pre_order + (DEFAULT_ORDER_OFFSET * total_slots)

        elif reorder_place == "before":
            post_order = reorder_story.order
            if neighbors.prev:
                pre_order = neighbors.prev.order
            else:
                pre_order = DEFAULT_PRE_ORDER
        else:
            return NotImplemented

    offset = (post_order - pre_order) / total_slots
    return offset, pre_order


async def reorder_stories(
    reordered_by: User,
    project: Project,
    workflow: Workflow,
    target_status_id: UUID,
    stories_refs: list[int],
    reorder: dict[str, Any] | None = None,
) -> ReorderStoriesSerializer:
    # check target_status exists
    target_status = await workflows_repositories.get_workflow_status(
        filters={"project_id": project.id, "workflow_slug": workflow.slug, "id": target_status_id}
    )
    if not target_status:
        raise ex.InvalidStatusError(f"Status {target_status_id} doesn't exist in this project")

    # check anchor story exists
    if reorder:
        if reorder["ref"] in stories_refs:
            raise ex.InvalidStoryRefError(f"Ref {reorder['ref']} should not be part of the stories to reorder")

        reorder_story = await stories_repositories.get_story(
            filters={"workflow_id": workflow.id, "status_id": target_status.id, "ref": reorder["ref"]}
        )
        if not reorder_story:
            raise ex.InvalidStoryRefError(f"Ref {reorder['ref']} doesn't exist in this project")
        reorder_place = reorder["place"]
    else:
        reorder_story = None
        reorder_place = None

    # check all stories "to reorder" exist
    stories_to_reorder = await stories_repositories.list_stories_to_reorder(
        filters={"workflow_id": workflow.id, "refs": stories_refs}
    )
    if len(stories_to_reorder) < len(stories_refs):
        raise ex.InvalidStoryRefError("One or more refs don't exist in this project")

    # calculate offset
    offset, pre_order = await _calculate_offset(
        total_stories_to_reorder=len(stories_to_reorder),
        target_status=target_status,
        reorder_story=reorder_story,
        reorder_place=reorder_place,
    )

    # update stories
    stories_to_update_tmp = {s.ref: s for s in stories_to_reorder}
    stories_to_update = []
    stories_with_changed_status = []
    for i, ref in enumerate(stories_refs):
        story = stories_to_update_tmp[ref]

        if story.status != target_status:
            stories_with_changed_status.append(story)

        story.status = target_status
        story.order = pre_order + (offset * (i + 1))
        stories_to_update.append(story)

    # save stories
    await stories_repositories.bulk_update_stories(
        objs_to_update=stories_to_update, fields_to_update=["status", "order"]
    )

    reorder_story_serializer = serializers_services.serialize_reorder_story(
        status=target_status, stories=stories_refs, reorder=reorder
    )

    # event
    await stories_events.emit_when_stories_are_reordered(project=project, reorder=reorder_story_serializer)

    # notifications
    for story in stories_with_changed_status:
        await stories_notifications.notify_when_story_status_change(
            story=story,
            status=story.status.name,
            emitted_by=reordered_by,
        )

    return reorder_story_serializer


async def _calculate_next_order(status_id: UUID) -> Decimal:
    latest_story = await stories_repositories.list_stories(
        filters={"status_id": status_id}, order_by=["-order"], offset=0, limit=1
    )

    return DEFAULT_ORDER_OFFSET + (latest_story[0].order if latest_story else 0)


##########################################################
# delete story
##########################################################


async def delete_story(story: Story, deleted_by: User) -> bool:
    deleted = await stories_repositories.delete_stories(filters={"id": story.id})
    if deleted > 0:
        await stories_events.emit_event_when_story_is_deleted(
            project=story.project, ref=story.ref, deleted_by=deleted_by
        )
        await stories_notifications.notify_when_story_is_deleted(
            story=story,
            emitted_by=deleted_by,
        )
        return True
    return False
