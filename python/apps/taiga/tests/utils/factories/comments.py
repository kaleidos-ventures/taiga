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


class CommentFactory(Factory):
    text = factory.Sequence(lambda n: f"Comment {n}")
    created_by = factory.SubFactory("tests.utils.factories.UserFactory")

    class Meta:
        model = "comments.Comment"


@sync_to_async
def create_comment(content_object, **kwargs):
    return CommentFactory.create(content_object=content_object, **kwargs)


def build_comment(**kwargs):
    return CommentFactory.build(**kwargs)
