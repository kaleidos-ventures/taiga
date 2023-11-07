# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from decimal import Decimal
from unittest.mock import patch

import pytest
from taiga.base.repositories.neighbors import Neighbor
from taiga.stories.stories import services
from taiga.stories.stories.services import exceptions as ex
from taiga.workflows.serializers import WorkflowSerializer
from taiga.workflows.serializers.nested import WorkflowStatusNestedSerializer
from tests.utils import factories as f

#######################################################
# create_story
#######################################################


async def test_create_story_ok():
    user = f.build_user()
    status = f.build_workflow_status()
    story = f.build_story(status=status, workflow=status.workflow)
    neighbors = Neighbor(next=f.build_story(), prev=f.build_story())

    with (
        patch("taiga.stories.stories.services.stories_repositories", autospec=True) as fake_stories_repo,
        patch("taiga.stories.stories.services.workflows_repositories", autospec=True) as fake_workflows_repo,
        patch("taiga.stories.stories.services.stories_events", autospec=True) as fake_stories_events,
    ):
        fake_workflows_repo.get_workflow_status.return_value = status
        fake_stories_repo.list_stories.return_value = None
        fake_stories_repo.create_story.return_value = story
        fake_stories_repo.get_story.return_value = story
        fake_stories_repo.list_story_neighbors.return_value = neighbors
        fake_stories_repo.list_story_assignees.return_value = []

        complete_story = await services.create_story(
            project=story.project,
            workflow=status.workflow,
            title=story.title,
            description=story.description,
            status_id=status.id,
            user=user,
        )

        fake_stories_repo.create_story.assert_awaited_once_with(
            title=story.title,
            description=story.description,
            project_id=story.project.id,
            workflow_id=status.workflow.id,
            status_id=status.id,
            user_id=user.id,
            order=Decimal(100),
        )
        fake_workflows_repo.get_workflow_status.assert_awaited_once_with(
            filters={"id": status.id, "workflow_id": status.workflow.id}
        )
        fake_stories_repo.list_stories.assert_awaited_once_with(
            filters={"status_id": status.id}, order_by=["-order"], offset=0, limit=1
        )
        fake_stories_events.emit_event_when_story_is_created.assert_awaited_once_with(
            project=story.project, story=complete_story
        )


async def test_create_story_invalid_status():
    user = f.build_user()
    story = f.build_story()

    with (
        pytest.raises(ex.InvalidStatusError),
        patch("taiga.stories.stories.services.workflows_repositories", autospec=True) as fake_workflows_repo,
    ):
        fake_workflows_repo.get_workflow_status.return_value = None
        await services.create_story(
            project=story.project,
            workflow=build_workflow_serializer(story),
            title=story.title,
            description=story.description,
            status_id="invalid_id",
            user=user,
        )


#######################################################
# list_paginated_stories
#######################################################


async def test_list_paginated_stories():
    story = f.build_story()
    neighbors = Neighbor(next=f.build_story(), prev=f.build_story())

    with (patch("taiga.stories.stories.services.stories_repositories", autospec=True) as fake_stories_repo,):
        fake_stories_repo.get_total_stories.return_value = 1
        fake_stories_repo.list_stories.return_value = [story]
        fake_stories_repo.get_story.return_value = story
        fake_stories_repo.list_story_assignees.return_value = []
        fake_stories_repo.list_story_neighbors.return_value = neighbors

        await services.list_paginated_stories(
            project_id=story.project.id, workflow_slug=story.workflow.slug, offset=0, limit=10
        )
        fake_stories_repo.get_total_stories.assert_awaited_once_with(
            filters={"project_id": story.project.id, "workflow_slug": story.workflow.slug}
        )
        fake_stories_repo.list_stories.assert_awaited_once_with(
            offset=0,
            limit=10,
            select_related=["created_by", "project", "workflow", "status"],
            filters={"project_id": story.project.id, "workflow_slug": story.workflow.slug},
            prefetch_related=["assignees"],
        )


#######################################################
# get story
#######################################################


