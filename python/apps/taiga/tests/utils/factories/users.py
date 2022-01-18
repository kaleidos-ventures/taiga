# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from asgiref.sync import sync_to_async

from .base import Factory, factory


class UserFactory(Factory):
    username = factory.Sequence(lambda n: f"user{n}")
    email = factory.LazyAttribute(lambda obj: f"{obj.username}@email.com")
    password = factory.django.Password("123123")
    is_active = True

    class Meta:
        model = "users.User"


@sync_to_async
def create_user(**kwargs):
    return UserFactory.create(**kwargs)
