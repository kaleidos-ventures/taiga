# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import pytest
from taiga.base.utils.datetime import aware_utcnow
from taiga.notifications import repositories
from tests.utils import factories as f

pytestmark = pytest.mark.django_db(transaction=True)


##########################################################
# create notifications
##########################################################


async def test_create_notification():
    user1 = await f.create_user()
    user2 = await f.create_user()
    user3 = await f.create_user()

    notifications = await repositories.create_notifications(
        owners=[user1, user2],
        created_by=user3,
        notification_type="test_notification",
        content={"msg": "test"},
    )

    assert len(notifications) == 2
    assert notifications[0].created_by == notifications[1].created_by == user3
    assert notifications[0].type == notifications[1].type == "test_notification"
    assert notifications[0].content == notifications[1].content == {"msg": "test"}
    assert notifications[0].owner == user1
    assert notifications[1].owner == user2


##########################################################
# list notifications
##########################################################


async def test_list_notifications_filters():
    user1 = await f.create_user()
    user2 = await f.create_user()
    user3 = await f.create_user()

    n11 = await f.create_notification(owner=user1, created_by=user3)
    n12 = await f.create_notification(owner=user1, created_by=user3, read_at=aware_utcnow())
    n13 = await f.create_notification(owner=user1, created_by=user3)

    n21 = await f.create_notification(owner=user2, created_by=user3)
    n22 = await f.create_notification(owner=user2, created_by=user3, read_at=aware_utcnow())

    assert [n22, n21, n13, n12, n11] == await repositories.list_notifications()
    assert [n13, n12, n11] == await repositories.list_notifications(filters={"owner": user1})
    assert [n13, n11] == await repositories.list_notifications(filters={"owner": user1, "is_read": False})
    assert [n12] == await repositories.list_notifications(filters={"owner": user1, "is_read": True})
    assert [n22, n12] == await repositories.list_notifications(filters={"is_read": True})


##########################################################
# get_notification
##########################################################


async def test_get_notification():
    user1 = await f.create_user()
    user2 = await f.create_user()
    notification = await f.create_notification(owner=user1)

    assert await repositories.get_notification(filters={"id": notification.id}) == notification
    assert await repositories.get_notification(filters={"id": notification.id, "owner": user1}) == notification
    assert await repositories.get_notification(filters={"id": notification.id, "owner": user2}) is None


##########################################################
# mark notifications as read
##########################################################


async def test_mark_notifications_as_read():
    user = await f.create_user()
    n1 = await f.create_notification(owner=user)
    n2 = await f.create_notification(owner=user)
    n3 = await f.create_notification(owner=user)

    assert n1.read_at == n2.read_at == n3.read_at is None

    ns = await repositories.mark_notifications_as_read(filters={"owner": user})

    assert ns[0].read_at == ns[1].read_at == ns[2].read_at is not None


##########################################################
# misc
##########################################################


async def test_count_notifications():
    user1 = await f.create_user()
    user2 = await f.create_user()
    user3 = await f.create_user()

    await f.create_notification(owner=user1, created_by=user3)
    await f.create_notification(owner=user1, created_by=user3, read_at=aware_utcnow())
    await f.create_notification(owner=user1, created_by=user3)

    await f.create_notification(owner=user2, created_by=user3)
    await f.create_notification(owner=user2, created_by=user3, read_at=aware_utcnow())

    assert 5 == await repositories.count_notifications()
    assert 3 == await repositories.count_notifications(filters={"owner": user1})
    assert 2 == await repositories.count_notifications(filters={"owner": user1, "is_read": False})
    assert 1 == await repositories.count_notifications(filters={"owner": user1, "is_read": True})
    assert 2 == await repositories.count_notifications(filters={"is_read": True})
