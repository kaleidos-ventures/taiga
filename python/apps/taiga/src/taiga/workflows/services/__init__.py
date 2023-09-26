# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC


from decimal import Decimal
from typing import Any, cast
from uuid import UUID

from taiga.conf import settings
from taiga.projects.projects import repositories as projects_repositories
from taiga.projects.projects.models import Project
from taiga.stories.stories import repositories as stories_repositories
from taiga.stories.stories import services as stories_services
from taiga.users.models import User
from taiga.workflows import events as workflows_events
from taiga.workflows import repositories as workflows_repositories
from taiga.workflows.models import Workflow, WorkflowStatus
from taiga.workflows.serializers import DeleteWorkflowSerializer, ReorderWorkflowStatusesSerializer, WorkflowSerializer
from taiga.workflows.serializers import services as serializers_services
from taiga.workflows.services import exceptions as ex

DEFAULT_ORDER_OFFSET = Decimal(100)  # default offset when adding a workflow or workflow status
DEFAULT_PRE_ORDER = Decimal(0)  # default pre_position when adding a story at the beginning


##########################################################
# create workflow
##########################################################


async def create_workflow(project: Project, name: str) -> WorkflowSerializer:
    workflows = await workflows_repositories.list_workflows(filters={"project_id": project.id}, order_by=["-order"])

    # validate num workflows
    num_workflows = len(workflows) if workflows else 0
    if num_workflows >= settings.MAX_NUM_WORKFLOWS:
        raise ex.MaxNumWorkflowCreatedError("Maximum number of workflows is reached")

    # calculate order
    order = DEFAULT_ORDER_OFFSET + (workflows[0].order if workflows else 0)

    workflow = await workflows_repositories.create_workflow(project=project, name=name, order=order)

    # apply default workflow statuses from project template
    if template := await projects_repositories.get_project_template(
        filters={"slug": settings.DEFAULT_PROJECT_TEMPLATE}
    ):
        await workflows_repositories.apply_default_workflow_statuses(template=template, workflow=workflow)
    else:
        raise Exception(
            f"Default project template '{settings.DEFAULT_PROJECT_TEMPLATE}' not found. "
            "Try to load fixtures again and check if the error persist."
        )

    workflow_statuses = await workflows_repositories.list_workflow_statuses(filters={"workflow_id": workflow.id})
    serialized_workflow = serializers_services.serialize_workflow(
        workflow=workflow, workflow_statuses=workflow_statuses
    )

    # emit event
    await workflows_events.emit_event_when_workflow_is_created(project=workflow.project, workflow=serialized_workflow)

    return serialized_workflow


##########################################################
# list workflows
##########################################################


async def list_workflows(project_id: UUID) -> list[WorkflowSerializer]:
    workflows = await workflows_repositories.list_workflows(
        filters={
            "project_id": project_id,
        },
        prefetch_related=["statuses"],
    )

    return [
        serializers_services.serialize_workflow(
            workflow=workflow,
            workflow_statuses=await workflows_repositories.list_workflow_statuses(filters={"workflow_id": workflow.id}),
        )
        for workflow in workflows
    ]


##########################################################
# get workflow
##########################################################


async def get_workflow(project_id: UUID, workflow_slug: str) -> Workflow | None:
    return await workflows_repositories.get_workflow(
        filters={
            "project_id": project_id,
            "slug": workflow_slug,
        },
        select_related=["project", "workspace"],
    )


async def get_workflow_detail(project_id: UUID, workflow_slug: str) -> WorkflowSerializer:
    workflow = cast(
        Workflow,
        await workflows_repositories.get_workflow(
            filters={
                "project_id": project_id,
                "slug": workflow_slug,
            },
            select_related=["project"],
        ),
    )
    workflow_statuses = await workflows_repositories.list_workflow_statuses(filters={"workflow_id": workflow.id})
    return serializers_services.serialize_workflow(workflow=workflow, workflow_statuses=workflow_statuses)


