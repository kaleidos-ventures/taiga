# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from asgiref.sync import sync_to_async

from .base import Factory, factory


class StoragedObjectFactory(Factory):
    file = factory.django.ImageField(format="PNG")

    class Meta:
        model = "storage.StoragedObject"


@sync_to_async
def create_storaged_object(**kwargs):
    return StoragedObjectFactory.create(**kwargs)


def build_storaged_object(**kwargs):
    return StoragedObjectFactory.build(**kwargs)
