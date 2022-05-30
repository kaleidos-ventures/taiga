# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from datetime import timedelta
from unittest import mock

import pytest
from fastapi import status
from taiga.invitations.services import _generate_project_invitation_token
from taiga.users.services import _generate_reset_password_token, _generate_verify_user_token
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


##########################################################
# GET /users/me
##########################################################


async def test_me_error_no_authenticated_user(client):
    response = client.get("/users/me")

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


async def test_me_success(client):
    user = await f.create_user()

    client.login(user)
    response = client.get("/users/me")

    assert response.status_code == status.HTTP_200_OK
    assert "email" in response.json().keys()


##########################################################
# POST /users
##########################################################


async def test_create_user_ok(client):
    data = {
        "email": "test.create@email.com",
        "fullName": "Ada Lovelace",
        "password": "correctP4ssword%",
        "acceptTerms": True,
        "projectInvitationToken": "eyJ0eXAiOToken",
        "accept_project_invitation": False,
    }

    response = client.post("/users", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_create_user_email_already_exists(client):
    user = await f.create_user()
    data = {
        "email": user.email,
        "fullName": "Ada Lovelace",
        "password": "correctP4ssword%",
        "acceptTerms": True,
    }
    client.post("/users", json=data)
    response = client.post("/users", json=data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


##########################################################
# POST /users/verify
##########################################################


async def test_verify_user_ok(client):
    user = await f.create_user(is_active=False)

    data = {"token": await _generate_verify_user_token(user)}

    response = client.post("/users/verify", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text
    assert response.json()["projectInvitation"] is None


async def test_verify_user_ok_with_invitation(client):
    user = await f.create_user(is_active=False)
    project = await f.create_project()
    role = await f.create_role(project=project)
    project_invitation = await f.create_invitation(project=project, role=role, email=user.email)

    project_invitation_token = await _generate_project_invitation_token(project_invitation)
    data = {"token": await _generate_verify_user_token(user, project_invitation_token)}

    response = client.post("/users/verify", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text
    assert response.json()["projectInvitation"] is not None


async def test_verify_user_ok_with_invalid_invitation(client):
    user = await f.create_user(is_active=False)

    project_invitation_token = "invalid-invitation-token"
    data = {"token": await _generate_verify_user_token(user, project_invitation_token)}

    response = client.post("/users/verify", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text
    assert response.json()["projectInvitation"] is None


async def test_verify_user_error_invalid_token(client):
    data = {"token": "invalid token"}

    response = client.post("/users/verify", json=data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


async def test_verify_user_error_expired_token(client):
    with mock.patch(
        "taiga.users.tokens.VerifyUserToken.lifetime", new_callable=mock.PropertyMock(return_value=timedelta(days=-1))
    ):
        user = await f.create_user(is_active=False)

        data = {"token": await _generate_verify_user_token(user)}

        response = client.post("/users/verify", json=data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


async def test_verify_user_error_used_token(client):
    user = await f.create_user(is_active=False)

    data = {"token": await _generate_verify_user_token(user)}

    response = client.post("/users/verify", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text
    response = client.post("/users/verify", json=data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


##########################################################
# POST /users/reset-password
##########################################################


async def test_resquest_reset_password_ok(client):
    user = await f.create_user(is_active=False)

    data = {"email": user.email}

    response = client.post("/users/reset-password", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_resquest_reset_password_ok_with_no_registered_email(client):
    data = {"email": "unregistered@email.com"}

    response = client.post("/users/reset-password", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_resquest_reset_password_ok_with_invalid_email(client):
    data = {"email": "invalid@email"}

    response = client.post("/users/reset-password", json=data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text
    assert response.json()["error"]["detail"][0]["type"] == "value_error.email"


async def test_resquest_reset_password_error_with_no_email(client):
    data = {}

    response = client.post("/users/reset-password", json=data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text
    assert response.json()["error"]["detail"][0]["type"] == "value_error.missing"


##########################################################
# GET /users/reset-password/{token}/verify
##########################################################


async def test_verify_reset_password_token(client):
    user = await f.create_user()
    token = await _generate_reset_password_token(user)

    response = client.get(f"/users/reset-password/{token}/verify")
    assert response.status_code == status.HTTP_200_OK, response.text
    assert response.json() is True


async def test_verify_reset_password_error_inactive_user(client):
    user = await f.create_user(is_active=False)
    token = await _generate_reset_password_token(user)

    response = client.get(f"/users/reset-password/{token}/verify")
    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


async def test_verify_reset_password_error_invalid_token(client):
    token = "invalid_token"

    response = client.get(f"/users/reset-password/{token}/verify")
    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


async def test_verify_reset_password_error_used_token(client):
    user = await f.create_user()
    token = await _generate_reset_password_token(user)
    data = {"password": "123123.a"}

    response = client.post(f"/users/reset-password/{token}", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text
    response = client.get(f"/users/reset-password/{token}/verify")
    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


async def test_verify_reset_password_error_expired_token(client):
    with mock.patch(
        "taiga.users.tokens.ResetPasswordToken.lifetime",
        new_callable=mock.PropertyMock(return_value=timedelta(days=-1)),
    ):
        user = await f.create_user()
        token = await _generate_reset_password_token(user)

        response = client.get(f"/users/reset-password/{token}/verify")
        assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


##########################################################
# POST /users/reset-password/{token}
##########################################################


async def test_reset_password_ok(client):
    user = await f.create_user()
    token = await _generate_reset_password_token(user)
    data = {"password": "123123.a"}

    response = client.post(f"/users/reset-password/{token}", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text
    assert "token" in response.json()
    assert "refresh" in response.json()


async def test_reset_password_error_with_no_password(client):
    user = await f.create_user()
    token = await _generate_reset_password_token(user)
    data = {}

    response = client.post(f"/users/reset-password/{token}", json=data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text
    assert response.json()["error"]["detail"][0]["type"] == "value_error.missing"


async def test_reset_password_error_with_invalid_password(client):
    user = await f.create_user()
    token = await _generate_reset_password_token(user)
    data = {"password": "123123"}

    response = client.post(f"/users/reset-password/{token}", json=data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text
    assert response.json()["error"]["detail"][0]["type"] == "value_error.any_str.min_length"


async def test_reset_password_error_inactive_user(client):
    user = await f.create_user(is_active=False)
    token = await _generate_reset_password_token(user)
    data = {"password": "123123.a"}

    response = client.post(f"/users/reset-password/{token}", json=data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


async def test_reset_password_error_invalid_token(client):
    token = "invalid_token"
    data = {"password": "123123.a"}

    response = client.post(f"/users/reset-password/{token}", json=data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


async def test_reset_password_error_used_token(client):
    user = await f.create_user()
    token = await _generate_reset_password_token(user)
    data = {"password": "123123.a"}

    response = client.post(f"/users/reset-password/{token}", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text
    response = client.post(f"/users/reset-password/{token}", json=data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


async def test_reset_password_error_expired_token(client):
    with mock.patch(
        "taiga.users.tokens.ResetPasswordToken.lifetime",
        new_callable=mock.PropertyMock(return_value=timedelta(days=-1)),
    ):
        user = await f.create_user()
        token = await _generate_reset_password_token(user)
        data = {"password": "123123.a"}

        response = client.post(f"/users/reset-password/{token}", json=data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


##########################################################
# GET /my/contacts
##########################################################


async def test_my_contacts(client):
    user1 = await f.create_user(is_active=True)
    user2 = await f.create_user(is_active=True)
    user3 = await f.create_user(is_active=False)

    data = {"emails": [user1.email, user2.email, user3.email]}

    client.login(user1)
    response = client.post("/my/contacts", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text
    assert len(response.json()) == 1
    assert response.json()[0]["username"] == user2.username


async def test_my_contacts_wrong_email_format(client):
    user1 = await f.create_user(is_active=True)

    data = {"emails": ["bad.email.com"]}

    client.login(user1)
    response = client.post("/my/contacts", json=data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text
    assert response.json()["error"]["detail"][0]["type"] == "value_error.email"
