# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from unittest.mock import MagicMock, patch

import pytest
from taiga.auth.dataclasses import AccessWithRefreshToken
from taiga.invitations.services.exceptions import BadInvitationTokenError, InvitationDoesNotExistError
from taiga.tokens import exceptions as tokens_ex
from taiga.users import services
from taiga.users.services import exceptions as ex
from tests.utils import factories as f

##########################################################
# create_user
##########################################################


async def test_create_user_ok(tqmanager):
    email = "email@email.com"
    username = "email"
    full_name = "Full Name"
    password = "CorrectP4ssword$"
    user = f.build_user(id=1, email=email, username=username, full_name=full_name)

    accept_project_invitation = True
    project_invitation_token = "eyJ0Token"

    with (
        patch("taiga.users.services.users_repositories", autospec=True) as fake_users_repo,
        patch("taiga.users.services._generate_verify_user_token", return_value="verify_token") as fake_user_token,
        patch("taiga.users.services.generate_username", return_value=username),
    ):
        fake_users_repo.get_user_by_username_or_email.return_value = None
        fake_users_repo.create_user.return_value = user

        await services.create_user(
            email=email,
            full_name=full_name,
            password=password,
            accept_project_invitation=accept_project_invitation,
            project_invitation_token=project_invitation_token,
        )

        fake_users_repo.create_user.assert_awaited_once_with(
            email=email, username=username, full_name=full_name, password=password
        )
        assert len(tqmanager.pending_jobs) == 1
        job = tqmanager.pending_jobs[0]
        assert "send_email" in job["task_name"]
        assert job["args"] == {
            "email_name": "sign_up",
            "to": "email@email.com",
            "context": {"verification_token": "verify_token"},
        }

        fake_user_token.assert_awaited_once_with(user, project_invitation_token, accept_project_invitation)


async def test_create_user_unverified(tqmanager):
    email = "email@email.com"
    username = "email"
    full_name = "Full Name"
    user = f.build_user(id=1, email=email, username=username, full_name=full_name, is_active=False)

    with (
        patch("taiga.users.services.users_repositories", autospec=True) as fake_users_repo,
        patch("taiga.users.services._generate_verify_user_token", return_value="verify_token"),
    ):
        fake_users_repo.get_user_by_username_or_email.return_value = user
        fake_users_repo.update_user.return_value = user
        await services.create_user(email=email, full_name="New Full Name", password="NewCorrectP4ssword&")

        fake_users_repo.update_user.assert_awaited_once()
        assert len(tqmanager.pending_jobs) == 1
        job = tqmanager.pending_jobs[0]
        assert "send_email" in job["task_name"]
        assert job["args"] == {
            "email_name": "sign_up",
            "to": "email@email.com",
            "context": {"verification_token": "verify_token"},
        }


async def test_create_user_email_exists():
    with (
        pytest.raises(ex.EmailAlreadyExistsError),
        patch("taiga.users.services.users_repositories", autospec=True) as fake_users_repo,
    ):
        fake_users_repo.get_user_by_username_or_email.return_value = MagicMock(is_active=True)
        await services.create_user(email="dup.email@email.com", full_name="Full Name", password="CorrectP4ssword&")


##########################################################
# verify_user
##########################################################


async def test_verify_user_ok_no_project_invitation_token():
    user = f.build_user(is_active=False)
    object_data = {"id": 1}
    auth_credentials = AccessWithRefreshToken(token="token", refresh="refresh")

    with (
        patch("taiga.users.services.VerifyUserToken", autospec=True) as FakeVerifyUserToken,
        patch("taiga.users.services.users_repositories", autospec=True) as fake_users_repo,
        patch("taiga.users.services.auth_services", autospec=True) as fake_auth_services,
        patch("taiga.users.services.invitations_services", autospec=True) as fake_invitations_services,
    ):
        fake_token = FakeVerifyUserToken()
        fake_token.object_data = object_data
        fake_token.get.return_value = None
        fake_auth_services.create_auth_credentials.return_value = auth_credentials
        FakeVerifyUserToken.create.return_value = fake_token
        fake_users_repo.get_first_user.return_value = user

        info = await services.verify_user("some_token")

        assert info.auth == auth_credentials
        assert info.project_invitation is None

        fake_token.denylist.assert_awaited_once()
        fake_users_repo.get_first_user.assert_awaited_once_with(**object_data, is_system=False)
        fake_users_repo.verify_user.assert_awaited_once_with(user=user)
        fake_invitations_services.update_user_projects_invitations.assert_awaited_once_with(user=user)
        fake_token.get.assert_called_with("accept_project_invitation", False)
        fake_invitations_services.accept_project_invitation_from_token.assert_not_awaited()
        fake_auth_services.create_auth_credentials.assert_awaited_once_with(user=user)


