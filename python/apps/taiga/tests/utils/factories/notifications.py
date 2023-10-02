# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from asgiref.sync import sync_to_async

from .base import Factory


class NotificationFactory(Factory):
    type = "test_notification"

    class Meta:
        model = "notifications.Notification"


@sync_to_async
def create_notification(**kwargs):
    return NotificationFactory.create(**kwargs)


def build_notification(**kwargs):
    return NotificationFactory.build(**kwargs)
