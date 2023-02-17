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
from taiga.projects.invitations.services import _generate_project_invitation_token
from taiga.users.services import _generate_reset_password_token, _generate_verify_user_token
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


##########################################################
# POST /users
##########################################################


async def test_create_user_ok(client):
    data = {
        "email": "test.create@email.com",
        "fullName": "Ada Lovelace",
        "color": 8,
        "password": "correctP4ssword%",
        "acceptTerms": True,
        "projectInvitationToken": "eyJ0eXAiOToken",
        "accept_project_invitation": False,
        "lang": "es-ES",
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
    role = await f.create_project_role(project=project)
    project_invitation = await f.create_project_invitation(project=project, role=role, email=user.email)

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


#####################################################################
# GET /users/search
#####################################################################


async def test_list_users_by_text_anonymous(client):
    text = "text_to_search"
    project_id = "6JgsbGyoEe2VExhWgGrI2w"
    offset = 0
    limit = 1

    response = client.get(f"/users/search?text={text}&project={project_id}&offset={offset}&limit={limit}")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_list_users_by_text(client):
    user = await f.create_user()
    user2 = await f.create_user()
    client.login(user)

    text = user2.username
    project_id = "6JgsbGyoEe2VExhWgGrI2w"
    offset = 0
    limit = 10

    response = client.get(f"/users/search?text={text}&project={project_id}&offset={offset}&limit={limit}")
    assert response.status_code == status.HTTP_200_OK, response.text
    assert len(response.json()) == 1
    assert response.headers["Pagination-Offset"] == "0"
    assert response.headers["Pagination-Limit"] == "10"
    assert response.headers["Pagination-Total"] == "1"


async def test_list_users_by_text_no_results(client):
    user = await f.create_user()
    await f.create_user()
    client.login(user)

    text = "noresults"
    project_id = "6JgsbGyoEe2VExhWgGrI2w"
    offset = 0
    limit = 10

    response = client.get(f"/users/search?text={text}&project={project_id}&offset={offset}&limit={limit}")
    assert response.status_code == status.HTTP_200_OK, response.text
    assert len(response.json()) == 0
    assert response.headers["Pagination-Offset"] == "0"
    assert response.headers["Pagination-Limit"] == "10"
    assert response.headers["Pagination-Total"] == "0"


##########################################################
# GET /my/user
##########################################################


async def test_my_user_error_no_authenticated_user(client):
    response = client.get("/my/user")

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


async def test_my_user_success(client):
    user = await f.create_user()

    client.login(user)
    response = client.get("/my/user")

    assert response.status_code == status.HTTP_200_OK
    assert "email" in response.json().keys()


##########################################################
# PUT /my/user
##########################################################


async def test_update_my_user_error_no_authenticated_user(client):
    data = {
        "fullName": "Ada Lovelace",
        "lang": "es-ES",
    }
    response = client.put("/my/user", json=data)

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


async def test_update_my_user_success(client):
    user = await f.create_user()
    data = {
        "fullName": "Ada Lovelace",
        "lang": "es-ES",
    }

    client.login(user)
    response = client.put("/my/user", json=data)

    assert response.status_code == status.HTTP_200_OK, response.text


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
