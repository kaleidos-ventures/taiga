# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from asgiref.sync import sync_to_async

from .base import Factory, factory


class InvitationFactory(Factory):
    email = factory.LazyAttribute(lambda obj: f"{obj.username}@email.com")
    user = None
    project = factory.SubFactory("tests.utils.factories.ProjectFactory")
    role = factory.SubFactory("tests.utils.factories.RoleFactory")
    status = "pending"

    class Meta:
        model = "projects.Invitation"


@sync_to_async
def create_invitation(**kwargs):
    return InvitationFactory.create(**kwargs)
