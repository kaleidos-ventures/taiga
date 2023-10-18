# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from unittest.mock import call, patch

from taiga.base.serializers import BaseModel
from taiga.notifications import services
from tests.utils import factories as f


class SampleContent(BaseModel):
    msg: str


#####################################################################
# notify_users
#####################################################################


async def test_notify_users():
    user = f.build_user()
    notification = f.build_notification(type="test", owner=user)
    content = SampleContent(msg="Test notify")

    with (
        patch(
            "taiga.notifications.services.notifications_repositories", autospec=True
        ) as fake_notifications_repository,
        patch("taiga.notifications.services.notifications_events", autospec=True) as fake_notifications_events,
    ):
        fake_notifications_repository.create_notifications.return_value = [notification]

        await services.notify_users(type="test", emitted_by=user, notified_users=[user], content=content)

        fake_notifications_repository.create_notifications.assert_called_once_with(
            owners=[user], created_by=user, notification_type="test", content={"msg": "Test notify"}
        )

        fake_notifications_events.emit_event_when_notifications_are_created.assert_called_once_with(
            notifications=[notification]
        )


#####################################################################
# list_user_notifications
#####################################################################


async def test_list_user_notifications():
    user = f.build_user()

    with patch(
        "taiga.notifications.services.notifications_repositories", autospec=True
    ) as fake_notifications_repository:
        await services.list_user_notifications(user=user)

        fake_notifications_repository.list_notifications.assert_called_once_with(filters={"owner": user})


async def test_list_user_notifications_read_only():
    user = f.build_user()

    with patch(
        "taiga.notifications.services.notifications_repositories", autospec=True
    ) as fake_notifications_repository:
        await services.list_user_notifications(user=user, is_read=True)

        fake_notifications_repository.list_notifications.assert_called_once_with(
            filters={"owner": user, "is_read": True}
        )


async def test_list_user_notifications_unread_only():
    user = f.build_user()

    with patch(
        "taiga.notifications.services.notifications_repositories", autospec=True
    ) as fake_notifications_repository:
        await services.list_user_notifications(user=user, is_read=False)

        fake_notifications_repository.list_notifications.assert_called_once_with(
            filters={"owner": user, "is_read": False}
        )


#####################################################################
# mark_user_notifications_as_read
#####################################################################


async def test_mark_user_notifications_as_read_with_one():
    user = f.build_user()
    notification = f.build_notification(owner=user)

    with (
        patch(
            "taiga.notifications.services.notifications_repositories", autospec=True
        ) as fake_notifications_repository,
        patch("taiga.notifications.services.notifications_events", autospec=True) as fake_notifications_events,
    ):
        fake_notifications_repository.mark_notifications_as_read.return_value = [notification]

        notifications = await services.mark_user_notifications_as_read(user=user, id=notification.id)

        assert notifications == [notification]

        fake_notifications_repository.mark_notifications_as_read.assert_called_once_with(
            filters={"owner": user, "id": notification.id}
        )

        fake_notifications_events.emit_event_when_notifications_are_read.assert_called_once_with(
            user=user, notifications=notifications
        )


async def test_mark_user_notifications_as_read_with_many():
    user = f.build_user()
    notif1 = f.build_notification(owner=user)
    notif2 = f.build_notification(owner=user)
    notif3 = f.build_notification(owner=user)

    with (
        patch(
            "taiga.notifications.services.notifications_repositories", autospec=True
        ) as fake_notifications_repository,
        patch("taiga.notifications.services.notifications_events", autospec=True) as fake_notifications_events,
    ):
        fake_notifications_repository.mark_notifications_as_read.return_value = [notif3, notif2, notif1]

        notifications = await services.mark_user_notifications_as_read(user=user)

        assert notifications == [notif3, notif2, notif1]

        fake_notifications_repository.mark_notifications_as_read.assert_called_once_with(filters={"owner": user})

        fake_notifications_events.emit_event_when_notifications_are_read.assert_called_once_with(
            user=user, notifications=notifications
        )


#####################################################################
# count_user_notifications
#####################################################################


async def test_count_user_notifications():
    user = f.build_user()

    with patch(
        "taiga.notifications.services.notifications_repositories", autospec=True
    ) as fake_notifications_repository:
        fake_notifications_repository.count_notifications.side_effect = [10, 2]

        result = await services.count_user_notifications(user=user)

        assert result == {"total": 10, "read": 2, "unread": 8}

        fake_notifications_repository.count_notifications.assert_has_awaits(
            [call(filters={"owner": user}), call(filters={"owner": user, "is_read": True})]
        )