async def get_delete_workflow_detail(project_id: UUID, workflow_slug: str) -> DeleteWorkflowSerializer:
    workflow = cast(
        Workflow,
        await workflows_repositories.get_workflow(
            filters={
                "project_id": project_id,
                "slug": workflow_slug,
            },
            select_related=["project"],
        ),
    )
    workflow_statuses = await workflows_repositories.list_workflow_statuses(filters={"workflow_id": workflow.id})
    workflow_stories = await stories_services.list_all_stories(
        project_id=project_id,
        workflow_slug=workflow_slug,
    )
    return serializers_services.serialize_delete_workflow_detail(
        workflow=workflow,
        workflow_statuses=workflow_statuses,
        workflow_stories=workflow_stories,
    )


##########################################################
# update workflow
##########################################################


async def update_workflow(project_id: UUID, workflow: Workflow, values: dict[str, Any] = {}) -> WorkflowSerializer:
    updated_workflow = await workflows_repositories.update_workflow(workflow=workflow, values=values)
    updated_workflow_detail = await get_workflow_detail(project_id=project_id, workflow_slug=updated_workflow.slug)

    # Emit event
    await workflows_events.emit_event_when_workflow_is_updated(
        project=workflow.project,
        workflow=updated_workflow_detail,
    )

    return updated_workflow_detail


##########################################################
# delete workflow
##########################################################


async def delete_workflow(workflow: Workflow, target_workflow_slug: str | None = None) -> bool:
    """
    This method deletes a workflow, providing the option to first migrate its workflow statuses to another workflow
    in the same project.

    :param workflow: the workflow to delete
    :param target_workflow_slug: the workflow slug to which move their statuses from the workflow being deleted
        - if not received, the workflow, statuses and its contained stories will be deleted
        - if received, the workflow will be deleted but its statuses and stories won't (they will be appended to the
         last status of the specified workflow).
    :return: bool
    """
    # recover the workflow's detail before being deleted
    workflow_detail = await get_delete_workflow_detail(project_id=workflow.project_id, workflow_slug=workflow.slug)
    target_workflow = None
    if target_workflow_slug:
        target_workflow = await get_workflow(project_id=workflow.project_id, workflow_slug=target_workflow_slug)
        if not target_workflow:
            raise ex.NonExistingMoveToWorkflow(f"The workflow '{target_workflow_slug}' doesn't exist")
        if target_workflow.id == workflow.id:
            raise ex.SameMoveToWorkflow("The to-be-deleted workflow and the target-workflow cannot be the same")

        statuses_to_move = await workflows_repositories.list_workflow_statuses(
            filters={"workflow_id": workflow.id},
            order_by=["order"],
        )

        if statuses_to_move:
            target_workflow_statuses = await workflows_repositories.list_workflow_statuses(
                filters={"workflow_id": target_workflow.id}, order_by=["-order"], offset=0, limit=1
            )
            #  no statuses in the target_workflow (no valid anchor). The order of the statuses will be preserved
            if not target_workflow_statuses:
                await reorder_workflow_statuses(
                    target_workflow=target_workflow,
                    statuses=[status.id for status in statuses_to_move],
                    reorder=None,
                    source_workflow=workflow,
                )
            # existing statuses in the target_workflow. The anchor status will be the last one
            else:
                await reorder_workflow_statuses(
                    target_workflow=target_workflow,
                    statuses=[status.id for status in statuses_to_move],
                    reorder={"place": "after", "status": target_workflow_statuses[0].id},
                    source_workflow=workflow,
                )

    deleted = await workflows_repositories.delete_workflow(filters={"id": workflow.id})

    if deleted > 0:
        target_workflow_detail = None
        # events will render the final statuses in the target_workflow AFTER any reorder process
        if target_workflow:
            target_workflow_detail = await get_workflow_detail(
                project_id=target_workflow.project_id, workflow_slug=target_workflow.slug
            )

        await workflows_events.emit_event_when_workflow_is_deleted(
            project=workflow.project,
            workflow=workflow_detail,
            target_workflow=target_workflow_detail,
        )
        return True

    return False


##########################################################
# create workflow status
##########################################################


