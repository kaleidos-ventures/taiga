# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from asgiref.sync import sync_to_async

from .base import Factory, factory


class MediafileFactory(Factory):
    name = factory.Sequence(lambda n: f"test-file-{n}.png")
    file = factory.django.ImageField(format="PNG")
    content_type = "image/png"
    size = 145
    project = factory.SubFactory("tests.utils.factories.ProjectFactory")

    class Meta:
        model = "mediafiles.MediaFile"


@sync_to_async
def create_mediafile(**kwargs):
    return MediafileFactory.create(**kwargs)


def build_mediafile(**kwargs):
    return MediafileFactory.build(**kwargs)