async def test_verify_user_ok_with_accepting_project_invitation_token():
    user = f.build_user(is_active=False)
    project_invitation = f.build_invitation()
    object_data = {"id": 1}
    project_invitation_token = "invitation_token"
    accept_project_invitation = True
    auth_credentials = AccessWithRefreshToken(token="token", refresh="refresh")

    with (
        patch("taiga.users.services.VerifyUserToken", autospec=True) as FakeVerifyUserToken,
        patch("taiga.users.services.users_repositories", autospec=True) as fake_users_repo,
        patch("taiga.users.services.auth_services", autospec=True) as fake_auth_services,
        patch("taiga.users.services.invitations_services", autospec=True) as fake_invitations_services,
    ):
        fake_token = FakeVerifyUserToken()
        fake_token.object_data = object_data
        fake_token.get.side_effect = [project_invitation_token, accept_project_invitation]
        fake_auth_services.create_auth_credentials.return_value = auth_credentials
        FakeVerifyUserToken.create.return_value = fake_token
        fake_invitations_services.accept_project_invitation_from_token.return_value = project_invitation
        fake_users_repo.get_first_user.return_value = user

        info = await services.verify_user("some_token")

        assert info.auth == auth_credentials
        assert info.project_invitation == project_invitation

        fake_token.denylist.assert_awaited_once()
        fake_users_repo.get_first_user.assert_awaited_once_with(**object_data, is_system=False)
        fake_users_repo.verify_user.assert_awaited_once_with(user=user)
        fake_invitations_services.update_user_projects_invitations.assert_awaited_once_with(user=user)
        fake_token.get.assert_called_with("accept_project_invitation", False)
        fake_invitations_services.accept_project_invitation_from_token.assert_awaited_once_with(
            token=project_invitation_token, user=user
        )
        fake_auth_services.create_auth_credentials.assert_awaited_once_with(user=user)


async def test_verify_user_ok_without_accepting_project_invitation_token():
    user = f.build_user(is_active=False)
    project_invitation = f.build_invitation()
    object_data = {"id": 1}
    project_invitation_token = "invitation_token"
    accept_project_invitation = False
    auth_credentials = AccessWithRefreshToken(token="token", refresh="refresh")

    with (
        patch("taiga.users.services.VerifyUserToken", autospec=True) as FakeVerifyUserToken,
        patch("taiga.users.services.users_repositories", autospec=True) as fake_users_repo,
        patch("taiga.users.services.auth_services", autospec=True) as fake_auth_services,
        patch("taiga.users.services.invitations_services", autospec=True) as fake_invitations_services,
    ):
        fake_token = FakeVerifyUserToken()
        fake_token.object_data = object_data
        fake_token.get.side_effect = [project_invitation_token, accept_project_invitation]
        fake_auth_services.create_auth_credentials.return_value = auth_credentials
        FakeVerifyUserToken.create.return_value = fake_token
        fake_invitations_services.get_project_invitation.return_value = project_invitation
        fake_users_repo.get_first_user.return_value = user

        info = await services.verify_user("some_token")

        assert info.auth == auth_credentials
        assert info.project_invitation == project_invitation

        fake_token.denylist.assert_awaited_once()
        fake_users_repo.get_first_user.assert_awaited_once_with(**object_data, is_system=False)
        fake_users_repo.verify_user.assert_awaited_once_with(user=user)
        fake_invitations_services.update_user_projects_invitations.assert_awaited_once_with(user=user)
        fake_token.get.assert_called_with("accept_project_invitation", False)
        not fake_invitations_services.accept_project_invitation_from_token.assert_awaited
        fake_auth_services.create_auth_credentials.assert_awaited_once_with(user=user)


