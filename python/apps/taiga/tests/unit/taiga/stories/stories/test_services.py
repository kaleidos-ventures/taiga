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
from taiga.workflows.serializers import WorkflowSerializer, WorkflowStatusSerializer
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
        fake_workflows_repo.get_status.return_value = status
        fake_stories_repo.list_stories.return_value = None
        fake_stories_repo.create_story.return_value = story
        fake_stories_repo.get_story.return_value = story
        fake_stories_repo.list_story_neighbors.return_value = neighbors
        fake_stories_repo.list_story_assignees.return_value = []

        complete_story = await services.create_story(
            project=story.project,
            workflow=status.workflow,
            title=story.title,
            status_slug=status.slug,
            user=user,
        )

        fake_stories_repo.create_story.assert_awaited_once_with(
            title=story.title,
            project_id=story.project.id,
            workflow_id=status.workflow.id,
            status_id=status.id,
            user_id=user.id,
            order=Decimal(100),
        )
        fake_workflows_repo.get_status.assert_awaited_once_with(
            filters={"slug": status.slug, "workflow_id": status.workflow.id}
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

        fake_workflows_repo.get_status.return_value = None
        await services.create_story(
            project=story.project,
            workflow=build_workflow_serializer(story),
            title=story.title,
            status_slug="invalid_slug",
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
            select_related=["created_by", "project", "workflow", "status", "workspace", "title_updated_by"],
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
            select_related=["created_by", "project", "workflow", "status", "workspace", "title_updated_by"],
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
    story = f.build_story()
    values = {"title": "new title"}
    detailed_story = {
        "ref": story.ref,
        "title": "new_title",
        "version": story.version + 1,
    }

    with (
        patch("taiga.stories.stories.services.stories_repositories", autospec=True) as fake_stories_repo,
        patch(
            "taiga.stories.stories.services._validate_and_process_values_to_update", autospec=True
        ) as fake_validate_and_process,
        patch("taiga.stories.stories.services.get_story_detail", autospec=True) as fake_get_story_detail,
        patch("taiga.stories.stories.services.stories_events", autospec=True) as fake_stories_events,
    ):
        fake_validate_and_process.return_value = values
        fake_stories_repo.update_story.return_value = True
        fake_get_story_detail.return_value = detailed_story

        updated_story = await services.update_story(
            story=story,
            current_version=story.version,
            values=values,
        )

        fake_validate_and_process.assert_awaited_once_with(
            story=story,
            values=values,
        )
        fake_stories_repo.update_story.assert_awaited_once_with(
            id=story.id,
            current_version=story.version,
            values=values,
        )
        fake_get_story_detail.assert_awaited_once_with(
            project_id=story.project_id,
            ref=story.ref,
        )
        fake_stories_events.emit_event_when_story_is_updated.assert_awaited_once_with(
            project=story.project,
            story=updated_story,
            updates_attrs=[*values],
        )
        assert updated_story == detailed_story


async def test_update_story_error_wrong_version():
    story = f.build_story()
    values = {"title": "new title"}

    with (
        patch("taiga.stories.stories.services.stories_repositories", autospec=True) as fake_stories_repo,
        patch(
            "taiga.stories.stories.services._validate_and_process_values_to_update", autospec=True
        ) as fake_validate_and_process,
        patch("taiga.stories.stories.services.get_story_detail", autospec=True) as fake_get_story_detail,
        patch("taiga.stories.stories.services.stories_events", autospec=True) as fake_stories_events,
    ):
        fake_validate_and_process.return_value = values
        fake_stories_repo.update_story.return_value = False

        with (pytest.raises(ex.UpdatingStoryWithWrongVersionError)):
            await services.update_story(story=story, current_version=story.version, values=values)
        fake_validate_and_process.assert_awaited_once_with(
            story=story,
            values=values,
        )
        fake_stories_repo.update_story.assert_awaited_once_with(
            id=story.id,
            current_version=story.version,
            values=values,
        )
        fake_get_story_detail.assert_not_awaited()
        fake_stories_events.emit_event_when_story_is_updated.assert_not_awaited()


#######################################################
# validate_and_process_values_to_update
#######################################################


async def test_validate_and_process_values_to_update_ok_without_status():
    story = f.build_story()
    values = {"title": "new_title"}

    with (
        patch("taiga.stories.stories.services.stories_repositories", autospec=True) as fake_stories_repo,
        patch("taiga.stories.stories.services.workflows_repositories", autospec=True) as fake_workflows_repo,
    ):
        valid_values = await services._validate_and_process_values_to_update(story=story, values=values)

        fake_workflows_repo.get_status.assert_not_awaited()
        fake_stories_repo.list_stories.assert_not_awaited()

        assert valid_values == values


async def test_validate_and_process_values_to_update_ok_with_status_empty():
    story = f.build_story()
    status = f.build_workflow_status()
    values = {"title": "new_title", "status": status.slug}

    with (
        patch("taiga.stories.stories.services.stories_repositories", autospec=True) as fake_stories_repo,
        patch("taiga.stories.stories.services.workflows_repositories", autospec=True) as fake_workflows_repo,
    ):
        fake_workflows_repo.get_status.return_value = status
        fake_stories_repo.list_stories.return_value = []

        valid_values = await services._validate_and_process_values_to_update(story=story, values=values)

        fake_workflows_repo.get_status.assert_awaited_once_with(
            filters={"workflow_id": story.workflow_id, "slug": values["status"]},
        )
        fake_stories_repo.list_stories.assert_awaited_once_with(
            filters={"status_id": status.id},
            order_by=["-order"],
            offset=0,
            limit=1,
        )

        assert valid_values["title"] == values["title"]
        assert valid_values["status"] == status
        assert valid_values["order"] == services.DEFAULT_ORDER_OFFSET


async def test_validate_and_process_values_to_update_ok_with_status_not_empty():
    story = f.build_story()
    status = f.build_workflow_status()
    story2 = f.build_story(status=status, order=42)
    values = {"title": "new_title", "status": status.slug}

    with (
        patch("taiga.stories.stories.services.stories_repositories", autospec=True) as fake_stories_repo,
        patch("taiga.stories.stories.services.workflows_repositories", autospec=True) as fake_workflows_repo,
    ):
        fake_workflows_repo.get_status.return_value = status
        fake_stories_repo.list_stories.return_value = [story2]

        valid_values = await services._validate_and_process_values_to_update(story=story, values=values)

        fake_workflows_repo.get_status.assert_awaited_once_with(
            filters={"workflow_id": story.workflow_id, "slug": values["status"]},
        )
        fake_stories_repo.list_stories.assert_awaited_once_with(
            filters={"status_id": status.id},
            order_by=["-order"],
            offset=0,
            limit=1,
        )

        assert valid_values["title"] == values["title"]
        assert valid_values["status"] == status
        assert valid_values["order"] == services.DEFAULT_ORDER_OFFSET + story2.order


async def test_validate_and_process_values_to_update_ok_with_same_status():
    status = f.build_workflow_status()
    story = f.build_story(status=status)
    values = {"title": "new_title", "status": status.slug}

    with (
        patch("taiga.stories.stories.services.stories_repositories", autospec=True) as fake_stories_repo,
        patch("taiga.stories.stories.services.workflows_repositories", autospec=True) as fake_workflows_repo,
    ):
        fake_workflows_repo.get_status.return_value = status

        valid_values = await services._validate_and_process_values_to_update(story=story, values=values)

        fake_workflows_repo.get_status.assert_awaited_once_with(
            filters={"workflow_id": story.workflow_id, "slug": values["status"]},
        )
        fake_stories_repo.list_stories.assert_not_awaited()

        assert valid_values["title"] == values["title"]
        assert "status" not in valid_values
        assert "order" not in valid_values


async def test_validate_and_process_values_to_update_error_wrong_status():
    story = f.build_story()
    values = {"title": "new_title", "status": "wrong_status"}

    with (
        patch("taiga.stories.stories.services.stories_repositories", autospec=True) as fake_stories_repo,
        patch("taiga.stories.stories.services.workflows_repositories", autospec=True) as fake_workflows_repo,
    ):
        fake_workflows_repo.get_status.return_value = None

        with (pytest.raises(ex.InvalidStatusError)):
            await services._validate_and_process_values_to_update(story=story, values=values)

        fake_workflows_repo.get_status.assert_awaited_once_with(
            filters={"workflow_id": story.workflow_id, "slug": "wrong_status"},
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
    with (
        patch("taiga.stories.stories.services.workflows_repositories", autospec=True) as fake_workflows_repo,
        patch("taiga.stories.stories.services.stories_repositories", autospec=True) as fake_stories_repo,
        patch("taiga.stories.stories.services.stories_events", autospec=True) as fake_stories_events,
    ):
        target_status = f.build_workflow_status()
        fake_workflows_repo.get_status.return_value = target_status
        reorder_story = f.build_story(ref=3)
        fake_stories_repo.get_story.return_value = reorder_story
        s1 = f.build_story(ref=13)
        s2 = f.build_story(ref=54)
        s3 = f.build_story(ref=2)
        fake_stories_repo.list_stories_to_reorder.return_value = [s1, s2, s3]

        await services.reorder_stories(
            project=f.build_project(),
            target_status_slug=target_status.slug,
            workflow=f.build_workflow(),
            stories_refs=[13, 54, 2],
            reorder={"place": "after", "ref": reorder_story.ref},
        )

        fake_stories_repo.bulk_update_stories.assert_awaited_once_with(
            objs_to_update=[s1, s2, s3], fields_to_update=["status", "order"]
        )
        fake_stories_events.emit_when_stories_are_reordered.assert_awaited_once()


async def test_reorder_story_workflowstatus_does_not_exist():
    with (
        patch("taiga.stories.stories.services.workflows_repositories", autospec=True) as fake_workflows_repo,
        pytest.raises(ex.InvalidStatusError),
    ):
        fake_workflows_repo.get_status.return_value = None

        await services.reorder_stories(
            project=f.build_project(),
            target_status_slug="non-existing",
            workflow=f.build_workflow(),
            stories_refs=[13, 54, 2],
            reorder={"place": "after", "ref": 3},
        )


async def test_reorder_story_story_ref_does_not_exist():
    with (
        patch("taiga.stories.stories.services.workflows_repositories", autospec=True) as fake_workflows_repo,
        patch("taiga.stories.stories.services.stories_repositories", autospec=True) as fake_stories_repo,
        pytest.raises(ex.InvalidStoryRefError),
    ):
        target_status = f.build_workflow_status()
        fake_workflows_repo.get_status.return_value = target_status

        fake_stories_repo.get_story.return_value = None

        await services.reorder_stories(
            project=f.build_project(),
            target_status_slug=target_status.slug,
            workflow=f.build_workflow(),
            stories_refs=[13, 54, 2],
            reorder={"place": "after", "ref": 3},
        )


async def test_reorder_story_not_all_stories_exist():
    with (
        patch("taiga.stories.stories.services.workflows_repositories", autospec=True) as fake_workflows_repo,
        patch("taiga.stories.stories.services.stories_repositories", autospec=True) as fake_stories_repo,
        pytest.raises(ex.InvalidStoryRefError),
    ):
        target_status = f.build_workflow_status()
        fake_workflows_repo.get_status.return_value = target_status

        reorder_story = f.build_story(ref=3)
        fake_stories_repo.get_story.return_value = reorder_story
        fake_stories_repo.list_stories.return_value = [f.build_story]

        await services.reorder_stories(
            project=f.build_project(),
            target_status_slug=target_status.slug,
            workflow=f.build_workflow(),
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
    ):
        fake_story_repo.delete_stories.return_value = 0

        await services.delete_story(story=story, deleted_by=user)
        fake_stories_events.emit_event_when_story_is_deleted.assert_not_awaited()
        fake_story_repo.delete_stories.assert_awaited_once_with(
            filters={"id": story.id},
        )


async def test_delete_story_ok():
    user = f.build_user()
    story = f.build_story()

    with (
        patch("taiga.stories.stories.services.stories_repositories", autospec=True) as fake_story_repo,
        patch("taiga.stories.stories.services.stories_events", autospec=True) as fake_stories_events,
    ):
        fake_story_repo.delete_stories.return_value = 1

        await services.delete_story(story=story, deleted_by=user)
        fake_stories_events.emit_event_when_story_is_deleted.assert_awaited_once_with(
            project=story.project, ref=story.ref, deleted_by=user
        )
        fake_story_repo.delete_stories.assert_awaited_once_with(
            filters={"id": story.id},
        )


#######################################################
# utils
#######################################################


def build_workflow_serializer(story):
    return WorkflowSerializer(
        id=story.workflow.id,
        name=story.workflow.name,
        slug=story.workflow.slug,
        order=story.workflow.order,
        statuses=[build_status_serializer(story.status)],
    )


def build_status_serializer(status):
    return WorkflowStatusSerializer(
        id=status.id, name=status.name, slug=status.slug, color=status.color, order=status.order
    )