async def create_workflow_status(name: str, color: int, workflow: Workflow) -> WorkflowStatus:
    latest_status = await workflows_repositories.list_workflow_statuses(
        filters={"workflow_id": workflow.id}, order_by=["-order"], offset=0, limit=1
    )
    order = DEFAULT_ORDER_OFFSET + (latest_status[0].order if latest_status else 0)

    # Create workflow status
    workflow_status = await workflows_repositories.create_workflow_status(
        name=name, color=color, order=order, workflow=workflow
    )

    # Emit event
    await workflows_events.emit_event_when_workflow_status_is_created(
        project=workflow.project, workflow_status=workflow_status
    )

    return workflow_status


##########################################################
# get workflow status
##########################################################


async def get_workflow_status(project_id: UUID, workflow_slug: str, id: UUID) -> WorkflowStatus | None:
    return await workflows_repositories.get_workflow_status(
        filters={
            "project_id": project_id,
            "workflow_slug": workflow_slug,
            "id": id,
        },
        select_related=["workflow", "project", "workspace"],
    )


##########################################################
# update workflow status
##########################################################


async def update_workflow_status(workflow_status: WorkflowStatus, values: dict[str, Any] = {}) -> WorkflowStatus:
    if not values:
        return workflow_status

    if "name" in values and values["name"] is None:
        raise ex.TaigaValidationError("Name cannot be null")

    updated_status = await workflows_repositories.update_workflow_status(workflow_status=workflow_status, values=values)

    await workflows_events.emit_event_when_workflow_status_is_updated(
        project=workflow_status.project, workflow_status=updated_status
    )

    return updated_status


##########################################################
# update reorder workflow statuses
##########################################################


async def _calculate_offset(
    workflow: Workflow,
    total_statuses_to_reorder: int,
    reorder_status: WorkflowStatus,
    reorder_place: str,
) -> tuple[Decimal, Decimal]:
    total_slots = total_statuses_to_reorder + 1

    neighbors = await workflows_repositories.list_workflow_status_neighbors(
        status=reorder_status, filters={"workflow_id": workflow.id}
    )

    if reorder_place == "after":
        pre_order = reorder_status.order
        if neighbors.next:
            post_order = neighbors.next.order
        else:
            post_order = pre_order + (DEFAULT_ORDER_OFFSET * total_slots)

    elif reorder_place == "before":
        post_order = reorder_status.order
        if neighbors.prev:
            pre_order = neighbors.prev.order
        else:
            pre_order = DEFAULT_PRE_ORDER

    else:
        return NotImplemented

    offset = (post_order - pre_order) / total_slots
    return offset, pre_order


