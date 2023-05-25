# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC


from asgiref.sync import sync_to_async

from .base import Factory, factory

####################################################
# Story Comments
####################################################


class StoryCommentFactory(Factory):
    text = factory.Sequence(lambda n: f"Comment {n}")
    content_object = factory.SubFactory("tests.utils.factories.StoryFactory")
    created_by = factory.SubFactory("tests.utils.factories.UserFactory")

    class Meta:
        model = "comments.Comment"


@sync_to_async
def create_story_comment(**kwargs):
    return StoryCommentFactory.create(**kwargs)


def build_story_comment(**kwargs):
    return StoryCommentFactory.build(**kwargs)
