# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import pytest
from asgiref.sync import sync_to_async
from taiga.permissions import choices
from taiga.users import repositories as users_repositories
from taiga.users.models import User
from taiga.users.tokens import VerifyUserToken
from tests.utils import db
from tests.utils import factories as f

pytestmark = pytest.mark.django_db(transaction=True)


##########################################################
# get_user_by_username_or_email
##########################################################

# username


async def test_get_user_by_username_or_email_success_username_case_insensitive():
    user = await f.create_user(username="test_user_1")
    await f.create_user(username="test_user_2")
    assert user == await users_repositories.get_user_by_username_or_email(username_or_email="TEST_user_1")


async def test_get_user_by_username_or_email_success_username_case_sensitive():
    await f.create_user(username="test_user")
    user = await f.create_user(username="TEST_user")
    assert user == await users_repositories.get_user_by_username_or_email(username_or_email="TEST_user")


async def test_get_user_by_username_or_email_error_invalid_username_case_insensitive():
    await f.create_user(username="test_user")
    assert await users_repositories.get_user_by_username_or_email(username_or_email="TEST_other_user") is None


async def test_get_user_by_username_or_email_error_invalid_username_case_sensitive():
    await f.create_user(username="test_user")
    await f.create_user(username="TEST_user")
    assert await users_repositories.get_user_by_username_or_email(username_or_email="test_USER") is None


# email


async def test_get_user_by_username_or_email_success_email_case_insensitive():
    user = await f.create_user(email="test_user_1@email.com")
    await f.create_user(email="test_user_2@email.com")
    assert user == await users_repositories.get_user_by_username_or_email(username_or_email="TEST_user_1@email.com")


async def test_get_user_by_username_or_email_success_email_case_sensitive():
    await f.create_user(email="test_user@email.com")
    user = await f.create_user(email="TEST_user@email.com")
    assert user == await users_repositories.get_user_by_username_or_email(username_or_email="TEST_user@email.com")


async def test_get_user_by_username_or_email_error_invalid_email_case_insensitive():
    await f.create_user(email="test_user@email.com")
    assert await users_repositories.get_user_by_username_or_email(username_or_email="test_other_user@email.com") is None


async def test_get_user_by_username_or_email_error_invalid_email_case_sensitive():
    await f.create_user(email="test_user@email.com")
    await f.create_user(email="TEST_user@email.com")
    assert await users_repositories.get_user_by_username_or_email(username_or_email="test_USER@email.com") is None


##########################################################
# check_password / change_password
##########################################################


async def test_change_password_and_check_password():
    password1 = "password-one"
    password2 = "password-two"
    user = await f.create_user(password=password1)

    assert await users_repositories.check_password(user, password1)
    assert not await users_repositories.check_password(user, password2)

    await users_repositories.change_password(user, password2)

    assert not await users_repositories.check_password(user, password1)
    assert await users_repositories.check_password(user, password2)


##########################################################
# create_user
##########################################################


async def test_create_user():
    email = "email@email.com"
    username = "username"
    full_name = "Full Name"
    password = "password"
    user = await users_repositories.create_user(email=email, username=username, full_name=full_name, password=password)
    await db.refresh_model_from_db(user)
    assert user.username == username
    assert user.password


##########################################################
# activate_user
##########################################################


async def test_verify_user():
    user = await f.create_user(is_active=False)

    assert not user.is_active
    assert user.date_verification is None

    await users_repositories.verify_user(user)
    await db.refresh_model_from_db(user)

    assert user.is_active
    assert user.date_verification is not None


##########################################################
# clean_expired_users
##########################################################


@sync_to_async
def get_total_users() -> int:
    return User.objects.count()


async def test_clean_expired_users():
    total_users = await get_total_users()
    await f.create_user(is_active=False)  # without token - it'll be cleaned
    user = await f.create_user(is_active=False)  # with token - it won't be cleaned
    await VerifyUserToken.create_for_object(user)

    assert await get_total_users() == total_users + 2
    await users_repositories.clean_expired_users()
    assert await get_total_users() == total_users + 1