async def reorder_workflow_statuses(
    target_workflow: Workflow,
    statuses: list[UUID],
    reorder: dict[str, Any] | None,
    source_workflow: Workflow | None = None,
) -> ReorderWorkflowStatusesSerializer:
    """
    Reorder the statuses from a workflow to another (can be the same), before or after an existing status
    (anchor) when a reorder criteria is provided, or preserving its original order when not provided.
    :param target_workflow: the destination workflow for the statuses being reordered
    :param statuses: the statuses id's to reorder (move) in the "target_workflow"
    :param reorder: reorder["status"] anchor workflow status's id, reorder["place"]: position strategy ["before","after]
        None will mean there's no anchor status preserving their original order
    :param source_workflow: Workflow containing the statuses to reorder.
        None will mean the "source_workflow" and the "target_workflow" are the same
    :return:
    """
    if not source_workflow:
        source_workflow = target_workflow

    statuses_to_reorder = await workflows_repositories.list_workflow_statuses_to_reorder(
        filters={"workflow_id": source_workflow.id, "ids": statuses}
    )
    if len(statuses_to_reorder) < len(statuses):
        raise ex.InvalidWorkflowStatusError("One or more statuses don't exist in this workflow")

    statuses_to_update = []

    if not reorder:
        if source_workflow == target_workflow:
            raise ex.NonExistingMoveToStatus("Reorder criteria required")
        else:
            statuses_to_update_tmp = {s.id: s for s in statuses_to_reorder}
            for i, id in enumerate(statuses):
                status = statuses_to_update_tmp[id]
                status.workflow = target_workflow
                statuses_to_update.append(status)
    # position statuses according to this anchor status
    elif reorder:
        # check anchor workflow status exists
        reorder_status = await workflows_repositories.get_workflow_status(
            filters={"workflow_id": target_workflow.id, "id": reorder["status"]}
        )
        if not reorder_status:
            # re-ordering in the same workflow must have a valid anchor status
            raise ex.InvalidWorkflowStatusError(f"Status {reorder['status']} doesn't exist in this workflow")

        if reorder["status"] in statuses:
            raise ex.InvalidWorkflowStatusError(
                f"Status {reorder['status']} should not be part of the statuses to reorder"
            )
        reorder_place = reorder["place"]
        # calculate offset
        offset, pre_order = await _calculate_offset(
            workflow=target_workflow,
            total_statuses_to_reorder=len(statuses_to_reorder),
            reorder_status=reorder_status,
            reorder_place=reorder_place,
        )
        # update workflow statuses
        statuses_to_update_tmp = {s.id: s for s in statuses_to_reorder}
        for i, id in enumerate(statuses):
            status = statuses_to_update_tmp[id]
            status.order = pre_order + (offset * (i + 1))
            status.workflow = target_workflow
            statuses_to_update.append(status)

    # save stories
    await workflows_repositories.bulk_update_workflow_statuses(
        objs_to_update=statuses_to_update, fields_to_update=["order", "workflow"]
    )

    if source_workflow != target_workflow and statuses_to_reorder:
        # update the workflow to the moved stories
        await stories_repositories.bulk_update_workflow_to_stories(
            statuses_ids=statuses,
            old_workflow_id=source_workflow.id,
            new_workflow_id=target_workflow.id,
        )

    reorder_status_serializer = serializers_services.serialize_reorder_workflow_statuses(
        workflow=target_workflow, statuses=statuses, reorder=reorder
    )

    # event
    await workflows_events.emit_event_when_workflow_statuses_are_reordered(
        project=target_workflow.project, reorder=reorder_status_serializer
    )

    return reorder_status_serializer


##########################################################
# delete workflow status
##########################################################


async def delete_workflow_status(
    workflow_status: WorkflowStatus, deleted_by: User, target_status_id: UUID | None
) -> bool:
    """
    This method deletes a workflow status, providing the option to first migrate its stories to another workflow
    status of the same workflow.

    :param deleted_by: the user who is deleting the workflow status
    :param workflow_status: the workflow status to delete
    :param target_status_id: the workflow status's id to which move the stories from the status being deleted
        - if not received, all the workflow status and its contained stories will be deleted
        - if received, the workflow status will be deleted but its contained stories won't (they will be first moved to
         the specified status)
    :return: bool
    """
    # before deleting the workflow status, its stories may be transferred to an existing workflow status
    # in the same workflow
    target_status = None
    if target_status_id:
        target_status = await get_workflow_status(
            project_id=workflow_status.project.id, workflow_slug=workflow_status.workflow.slug, id=target_status_id
        )
        if not target_status:
            raise ex.NonExistingMoveToStatus(f"The status '{target_status_id}' doesn't exist")
        if target_status.id == workflow_status.id:
            raise ex.SameMoveToStatus("The to-be-deleted status and the target-status cannot be the same")

        stories_to_move = await stories_repositories.list_stories(
            filters={
                "status_id": workflow_status.id,
            },
            order_by=["order"],
        )

        if stories_to_move:
            await stories_services.reorder_stories(
                reordered_by=deleted_by,
                project=workflow_status.project,
                workflow=workflow_status.workflow,
                target_status_id=target_status_id,
                stories_refs=[story.ref for story in stories_to_move],
            )

    deleted = await workflows_repositories.delete_workflow_status(filters={"id": workflow_status.id})
    if deleted > 0:
        await workflows_events.emit_event_when_workflow_status_is_deleted(
            project=workflow_status.project, workflow_status=workflow_status, target_status=target_status
        )
        return True

    return False