async def test_get_story_detail_ok():
    story1 = f.build_story(ref=1)
    story2 = f.build_story(ref=2, project=story1.project, workflow=story1.workflow, status=story1.status)
    story3 = f.build_story(ref=3, project=story1.project, workflow=story1.workflow, status=story1.status)
    neighbors = Neighbor(prev=story1, next=story3)

    with patch("taiga.stories.stories.services.stories_repositories", autospec=True) as fake_stories_repo:
        fake_stories_repo.get_story.return_value = story2
        fake_stories_repo.list_story_neighbors.return_value = neighbors
        fake_stories_repo.list_story_assignees.return_value = [f.build_user()]

        story = await services.get_story_detail(project_id=story2.project_id, ref=story2.ref)

        fake_stories_repo.get_story.assert_awaited_once_with(
            filters={"ref": story2.ref, "project_id": story2.project_id},
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
        )

        fake_stories_repo.list_story_neighbors.assert_awaited_once_with(
            story=story2, filters={"workflow_id": story2.workflow_id}
        )

        assert story.ref == story2.ref
        assert story.prev.ref == story1.ref
        assert story.next.ref == story3.ref


async def test_get_story_detail_no_neighbors():
    story1 = f.build_story(ref=1)
    neighbors = Neighbor(prev=None, next=None)

    with patch("taiga.stories.stories.services.stories_repositories", autospec=True) as fake_stories_repo:
        fake_stories_repo.get_story.return_value = story1
        fake_stories_repo.list_story_neighbors.return_value = neighbors
        fake_stories_repo.list_story_assignees.return_value = [f.build_user()]

        story = await services.get_story_detail(project_id=story1.project_id, ref=story1.ref)

        fake_stories_repo.get_story.assert_awaited_once_with(
            filters={"ref": story1.ref, "project_id": story1.project_id},
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
        )

        fake_stories_repo.list_story_neighbors.assert_awaited_once_with(
            story=story1, filters={"workflow_id": story1.workflow_id}
        )

        assert story.ref == story1.ref
        assert story.prev is None
        assert story.next is None


#######################################################
# update_story
#######################################################


async def test_update_story_ok():
    user = f.build_user()
    story = f.build_story()
    values = {"title": "new title", "description": "new description"}
    detailed_story = {
        "ref": story.ref,
        "title": "new title",
        "description": "new description",
        "version": story.version + 1,
    }

    with (
        patch("taiga.stories.stories.services.stories_repositories", autospec=True) as fake_stories_repo,
        patch(
            "taiga.stories.stories.services._validate_and_process_values_to_update", autospec=True
        ) as fake_validate_and_process,
        patch("taiga.stories.stories.services.get_story_detail", autospec=True) as fake_get_story_detail,
        patch("taiga.stories.stories.services.stories_events", autospec=True) as fake_stories_events,
        patch("taiga.stories.stories.services.stories_notifications", autospec=True) as fake_notifications,
    ):
        fake_validate_and_process.return_value = values
        fake_stories_repo.update_story.return_value = True
        fake_get_story_detail.return_value = detailed_story

        updated_story = await services.update_story(
            updated_by=user,
            story=story,
            current_version=story.version,
            values=values,
        )

        fake_validate_and_process.assert_awaited_once_with(
            story=story,
            values=values,
            updated_by=user,
        )
        fake_stories_repo.update_story.assert_awaited_once_with(
            id=story.id,
            current_version=story.version,
            values=values,
        )
        fake_get_story_detail.assert_awaited_once_with(
            project_id=story.project_id,
            ref=story.ref,
            neighbors=None,
        )
        fake_stories_events.emit_event_when_story_is_updated.assert_awaited_once_with(
            project=story.project,
            story=updated_story,
            updates_attrs=[*values],
        )
        fake_notifications.notify_when_story_status_change.assert_not_awaited()
        fake_notifications.notify_when_story_workflow_change.assert_not_awaited()

        assert updated_story == detailed_story


