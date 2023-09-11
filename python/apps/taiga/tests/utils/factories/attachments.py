# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from asgiref.sync import sync_to_async

from .base import Factory, factory


class AttachmentFactory(Factory):
    storaged_object = factory.SubFactory("tests.utils.factories.StoragedObjectFactory")
    name = factory.Sequence(lambda n: f"test-file-{n}.png")
    content_type = "image/png"
    size = 145

    class Meta:
        model = "attachments.Attachment"


@sync_to_async
def create_attachment(**kwargs):
    return AttachmentFactory.create(**kwargs)


def build_attachment(**kwargs):
    return AttachmentFactory.build(**kwargs)