async def test_verify_user_error_with_used_token():
    with (
        patch("taiga.users.services.VerifyUserToken", autospec=True) as FakeVerifyUserToken,
        pytest.raises(ex.UsedVerifyUserTokenError),
    ):
        FakeVerifyUserToken.create.side_effect = tokens_ex.DeniedTokenError

        await services.verify_user("some_token")


async def test_verify_user_error_with_expired_token():
    with (
        patch("taiga.users.services.VerifyUserToken", autospec=True) as FakeVerifyUserToken,
        pytest.raises(ex.ExpiredVerifyUserTokenError),
    ):
        FakeVerifyUserToken.create.side_effect = tokens_ex.ExpiredTokenError

        await services.verify_user("some_token")


async def test_verify_user_error_with_invalid_token():
    with (
        patch("taiga.users.services.VerifyUserToken", autospec=True) as FakeVerifyUserToken,
        pytest.raises(ex.BadVerifyUserTokenError),
    ):
        FakeVerifyUserToken.create.side_effect = tokens_ex.TokenError

        await services.verify_user("some_token")


async def test_verify_user_error_with_invalid_data():
    object_data = {"id": 1}

    with (
        patch("taiga.users.services.VerifyUserToken", autospec=True) as FakeVerifyUserToken,
        patch("taiga.users.services.users_repositories", autospec=True) as fake_users_repo,
        pytest.raises(ex.BadVerifyUserTokenError),
    ):
        fake_token = FakeVerifyUserToken()
        fake_token.object_data = object_data
        FakeVerifyUserToken.create.return_value = fake_token
        fake_users_repo.get_first_user.return_value = None

        await services.verify_user("some_token")


@pytest.mark.parametrize(
    "exception",
    [
        BadInvitationTokenError,
        InvitationDoesNotExistError,
    ],
)
async def test_verify_user_error_project_invitation_token(exception):
    user = f.build_user(is_active=False)
    project_invitation = f.build_invitation()
    object_data = {"id": 1}
    project_invitation_token = "invitation_token"
    accept_project_invitation = False
    auth_credentials = AccessWithRefreshToken(token="token", refresh="refresh")

    with (
        patch("taiga.users.services.VerifyUserToken", autospec=True) as FakeVerifyUserToken,
        patch("taiga.users.services.users_repositories", autospec=True) as fake_users_repo,
        patch("taiga.users.services.invitations_services", autospec=True) as fake_invitations_services,
        patch("taiga.users.services.auth_services", autospec=True) as fake_auth_services,
    ):
        fake_token = FakeVerifyUserToken()
        fake_token.object_data = object_data
        fake_token.get.side_effect = [project_invitation_token, accept_project_invitation]
        fake_auth_services.create_auth_credentials.return_value = auth_credentials
        FakeVerifyUserToken.create.return_value = fake_token
        fake_invitations_services.get_project_invitation.return_value = project_invitation
        fake_users_repo.get_first_user.return_value = user

        #  exception when recovering the project invitation
        fake_invitations_services.get_project_invitation.side_effect = exception

        info = await services.verify_user("some_token")

        assert info.auth == auth_credentials
        # the exception is controlled returning no content (pass)
        assert info.project_invitation is None


##########################################################
# clean_expired_users
##########################################################


async def test_clean_expired_users():
    with patch("taiga.users.services.users_repositories", autospec=True) as fake_users_repositories:
        await services.clean_expired_users()
        fake_users_repositories.clean_expired_users.assert_awaited_once()


##########################################################
# _generate_verify_user_token
##########################################################


@pytest.mark.parametrize(
    "project_invitation_token, accept_project_invitation, expected_keys",
    [
        ("invitation_token", True, ["project_invitation_token", "accept_project_invitation"]),
        ("invitation_token", False, ["project_invitation_token"]),
        (None, False, []),
    ],
)
async def test_generate_verify_ok_with_project_invitation_accepting(
    project_invitation_token, accept_project_invitation, expected_keys
):
    user = f.build_user(is_active=False)
    token = {}

    with (patch("taiga.users.services.VerifyUserToken", autospec=True) as FakeVerifyUserToken):
        FakeVerifyUserToken.create_for_object.return_value = token

        verify_user_token_str = await services._generate_verify_user_token(
            user=user,
            project_invitation_token=project_invitation_token,
            accept_project_invitation=accept_project_invitation,
        )

        assert list(token.keys()) == expected_keys
        if "project_invitation_token" in list(token.keys()):
            assert token["project_invitation_token"] == project_invitation_token
        if "accept_project_invitation" in list(token.keys()):
            assert token["accept_project_invitation"] == accept_project_invitation
        assert str(token) == verify_user_token_str