async def test_update_story_workflow_ok():
    user = f.build_user()
    project = f.build_project()
    old_workflow = f.build_workflow(project=project)
    workflow_status1 = f.build_workflow_status(workflow=old_workflow)
    workflow_status2 = f.build_workflow_status(workflow=old_workflow)
    story1 = f.build_story(project=project, workflow=old_workflow, status=workflow_status1)
    story2 = f.build_story(project=project, workflow=old_workflow, status=workflow_status1)
    story3 = f.build_story(project=project, workflow=old_workflow, status=workflow_status2)
    new_workflow = f.build_workflow(project=project)
    workflow_status3 = f.build_workflow_status(workflow=new_workflow)
    values = {
        "version": story2.version + 1,
        "workflow": new_workflow,
        "status": workflow_status3,
        "order": services.DEFAULT_ORDER_OFFSET + story2.order,
    }
    old_neighbors = {
        "prev": {"ref": story1.ref, "title": story1.title},
        "next": {"ref": story3.ref, "title": story3.title},
    }
    detailed_story = {
        "ref": story2.ref,
        "version": story2.version + 1,
        "workflow": {"id": new_workflow.id, "name": new_workflow.name, "slug": new_workflow.slug},
        "prev": {"ref": story1.ref, "title": story1.title},
        "next": {"ref": story3.ref, "title": story3.title},
    }

    with (
        patch("taiga.stories.stories.services.stories_repositories", autospec=True) as fake_stories_repo,
        patch(
            "taiga.stories.stories.services._validate_and_process_values_to_update", autospec=True
        ) as fake_validate_and_process,
        patch("taiga.stories.stories.services.get_story_detail", autospec=True) as fake_get_story_detail,
        patch("taiga.stories.stories.services.stories_events", autospec=True) as fake_stories_events,
        patch("taiga.stories.stories.services.stories_notifications", autospec=True) as fake_notifications,
    ):
        fake_validate_and_process.return_value = values
        fake_stories_repo.list_story_neighbors.return_value = old_neighbors
        fake_stories_repo.update_story.return_value = True
        fake_get_story_detail.return_value = detailed_story

        updated_story = await services.update_story(
            updated_by=user,
            story=story2,
            current_version=story2.version,
            values=values,
        )
        assert updated_story == detailed_story

        fake_validate_and_process.assert_awaited_once_with(
            story=story2,
            values=values,
            updated_by=user,
        )
        fake_stories_repo.update_story.assert_awaited_once_with(
            id=story2.id,
            current_version=story2.version,
            values=values,
        )
        fake_get_story_detail.assert_awaited_once_with(
            project_id=story2.project_id, ref=story2.ref, neighbors=old_neighbors
        )
        fake_stories_events.emit_event_when_story_is_updated.assert_awaited_once_with(
            project=story2.project,
            story=updated_story,
            updates_attrs=[*values],
        )

        fake_notifications.notify_when_story_status_change.assert_not_awaited()
        fake_notifications.notify_when_story_workflow_change.assert_awaited_once()


async def test_update_story_error_wrong_version():
    user = f.build_user()
    story = f.build_story()
    values = {"title": "new title"}

    with (
        patch("taiga.stories.stories.services.stories_repositories", autospec=True) as fake_stories_repo,
        patch(
            "taiga.stories.stories.services._validate_and_process_values_to_update", autospec=True
        ) as fake_validate_and_process,
        patch("taiga.stories.stories.services.get_story_detail", autospec=True) as fake_get_story_detail,
        patch("taiga.stories.stories.services.stories_events", autospec=True) as fake_stories_events,
        patch("taiga.stories.stories.services.stories_notifications", autospec=True) as fake_notifications,
    ):
        fake_validate_and_process.return_value = values
        fake_stories_repo.update_story.return_value = False

        with pytest.raises(ex.UpdatingStoryWithWrongVersionError):
            await services.update_story(
                updated_by=user,
                story=story,
                current_version=story.version,
                values=values,
            )

        fake_validate_and_process.assert_awaited_once_with(
            story=story,
            values=values,
            updated_by=user,
        )
        fake_stories_repo.update_story.assert_awaited_once_with(
            id=story.id,
            current_version=story.version,
            values=values,
        )
        fake_get_story_detail.assert_not_awaited()
        fake_stories_events.emit_event_when_story_is_updated.assert_not_awaited()
        fake_notifications.notify_when_story_status_change.assert_not_awaited()
        fake_notifications.notify_when_story_workflow_change.assert_not_awaited()


#######################################################
# validate_and_process_values_to_update
#######################################################


async def test_validate_and_process_values_to_update_ok_without_status():
    user = f.build_user()
    story = f.build_story()
    values = {"title": "new title", "description": "new description"}

    with (
        patch("taiga.stories.stories.services.stories_repositories", autospec=True) as fake_stories_repo,
        patch("taiga.stories.stories.services.workflows_repositories", autospec=True) as fake_workflows_repo,
    ):
        valid_values = await services._validate_and_process_values_to_update(
            story=story, values=values, updated_by=user
        )

        fake_workflows_repo.get_workflow_status.assert_not_awaited()
        fake_stories_repo.list_stories.assert_not_awaited()

        assert valid_values["title"] == values["title"]
        assert "title_updated_at" in valid_values
        assert "title_updated_by" in valid_values
        assert valid_values["description"] == values["description"]
        assert "description_updated_at" in valid_values
        assert "description_updated_by" in valid_values


