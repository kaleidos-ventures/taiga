# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC


from asgiref.sync import sync_to_async

from .base import Factory, factory

####################################################
# Story
####################################################


class StoryFactory(Factory):
    title = factory.Sequence(lambda n: f"Story {n}")
    description = factory.Sequence(lambda n: f"Description {n}")
    project = factory.SubFactory("tests.utils.factories.ProjectFactory")
    workflow = factory.SubFactory("tests.utils.factories.WorkflowFactory")
    status = factory.SubFactory("tests.utils.factories.WorkflowStatusFactory")
    created_by = factory.SubFactory("tests.utils.factories.UserFactory")
    order = factory.Sequence(lambda n: n + 1)

    class Meta:
        model = "stories.Story"


@sync_to_async
def create_story(**kwargs):
    return StoryFactory.create(**kwargs)


def build_story(**kwargs):
    return StoryFactory.build(**kwargs)


####################################################
# StoryAssignment
####################################################


class StoryAssignmentFactory(Factory):
    story = factory.SubFactory("tests.utils.factories.StoryFactory")
    user = factory.SubFactory("tests.utils.factories.UserFactory")

    class Meta:
        model = "stories_assignments.StoryAssignment"


@sync_to_async
def create_story_assignment(**kwargs):
    return StoryAssignmentFactory.create(**kwargs)


def build_story_assignment(**kwargs):
    return StoryAssignmentFactory.build(**kwargs)