#####################################################################
# Reset Password
#####################################################################


async def test_password_reset_ok():
    user = f.build_user(is_active=True)
    object_data = {"id": 1}

    with (
        patch("taiga.users.services.users_repositories", autospec=True) as fake_users_repositories,
        patch("taiga.users.services.ResetPasswordToken", autospec=True) as FakeResetPasswordToken,
    ):
        fake_token = FakeResetPasswordToken()
        fake_token.object_data = object_data
        FakeResetPasswordToken.create.return_value = fake_token
        fake_users_repositories.get_first_user.return_value = user

        ret = await services._get_user_and_reset_password_token(fake_token)
        fake_users_repositories.get_first_user.assert_awaited_once_with(
            **fake_token.object_data, is_active=True, is_system=False
        )
        assert ret == (fake_token, user)


@pytest.mark.parametrize(
    "catched_ex, raised_ex",
    [
        (tokens_ex.DeniedTokenError, ex.UsedResetPasswordTokenError),
        (tokens_ex.ExpiredTokenError, ex.ExpiredResetPassswordTokenError),
        (tokens_ex.TokenError, ex.BadResetPasswordTokenError),
    ],
)
async def test_password_reset_error_token(catched_ex, raised_ex):
    with (
        patch("taiga.users.services.ResetPasswordToken", autospec=True) as FakeResetPasswordToken,
        pytest.raises(raised_ex),
    ):
        FakeResetPasswordToken.create.side_effect = catched_ex

        await services._get_user_and_reset_password_token("some_token")


async def test_password_reset_error_no_user_token():
    object_data = {"id": 1}

    with (
        patch("taiga.users.services.users_repositories", autospec=True) as fake_users_repositories,
        patch("taiga.users.services.ResetPasswordToken", autospec=True) as FakeResetPasswordToken,
        pytest.raises(ex.BadResetPasswordTokenError),
    ):
        fake_token = FakeResetPasswordToken()
        fake_token.object_data = object_data
        FakeResetPasswordToken.create.return_value = fake_token
        fake_users_repositories.get_first_user.return_value = None

        await services._get_user_and_reset_password_token(fake_token)
        fake_token.denylist.assert_awaited()


async def test_request_reset_password_ok():
    user = f.build_user(is_active=True, is_system=False)

    with (
        patch("taiga.users.services.users_repositories", autospec=True) as fake_users_repositories,
        patch("taiga.users.services._send_reset_password_email", return_value=None) as fake_send_reset_password_email,
    ):
        fake_users_repositories.get_user_by_username_or_email.return_value = user

        ret = await services.request_reset_password(user.email)

        fake_users_repositories.get_user_by_username_or_email.assert_awaited_once_with(username_or_email=user.email)
        fake_send_reset_password_email.assert_awaited_once_with(user)
        assert ret is None


@pytest.mark.parametrize(
    "user",
    [
        (None),
        (f.build_user(is_active=False, is_system=False)),
        (f.build_user(is_active=True, is_system=True)),
    ],
)
async def test_request_reset_password_error_user(user):
    with (
        patch("taiga.users.services.users_repositories", autospec=True) as fake_users_repositories,
        patch("taiga.users.services._send_reset_password_email", return_value=None) as fake_send_reset_password_email,
    ):
        fake_users_repositories.get_user_by_username_or_email.return_value = user

        ret = await services.request_reset_password("user@email.com")

        fake_users_repositories.get_user_by_username_or_email.assert_awaited_once()
        fake_send_reset_password_email.assert_not_awaited()
        assert ret is None