async def test_validate_and_process_values_to_update_ok_with_status_empty():
    user = f.build_user()
    story = f.build_story()
    status = f.build_workflow_status()
    values = {"title": "new title", "description": "new description", "status": status.id}

    with (
        patch("taiga.stories.stories.services.stories_repositories", autospec=True) as fake_stories_repo,
        patch("taiga.stories.stories.services.workflows_repositories", autospec=True) as fake_workflows_repo,
    ):
        fake_workflows_repo.get_workflow_status.return_value = status
        fake_stories_repo.list_stories.return_value = []

        valid_values = await services._validate_and_process_values_to_update(
            story=story, values=values, updated_by=user
        )

        fake_workflows_repo.get_workflow_status.assert_awaited_once_with(
            filters={"workflow_id": story.workflow_id, "id": values["status"]},
        )
        fake_stories_repo.list_stories.assert_awaited_once_with(
            filters={"status_id": status.id},
            order_by=["-order"],
            offset=0,
            limit=1,
        )

        assert valid_values["title"] == values["title"]
        assert "title_updated_at" in valid_values
        assert "title_updated_by" in valid_values
        assert valid_values["description"] == values["description"]
        assert "description_updated_at" in valid_values
        assert "description_updated_by" in valid_values
        assert valid_values["status"] == status
        assert valid_values["order"] == services.DEFAULT_ORDER_OFFSET


async def test_validate_and_process_values_to_update_ok_with_status_not_empty():
    user = f.build_user()
    story = f.build_story()
    status = f.build_workflow_status()
    story2 = f.build_story(status=status, order=42)
    values = {"title": "new title", "description": "new description", "status": status.id}

    with (
        patch("taiga.stories.stories.services.stories_repositories", autospec=True) as fake_stories_repo,
        patch("taiga.stories.stories.services.workflows_repositories", autospec=True) as fake_workflows_repo,
    ):
        fake_workflows_repo.get_workflow_status.return_value = status
        fake_stories_repo.list_stories.return_value = [story2]

        valid_values = await services._validate_and_process_values_to_update(
            story=story, values=values, updated_by=user
        )

        fake_workflows_repo.get_workflow_status.assert_awaited_once_with(
            filters={"workflow_id": story.workflow_id, "id": values["status"]},
        )
        fake_stories_repo.list_stories.assert_awaited_once_with(
            filters={"status_id": status.id},
            order_by=["-order"],
            offset=0,
            limit=1,
        )

        assert valid_values["title"] == values["title"]
        assert "title_updated_at" in valid_values
        assert "title_updated_by" in valid_values
        assert valid_values["description"] == values["description"]
        assert "description_updated_at" in valid_values
        assert "description_updated_by" in valid_values
        assert valid_values["status"] == status
        assert valid_values["order"] == services.DEFAULT_ORDER_OFFSET + story2.order


async def test_validate_and_process_values_to_update_ok_with_same_status():
    user = f.build_user()
    status = f.build_workflow_status()
    story = f.build_story(status=status)
    values = {"title": "new title", "description": "new description", "status": status.id}

    with (
        patch("taiga.stories.stories.services.stories_repositories", autospec=True) as fake_stories_repo,
        patch("taiga.stories.stories.services.workflows_repositories", autospec=True) as fake_workflows_repo,
    ):
        fake_workflows_repo.get_workflow_status.return_value = status

        valid_values = await services._validate_and_process_values_to_update(
            story=story, values=values, updated_by=user
        )

        fake_workflows_repo.get_workflow_status.assert_awaited_once_with(
            filters={"workflow_id": story.workflow_id, "id": values["status"]},
        )
        fake_stories_repo.list_stories.assert_not_awaited()

        assert valid_values["title"] == values["title"]
        assert "title_updated_at" in valid_values
        assert "title_updated_by" in valid_values
        assert valid_values["description"] == values["description"]
        assert "description_updated_at" in valid_values
        assert "description_updated_by" in valid_values
        assert "status" not in valid_values
        assert "order" not in valid_values


