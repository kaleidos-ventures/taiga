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
    full_name = factory.Sequence(lambda n: f"Test User {n}")
    password = factory.django.Password("123123")
    is_active = True

    class Meta:
        model = "users.User"


@sync_to_async
def create_user(**kwargs):
    return UserFactory.create(**kwargs)


def build_user(**kwargs):
    return UserFactory.build(**kwargs)


class AuthDataFactory(Factory):
    user = factory.SubFactory("tests.utils.factories.UserFactory")
    key = "google"
    value = "103576024907356273435"

    class Meta:
        model = "users.AuthData"


def build_auth_data(**kwargs):
    return AuthDataFactory.build(**kwargs)


@sync_to_async
def create_auth_data(**kwargs):
    return AuthDataFactory.create(**kwargs)
