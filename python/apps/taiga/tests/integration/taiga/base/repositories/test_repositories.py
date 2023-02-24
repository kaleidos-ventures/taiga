# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC
from unittest.async_case import IsolatedAsyncioTestCase

import pytest
from taiga.base.repositories import neighbors as neighbors_repositories
from taiga.stories.stories.models import Story
from tests.utils import factories as f

pytestmark = pytest.mark.django_db(transaction=True)

##########################################################
# get_neighbors_sync
##########################################################


class GetObjectNeighbors(IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.pj_admin = await f.create_user()
        self.project = await f.create_project(owner=self.pj_admin)
        self.workflow_1 = await f.create_workflow(project=self.project)
        self.status_11 = await self.workflow_1.statuses.afirst()
        self.status_12 = await self.workflow_1.statuses.alast()

        self.story_111 = await f.create_story(project=self.project, workflow=self.workflow_1, status=self.status_11)
        self.story_112 = await f.create_story(project=self.project, workflow=self.workflow_1, status=self.status_12)

        self.workflow_2 = await f.create_workflow(project=self.project)
        self.status_21 = await self.workflow_2.statuses.afirst()
        self.story_221 = await f.create_story(project=self.project, workflow=self.workflow_2, status=self.status_21)

    async def test_get_neighbors_no_filter_no_prev_neighbor(self) -> None:
        neighbors = await neighbors_repositories.get_neighbors(obj=self.story_111)
        assert neighbors.prev is None
        assert neighbors.next == self.story_112

    async def test_get_neighbors_no_filter_no_next_neighbor_ok(self) -> None:
        neighbors = await neighbors_repositories.get_neighbors(obj=self.story_221)
        assert neighbors.prev == self.story_112
        assert neighbors.next is None

    async def test_get_neighbors_no_filter_both_neighbors(self) -> None:
        neighbors = await neighbors_repositories.get_neighbors(obj=self.story_112)
        assert neighbors.prev == self.story_111
        assert neighbors.next == self.story_221

    async def test_get_neighbors_with_model_queryset_broad_filters_all_match(self) -> None:
        same_story112_project_qs = Story.objects.filter(project_id=self.story_112.project.id).order_by(
            "status", "order"
        )

        neighbors = await neighbors_repositories.get_neighbors(
            obj=self.story_112, model_queryset=same_story112_project_qs
        )
        self.assertEqual(neighbors.prev, self.story_111)
        self.assertEqual(neighbors.next, self.story_221)

    async def test_get_neighbors_with_model_queryset_narrow_filters(self) -> None:
        same_story112_workflow_qs = Story.objects.filter(
            project_id=self.story_112.project.id, workflow_id=self.story_112.workflow.id
        ).order_by("status", "order")

        neighbors = await neighbors_repositories.get_neighbors(
            obj=self.story_112, model_queryset=same_story112_workflow_qs
        )
        assert neighbors.prev == self.story_111
        assert neighbors.next is None

    async def test_get_neighbors_with_model_queryset_filters_no_one_matches(self) -> None:
        same_story112_status_qs = Story.objects.filter(
            project_id=self.story_112.project.id,
            workflow_id=self.story_112.workflow.id,
            status_id=self.story_112.status.id,
        ).order_by("status", "order")

        neighbors = await neighbors_repositories.get_neighbors(
            obj=self.story_112, model_queryset=same_story112_status_qs
        )
        assert neighbors.prev is None
        assert neighbors.next is None