async def test_validate_and_process_values_to_update_error_wrong_status():
    user = f.build_user()
    story = f.build_story()
    values = {"title": "new title", "description": "new description", "status": "wrong_status"}

    with (
        patch("taiga.stories.stories.services.stories_repositories", autospec=True) as fake_stories_repo,
        patch("taiga.stories.stories.services.workflows_repositories", autospec=True) as fake_workflows_repo,
    ):
        fake_workflows_repo.get_workflow_status.return_value = None

        with pytest.raises(ex.InvalidStatusError):
            await services._validate_and_process_values_to_update(story=story, values=values, updated_by=user)

        fake_workflows_repo.get_workflow_status.assert_awaited_once_with(
            filters={"workflow_id": story.workflow_id, "id": "wrong_status"},
        )
        fake_stories_repo.list_stories.assert_not_awaited()


async def test_validate_and_process_values_to_update_ok_with_workflow():
    user = f.build_user()
    project = f.build_project()
    workflow1 = f.build_workflow(project=project)
    status1 = f.build_workflow_status(workflow=workflow1)
    story1 = f.build_story(project=project, workflow=workflow1, status=status1)
    workflow2 = f.build_workflow(project=project)
    status2 = f.build_workflow_status(workflow=workflow2)
    status3 = f.build_workflow_status(workflow=workflow2)
    story2 = f.build_story(project=project, workflow=workflow2, status=status2)
    values = {"version": story1.version, "workflow": workflow2.slug}

    with (
        patch("taiga.stories.stories.services.stories_repositories", autospec=True) as fake_stories_repo,
        patch("taiga.stories.stories.services.workflows_repositories", autospec=True) as fake_workflows_repo,
    ):
        fake_workflows_repo.get_workflow.return_value = workflow2
        fake_workflows_repo.list_workflow_statuses.return_value = [status2]
        fake_stories_repo.list_stories.return_value = [story2, status3]

        valid_values = await services._validate_and_process_values_to_update(
            story=story1, values=values, updated_by=user
        )

        fake_workflows_repo.get_workflow.assert_awaited_once_with(
            filters={"project_id": story1.project_id, "slug": workflow2.slug}, prefetch_related=["statuses"]
        )
        fake_workflows_repo.list_workflow_statuses.assert_awaited_once_with(
            filters={"workflow_id": workflow2.id}, order_by=["order"], offset=0, limit=1
        )
        fake_stories_repo.list_stories.assert_awaited_once_with(
            filters={"status_id": status2.id},
            order_by=["-order"],
            offset=0,
            limit=1,
        )

        assert valid_values["workflow"] == workflow2
        assert valid_values["order"] == services.DEFAULT_ORDER_OFFSET + story2.order


async def test_validate_and_process_values_to_update_error_wrong_workflow():
    user = f.build_user()
    story = f.build_story()
    values = {"version": story.version, "workflow": "wrong_workflow"}

    with (
        patch("taiga.stories.stories.services.stories_repositories", autospec=True) as fake_stories_repo,
        patch("taiga.stories.stories.services.workflows_repositories", autospec=True) as fake_workflows_repo,
    ):
        fake_workflows_repo.get_workflow.return_value = None

        with pytest.raises(ex.InvalidWorkflowError):
            await services._validate_and_process_values_to_update(story=story, values=values, updated_by=user)

        fake_workflows_repo.get_workflow.assert_awaited_once_with(
            filters={"project_id": story.project_id, "slug": "wrong_workflow"}, prefetch_related=["statuses"]
        )
        fake_stories_repo.list_stories.assert_not_awaited()


async def test_validate_and_process_values_to_update_error_workflow_without_statuses():
    user = f.build_user()
    project = f.build_project()
    workflow1 = f.build_workflow(project=project)
    status1 = f.build_workflow_status(workflow=workflow1)
    story = f.build_story(project=project, workflow=workflow1, status=status1)
    workflow2 = f.build_workflow(project=project, statuses=None)
    values = {"version": story.version, "workflow": workflow2.slug}

    with (
        patch("taiga.stories.stories.services.stories_repositories", autospec=True) as fake_stories_repo,
        patch("taiga.stories.stories.services.workflows_repositories", autospec=True) as fake_workflows_repo,
    ):
        fake_workflows_repo.get_workflow.return_value = workflow2
        fake_workflows_repo.list_workflow_statuses.return_value = []

        with pytest.raises(ex.WorkflowHasNotStatusesError):
            await services._validate_and_process_values_to_update(story=story, values=values, updated_by=user)

        fake_workflows_repo.get_workflow.assert_awaited_once_with(
            filters={"project_id": story.project_id, "slug": workflow2.slug}, prefetch_related=["statuses"]
        )
        fake_workflows_repo.list_workflow_statuses.assert_awaited_once_with(
            filters={"workflow_id": workflow2.id}, order_by=["order"], offset=0, limit=1
        )
        fake_stories_repo.list_stories.assert_not_awaited()


