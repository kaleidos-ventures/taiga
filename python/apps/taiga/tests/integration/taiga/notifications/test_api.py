# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import pytest
from fastapi import status
from taiga.base.utils.datetime import aware_utcnow
from tests.utils import factories as f
from tests.utils.bad_params import INVALID_B64ID

pytestmark = pytest.mark.django_db(transaction=True)

##########################################################
# GET my/notifications
##########################################################


async def test_list_my_notifications_200_ok(client):
    user = await f.create_user()
    await f.create_notification(owner=user)
    await f.create_notification(owner=user)
    await f.create_notification(owner=user, read_at=aware_utcnow())

    client.login(user)
    response = client.get("/my/notifications")
    assert response.status_code == status.HTTP_200_OK, response.text
    assert len(response.json()) == 3


async def test_list_my_notifications_200_ok_filter_only_read(client):
    user = await f.create_user()
    await f.create_notification(owner=user)
    await f.create_notification(owner=user)
    await f.create_notification(owner=user, read_at=aware_utcnow())

    client.login(user)
    response = client.get("/my/notifications", params={"read": True})
    assert response.status_code == status.HTTP_200_OK, response.text
    assert len(response.json()) == 1


async def test_list_my_notifications_200_ok_filter_only_unread(client):
    user = await f.create_user()
    await f.create_notification(owner=user)
    await f.create_notification(owner=user)
    await f.create_notification(owner=user, read_at=aware_utcnow())

    client.login(user)
    response = client.get("/my/notifications", params={"read": False})
    assert response.status_code == status.HTTP_200_OK, response.text
    assert len(response.json()) == 2


async def test_list_my_notifications_403_forbidden_error(client):
    user = await f.create_user()
    await f.create_notification(owner=user)

    response = client.get("/my/notifications")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


##########################################################
# POST my/notifications/{id}/read
##########################################################


async def test_mark_notification_as_read_200_ok(client):
    user = await f.create_user()
    notification = await f.create_notification(owner=user)

    client.login(user)
    response = client.post(f"/my/notifications/{notification.b64id}/read")
    assert response.status_code == status.HTTP_200_OK, response.text
    assert response.json()["readAt"] is not None, response.json()


async def test_mark_my_notification_as_read_404_not_found(client):
    user = await f.create_user()
    notification = await f.create_notification()

    client.login(user)
    response = client.post(f"/my/notifications/{notification.b64id}/read")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_mark_my_notification_as_read_403_forbidden_error(client):
    user = await f.create_user()
    notification = await f.create_notification(owner=user)

    response = client.post(f"/my/notifications/{notification.b64id}/read")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_mark_my_notification_as_read_422_unprocessable_entity(client):
    user = await f.create_user()

    client.login(user)
    response = client.post(f"/my/notifications/{INVALID_B64ID}/read")
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text


##########################################################
# GET my/notifications/count
##########################################################


async def test_count_my_notifications_200_ok(client):
    user = await f.create_user()
    await f.create_notification(owner=user)
    await f.create_notification(owner=user)
    await f.create_notification(owner=user, read_at=aware_utcnow())

    client.login(user)
    response = client.get("/my/notifications/count")
    assert response.status_code == status.HTTP_200_OK, response.text
    assert response.json() == {"total": 3, "read": 1, "unread": 2}


async def test_count_my_notifications_403_forbidden_error(client):
    user = await f.create_user()
    await f.create_notification(owner=user)

    response = client.get("/my/notifications/count")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text