async def test_reset_password_send_reset_password_email_ok(tqmanager):
    user = f.build_user()

    with (
        patch(
            "taiga.users.services._generate_reset_password_token", return_value="reset_token"
        ) as fake_generate_reset_password_token,
    ):
        await services._send_reset_password_email(user=user)

        assert len(tqmanager.pending_jobs) == 1
        job = tqmanager.pending_jobs[0]
        assert "send_email" in job["task_name"]
        assert job["args"] == {
            "email_name": "reset_password",
            "to": user.email,
            "context": {"reset_password_token": "reset_token"},
        }

        fake_generate_reset_password_token.assert_awaited_once_with(user)


async def test_reset_password_generate_reset_password_token_ok():
    user = f.build_user()

    with (patch("taiga.users.services.ResetPasswordToken", autospec=True) as FakeResetPasswordToken,):
        fake_token = FakeResetPasswordToken()
        FakeResetPasswordToken.create_for_object.return_value = fake_token

        ret = await services._generate_reset_password_token(user=user)
        FakeResetPasswordToken.create_for_object.assert_awaited_once_with(user)
        FakeResetPasswordToken.create_for_object.assert_awaited_once_with(user)
        assert ret == str(fake_token)


async def test_verify_reset_password_token():
    user = f.build_user(is_active=True)

    with (
        patch(
            "taiga.users.services._get_user_and_reset_password_token", autospec=True
        ) as fake_get_user_and_reset_password_token,
        patch("taiga.users.services.ResetPasswordToken", autospec=True) as FakeResetPasswordToken,
    ):
        fake_token = FakeResetPasswordToken()
        fake_get_user_and_reset_password_token.return_value = (fake_token, user)

        ret = await services.verify_reset_password_token(fake_token)

        fake_get_user_and_reset_password_token.assert_awaited_once_with(fake_token)
        assert ret == bool((fake_token, user))


async def test_verify_reset_password_token_ok():
    user = f.build_user(is_active=True)

    with (
        patch(
            "taiga.users.services._get_user_and_reset_password_token", autospec=True
        ) as fake_get_user_and_reset_password_token,
        patch("taiga.users.services.ResetPasswordToken", autospec=True) as FakeResetPasswordToken,
    ):
        fake_token = FakeResetPasswordToken()
        fake_get_user_and_reset_password_token.return_value = (fake_token, user)

        ret = await services.verify_reset_password_token(fake_token)

        fake_get_user_and_reset_password_token.assert_awaited_once_with(fake_token)
        assert ret == bool((fake_token, user))


async def test_reset_password_ok_with_user():
    user = f.build_user(is_active=True)
    password = "password"

    with (
        patch(
            "taiga.users.services._get_user_and_reset_password_token", autospec=True
        ) as fake_get_user_and_reset_password_token,
        patch("taiga.users.services.users_repositories", autospec=True) as fake_users_repositories,
        patch("taiga.users.services.ResetPasswordToken", autospec=True) as FakeResetPasswordToken,
    ):
        fake_token = FakeResetPasswordToken()
        fake_token.denylist.return_value = None
        fake_get_user_and_reset_password_token.return_value = (fake_token, user)
        fake_users_repositories.change_password.return_value = None

        ret = await services.reset_password(str(fake_token), password)

        fake_users_repositories.change_password.assert_awaited_once_with(user=user, password=password)
        assert ret == user


async def test_reset_password_ok_without_user():
    password = "password"

    with (
        patch(
            "taiga.users.services._get_user_and_reset_password_token", autospec=True
        ) as fake_get_user_and_reset_password_token,
        patch("taiga.users.services.ResetPasswordToken", autospec=True) as FakeResetPasswordToken,
    ):
        fake_token = FakeResetPasswordToken()
        fake_token.denylist.return_value = None
        fake_get_user_and_reset_password_token.return_value = (fake_token, None)

        ret = await services.reset_password(str(fake_token), password)

        assert ret is None


#####################################################################
# User Search
#####################################################################


async def test_get_paginated_users_by_text_ok():
    with (patch("taiga.users.services.users_repositories", autospec=True) as fake_users_repo,):
        fake_users_repo.get_users_by_text.return_value = []

        pagination, users = await services.get_paginated_users_by_text(
            text="text", project_slug="slug", offset=9, limit=10
        )

        fake_users_repo.get_users_by_text.assert_awaited_with(
            text_search="text", project_slug="slug", offset=9, limit=10
        )

        assert users == []