#######################################################
# _calculate_offset
#######################################################


async def test_calculate_offset() -> None:
    target_status = f.build_workflow_status()
    with (patch("taiga.stories.stories.services.stories_repositories", autospec=True) as fake_stories_repo,):
        # No reorder
        latest_story = f.build_story(status=target_status, order=36)
        fake_stories_repo.list_stories.return_value = [latest_story]
        offset, pre_order = await services._calculate_offset(total_stories_to_reorder=1, target_status=target_status)
        assert pre_order == latest_story.order
        assert offset == Decimal(100)

        fake_stories_repo.list_stories.return_value = None
        offset, pre_order = await services._calculate_offset(total_stories_to_reorder=1, target_status=target_status)
        assert pre_order == Decimal(0)
        assert offset == Decimal(100)

        # reorder_story
        reord_st = f.build_story(status=target_status, order=250)
        next_st = f.build_story(status=target_status, order=300)
        prev_st = f.build_story(status=target_status, order=150)

        # after
        fake_stories_repo.list_story_neighbors.return_value = Neighbor(next=next_st, prev=None)
        offset, pre_order = await services._calculate_offset(
            total_stories_to_reorder=1, target_status=target_status, reorder_story=reord_st, reorder_place="after"
        )
        assert pre_order == reord_st.order
        assert offset == Decimal(25)

        fake_stories_repo.list_story_neighbors.return_value = Neighbor(next=None, prev=None)
        offset, pre_order = await services._calculate_offset(
            total_stories_to_reorder=1, target_status=target_status, reorder_story=reord_st, reorder_place="after"
        )
        assert pre_order == reord_st.order
        assert offset == Decimal(100)

        # before
        fake_stories_repo.list_story_neighbors.return_value = Neighbor(next=None, prev=prev_st)
        offset, pre_order = await services._calculate_offset(
            total_stories_to_reorder=1, target_status=target_status, reorder_story=reord_st, reorder_place="before"
        )
        assert pre_order == prev_st.order
        assert offset == Decimal(50)

        fake_stories_repo.list_story_neighbors.return_value = Neighbor(next=None, prev=None)
        offset, pre_order = await services._calculate_offset(
            total_stories_to_reorder=1, target_status=target_status, reorder_story=reord_st, reorder_place="before"
        )
        assert pre_order == Decimal(0)
        assert offset == Decimal(125)


#######################################################
# update reorder_stories
#######################################################


async def test_reorder_stories_ok():
    user = f.build_user()
    project = f.build_project()
    workflow = f.build_workflow()
    target_status = f.build_workflow_status()
    reorder_story = f.build_story(ref=3)
    s1 = f.build_story(ref=13)
    s2 = f.build_story(ref=54)
    s3 = f.build_story(ref=2)

    with (
        patch("taiga.stories.stories.services.workflows_repositories", autospec=True) as fake_workflows_repo,
        patch("taiga.stories.stories.services.stories_repositories", autospec=True) as fake_stories_repo,
        patch("taiga.stories.stories.services.stories_events", autospec=True) as fake_stories_events,
        patch("taiga.stories.stories.services.stories_notifications", autospec=True) as fake_notifications,
    ):
        fake_workflows_repo.get_workflow_status.return_value = target_status
        fake_stories_repo.get_story.return_value = reorder_story
        fake_stories_repo.list_stories_to_reorder.return_value = [s1, s2, s3]

        await services.reorder_stories(
            reordered_by=user,
            project=project,
            target_status_id=target_status.id,
            workflow=workflow,
            stories_refs=[13, 54, 2],
            reorder={"place": "after", "ref": reorder_story.ref},
        )

        fake_stories_repo.bulk_update_stories.assert_awaited_once_with(
            objs_to_update=[s1, s2, s3], fields_to_update=["status", "order"]
        )
        fake_stories_events.emit_when_stories_are_reordered.assert_awaited_once()
        assert fake_notifications.notify_when_story_status_change.await_count == 3


