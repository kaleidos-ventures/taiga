# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from unittest.mock import MagicMock, patch

import pytest
from taiga.auth.dataclasses import AccessWithRefreshToken
from taiga.invitations.exceptions import BadInvitationTokenError, InvitationDoesNotExistError
from taiga.tokens import exceptions as tokens_ex
from taiga.users import exceptions as ex
from taiga.users import services
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
        patch("taiga.users.services._generate_username", return_value=username),
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
        patch("taiga.users.services.invitations_services", autospec=True) as fake_invitation_service,
        patch("taiga.users.services.auth_services", autospec=True) as fake_auth_services,
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
        fake_users_repo.get_first_user.assert_awaited_once_with(**object_data, is_active=False, is_system=False)
        fake_users_repo.verify_user.assert_awaited_once_with(user=user)
        fake_token.get.assert_called_with("accept_project_invitation", False)
        fake_invitation_service.accept_project_invitation_from_token.assert_not_awaited()
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
        patch("taiga.users.services.invitations_services", autospec=True) as fake_invitation_service,
        patch("taiga.users.services.auth_services", autospec=True) as fake_auth_services,
    ):
        fake_token = FakeVerifyUserToken()
        fake_token.object_data = object_data
        fake_token.get.side_effect = [project_invitation_token, accept_project_invitation]
        fake_auth_services.create_auth_credentials.return_value = auth_credentials
        FakeVerifyUserToken.create.return_value = fake_token
        fake_invitation_service.accept_project_invitation_from_token.return_value = project_invitation
        fake_users_repo.get_first_user.return_value = user

        info = await services.verify_user("some_token")

        assert info.auth == auth_credentials
        assert info.project_invitation == project_invitation

        fake_token.denylist.assert_awaited_once()
        fake_users_repo.get_first_user.assert_awaited_once_with(**object_data, is_active=False, is_system=False)
        fake_users_repo.verify_user.assert_awaited_once_with(user=user)
        fake_token.get.assert_called_with("accept_project_invitation", False)
        fake_invitation_service.accept_project_invitation_from_token.assert_awaited_once_with(
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
        patch("taiga.users.services.invitations_services", autospec=True) as fake_invitation_service,
        patch("taiga.users.services.auth_services", autospec=True) as fake_auth_services,
    ):
        fake_token = FakeVerifyUserToken()
        fake_token.object_data = object_data
        fake_token.get.side_effect = [project_invitation_token, accept_project_invitation]
        fake_auth_services.create_auth_credentials.return_value = auth_credentials
        FakeVerifyUserToken.create.return_value = fake_token
        fake_invitation_service.get_project_invitation.return_value = project_invitation
        fake_users_repo.get_first_user.return_value = user

        info = await services.verify_user("some_token")

        assert info.auth == auth_credentials
        assert info.project_invitation == project_invitation

        fake_token.denylist.assert_awaited_once()
        fake_users_repo.get_first_user.assert_awaited_once_with(**object_data, is_active=False, is_system=False)
        fake_users_repo.verify_user.assert_awaited_once_with(user=user)
        fake_token.get.assert_called_with("accept_project_invitation", False)
        not fake_invitation_service.accept_project_invitation_from_token.assert_awaited
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
        patch("taiga.users.services.invitations_services", autospec=True) as fake_invitation_service,
        patch("taiga.users.services.auth_services", autospec=True) as fake_auth_services,
    ):
        fake_token = FakeVerifyUserToken()
        fake_token.object_data = object_data
        fake_token.get.side_effect = [project_invitation_token, accept_project_invitation]
        fake_auth_services.create_auth_credentials.return_value = auth_credentials
        FakeVerifyUserToken.create.return_value = fake_token
        fake_invitation_service.get_project_invitation.return_value = project_invitation
        fake_users_repo.get_first_user.return_value = user

        #  exception when recovering the project invitation
        fake_invitation_service.get_project_invitation.side_effect = exception

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
# my_contacts
##########################################################


async def test_list_my_contacts():
    with patch("taiga.users.services.users_repositories", autospec=True) as fake_users_repositories:
        user = f.build_user(is_active=True)
        await services.list_user_contacts(user, [user.email])
        fake_users_repositories.get_user_contacts.assert_awaited_once_with(user_id=user.id, emails=[user.email])


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

    with (patch("taiga.users.services.VerifyUserToken", autospec=True) as FakeVerifyUserToken,):
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