##########################################################
# get_users_by_text
##########################################################


async def test_get_users_by_text():
    ws_pj_admin = await f.create_user(full_name="ws-pj-admin")
    elettescar = await f.create_user(is_active=True, username="elettescar", full_name="Martina Eaton")
    electra = await f.create_user(is_active=True, username="electra@email.com", full_name="Sonia Moreno")
    danvers = await f.create_user(is_active=True, username="danvers@email.com", full_name="Elena Riego")
    elmarv = await f.create_user(is_active=True, username="elmary@email.com", full_name="Joanna Marinari")
    storm = await f.create_user(is_active=True, username="storm@email.com", full_name="Martina Elliott Wagner")
    inactive_user = await f.create_user(is_active=False, username="inactive@email.com", full_name="Inactive User")
    system_user = await f.create_user(
        is_system=True, is_active=True, username="system@email.com", full_name="System User"
    )

    # elettescar is ws-member
    workspace = await f.create_workspace(is_premium=True, owner=ws_pj_admin, color=2)
    general_member_role = await f.create_workspace_role(
        permissions=choices.WORKSPACE_PERMISSIONS, is_admin=False, workspace=workspace
    )
    await f.create_workspace_membership(user=elettescar, workspace=workspace, workspace_role=general_member_role)

    # electra is a pj-member (from the previous workspace)
    project = await f.create_project(workspace=workspace, owner=ws_pj_admin)
    general_member_role = await f.create_role(project=project, is_admin=False)
    await f.create_membership(user=electra, project=project, role=general_member_role)

    # searching with default values (all users but inactive/system users)
    all_active_no_sys_users_result = await users_repositories.get_users_by_text()
    assert len(all_active_no_sys_users_result) == 6
    assert all_active_no_sys_users_result[0] == danvers
    assert all_active_no_sys_users_result[1] == elmarv
    assert all_active_no_sys_users_result[2] == elettescar
    assert inactive_user not in all_active_no_sys_users_result
    assert system_user not in all_active_no_sys_users_result

    # searching for texts, ordering by project
    search_by_text_no_pj_result = await users_repositories.get_users_by_text(
        text_search="el", project_slug=project.slug, excluded_usernames=["ws-pj-admin"]
    )
    assert len(search_by_text_no_pj_result) == 5
    assert search_by_text_no_pj_result[0] == electra
    assert search_by_text_no_pj_result[1] == elettescar
    assert search_by_text_no_pj_result[2] == danvers
    assert inactive_user not in search_by_text_no_pj_result
    assert ws_pj_admin not in search_by_text_no_pj_result

    # searching for texts containing several words (full names)
    search_by_text_spaces_result = await users_repositories.get_users_by_text(text_search="martina elliott wag")
    assert len(search_by_text_spaces_result) == 1
    assert search_by_text_spaces_result[0] == storm

    # searching for texts containing special chars (cause no exception)
    search_by_special_chars = await users_repositories.get_users_by_text(text_search="<")
    assert len(search_by_special_chars) == 0

    # search pagination
    search_by_text_no_pj_pagination_result = await users_repositories.get_users_by_text(
        text_search="el", project_slug=project.slug, excluded_usernames=["ws-pj-admin"], offset=2, limit=3
    )
    assert len(search_by_text_no_pj_pagination_result) == 3
    assert search_by_text_no_pj_pagination_result[0] == danvers
    assert search_by_text_no_pj_pagination_result[1] == elmarv
    assert search_by_text_no_pj_pagination_result[2] == storm
    assert inactive_user not in search_by_text_no_pj_pagination_result
    assert ws_pj_admin not in search_by_text_no_pj_pagination_result
    assert electra not in search_by_text_no_pj_pagination_result

    # searching for inactive and system users
    search_by_text_inactive_system = await users_repositories.get_users_by_text(
        exclude_inactive=False, exclude_system=False
    )
    assert inactive_user in search_by_text_inactive_system
    assert system_user in search_by_text_inactive_system