async def test_reorder_story_workflowstatus_does_not_exist():
    user = f.build_user()
    project = f.build_project()
    workflow = f.build_workflow()

    with (
        patch("taiga.stories.stories.services.workflows_repositories", autospec=True) as fake_workflows_repo,
        pytest.raises(ex.InvalidStatusError),
    ):
        fake_workflows_repo.get_workflow_status.return_value = None

        await services.reorder_stories(
            reordered_by=user,
            project=project,
            target_status_id="non-existing",
            workflow=workflow,
            stories_refs=[13, 54, 2],
            reorder={"place": "after", "ref": 3},
        )


async def test_reorder_story_story_ref_does_not_exist():
    user = f.build_user()
    project = f.build_project()
    workflow = f.build_workflow()
    target_status = f.build_workflow_status()

    with (
        patch("taiga.stories.stories.services.workflows_repositories", autospec=True) as fake_workflows_repo,
        patch("taiga.stories.stories.services.stories_repositories", autospec=True) as fake_stories_repo,
        pytest.raises(ex.InvalidStoryRefError),
    ):
        fake_workflows_repo.get_workflow_status.return_value = target_status

        fake_stories_repo.get_story.return_value = None

        await services.reorder_stories(
            reordered_by=user,
            project=project,
            target_status_id=target_status.id,
            workflow=workflow,
            stories_refs=[13, 54, 2],
            reorder={"place": "after", "ref": 3},
        )


async def test_reorder_story_not_all_stories_exist():
    user = f.build_user()
    project = f.build_project()
    workflow = f.build_workflow()
    target_status = f.build_workflow_status()
    reorder_story = f.build_story(ref=3)

    with (
        patch("taiga.stories.stories.services.workflows_repositories", autospec=True) as fake_workflows_repo,
        patch("taiga.stories.stories.services.stories_repositories", autospec=True) as fake_stories_repo,
        pytest.raises(ex.InvalidStoryRefError),
    ):
        fake_workflows_repo.get_workflow_status.return_value = target_status

        fake_stories_repo.get_story.return_value = reorder_story
        fake_stories_repo.list_stories.return_value = [f.build_story]

        await services.reorder_stories(
            reordered_by=user,
            project=project,
            target_status_id=target_status.id,
            workflow=workflow,
            stories_refs=[13, 54, 2],
            reorder={"place": "after", "ref": reorder_story.ref},
        )


#######################################################
# delete story
#######################################################


async def test_delete_story_fail():
    user = f.build_user()
    story = f.build_story()

    with (
        patch("taiga.stories.stories.services.stories_repositories", autospec=True) as fake_story_repo,
        patch("taiga.stories.stories.services.stories_events", autospec=True) as fake_stories_events,
        patch("taiga.stories.stories.services.stories_notifications", autospec=True) as fake_notifications,
    ):
        fake_story_repo.delete_stories.return_value = 0

        assert not (await services.delete_story(story=story, deleted_by=user))

        fake_story_repo.delete_stories.assert_awaited_once_with(
            filters={"id": story.id},
        )
        fake_stories_events.emit_event_when_story_is_deleted.assert_not_awaited()
        fake_notifications.notify_when_story_is_deleted.assert_not_awaited()


async def test_delete_story_ok():
    user = f.build_user()
    story = f.build_story()

    with (
        patch("taiga.stories.stories.services.stories_repositories", autospec=True) as fake_story_repo,
        patch("taiga.stories.stories.services.stories_events", autospec=True) as fake_stories_events,
        patch("taiga.stories.stories.services.stories_notifications", autospec=True) as fake_notifications,
    ):
        fake_story_repo.delete_stories.return_value = 1

        assert await services.delete_story(story=story, deleted_by=user)
        fake_story_repo.delete_stories.assert_awaited_once_with(
            filters={"id": story.id},
        )
        fake_stories_events.emit_event_when_story_is_deleted.assert_awaited_once_with(
            project=story.project, ref=story.ref, deleted_by=user
        )
        fake_notifications.notify_when_story_is_deleted.assert_awaited_once_with(story=story, emitted_by=user)


#######################################################
# utils
#######################################################


def build_workflow_serializer(story):
    return WorkflowSerializer(
        id=story.workflow.id,
        name=story.workflow.name,
        slug=story.workflow.slug,
        order=story.workflow.order,
        statuses=[build_nested_status_serializer(story.status)],
    )


def build_nested_status_serializer(status):
    return WorkflowStatusNestedSerializer(
        id=status.id,
        name=status.name,
        color=status.color,
        order=status.order,
    )
