# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import pytest
from asgiref.sync import sync_to_async
from taiga.invitations.choices import InvitationStatus
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
# verify_user
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
    ws_pj_admin = await f.create_user(is_active=True, username="wsadmin", full_name="ws-pj-admin")
    elettescar = await f.create_user(is_active=True, username="elettescar", full_name="Elettescar - ws member")
    electra = await f.create_user(is_active=True, username="electra", full_name="Electra - pj member")
    danvers = await f.create_user(is_active=True, username="danvers", full_name="Danvers elena")
    await f.create_user(is_active=True, username="edanvers", full_name="Elena Danvers")
    await f.create_user(is_active=True, username="elmary", full_name="Él Marinari")
    storm = await f.create_user(is_active=True, username="storm", full_name="Storm Smith")
    inactive_user = await f.create_user(is_active=False, username="inactive", full_name="Inactive User")
    system_user = await f.create_user(is_system=True, is_active=True, username="system", full_name="System User")

    # elettescar is ws-member
    workspace = await f.create_workspace(is_premium=True, owner=ws_pj_admin, color=2)
    general_member_role = await f.create_workspace_role(
        permissions=choices.WORKSPACE_PERMISSIONS, is_admin=False, workspace=workspace
    )
    await f.create_workspace_membership(user=elettescar, workspace=workspace, workspace_role=general_member_role)

    # electra is a pj-member (from the previous workspace)
    project = await f.create_project(workspace=workspace, owner=ws_pj_admin)
    general_role = await f.create_role(project=project, is_admin=False)
    await f.create_membership(user=electra, project=project, role=general_role)

    # danvers has a pending invitation
    await f.create_invitation(
        email="danvers@email.com",
        user=danvers,
        project=project,
        role=general_role,
        status=InvitationStatus.PENDING,
        invited_by=ws_pj_admin,
    )

    # searching all but inactive or system users (no text or project specified). Alphabetical order (full_name/username)
    all_active_no_sys_users_result = await users_repositories.get_users_by_text()
    assert len(all_active_no_sys_users_result) == 7
    assert all_active_no_sys_users_result[0].full_name == "Danvers elena"
    assert all_active_no_sys_users_result[1].full_name == "Electra - pj member"
    assert all_active_no_sys_users_result[2].full_name == "Elena Danvers"
    assert inactive_user not in all_active_no_sys_users_result
    assert system_user not in all_active_no_sys_users_result

    # searching for project, no text search. Ordering by project closeness and alphabetically (full_name/username)
    search_by_text_no_pj_result = await users_repositories.get_users_by_text(project_slug=project.slug)
    assert len(search_by_text_no_pj_result) == 7
    # pj members should be returned first (project closeness criteria)
    assert search_by_text_no_pj_result[0].full_name == "Electra - pj member"
    assert search_by_text_no_pj_result[0].user_is_member is True
    assert search_by_text_no_pj_result[0].user_has_pending_invitation is False
    assert search_by_text_no_pj_result[1].full_name == "ws-pj-admin"
    assert search_by_text_no_pj_result[1].user_is_member is True
    assert search_by_text_no_pj_result[1].user_has_pending_invitation is False
    # ws members should be returned secondly
    assert search_by_text_no_pj_result[2].full_name == "Elettescar - ws member"
    assert search_by_text_no_pj_result[2].user_is_member is False
    assert search_by_text_no_pj_result[2].user_has_pending_invitation is False
    # then the rest of users alphabetically
    assert search_by_text_no_pj_result[3].full_name == "Danvers elena"
    assert search_by_text_no_pj_result[3].user_is_member is False
    assert search_by_text_no_pj_result[3].user_has_pending_invitation is True
    assert search_by_text_no_pj_result[4].full_name == "Elena Danvers"
    assert search_by_text_no_pj_result[5].full_name == "Él Marinari"
    assert search_by_text_no_pj_result[6].full_name == "Storm Smith"

    assert inactive_user not in search_by_text_no_pj_result
    assert system_user not in search_by_text_no_pj_result

    # searching for a text containing several words in lower case
    search_by_text_spaces_result = await users_repositories.get_users_by_text(text_search="storm smith")
    assert len(search_by_text_spaces_result) == 1
    assert search_by_text_spaces_result[0].full_name == "Storm Smith"

    # searching for texts containing special chars (and cause no exception)
    search_by_special_chars = await users_repositories.get_users_by_text(text_search="<")
    assert len(search_by_special_chars) == 0

    # Paginated search. Order first by project closeness (pj, ws, others), then by text search order (rank, left match)
    search_by_text_no_pj_pagination_result = await users_repositories.get_users_by_text(
        text_search="EL", project_slug=project.slug, offset=0, limit=4
    )

    assert len(search_by_text_no_pj_pagination_result) == 4
    # first result must be `electra` as a pj-member (no matter how low her rank is against other farther pj users)
    assert search_by_text_no_pj_pagination_result[0].full_name == "Electra - pj member"
    # second result should be `elettescar` as a ws-member (no matter how low her rank is against other farther-pj users)
    assert search_by_text_no_pj_pagination_result[1].full_name == "Elettescar - ws member"
    # then the rest of users alphabetically ordered by rank and alphabetically.
    # first would be *Él* Marinari/*el*mary with the highest rank (0.6079)
    assert search_by_text_no_pj_pagination_result[2].full_name == "Él Marinari"
    # then goes `Elena Danvers` with a tied second rank (0.3039) but her name starts with the searched text ('el')
    assert search_by_text_no_pj_pagination_result[3].full_name == "Elena Danvers"
    # `Danvers Elena` has the same rank (0.3039) but his name doesn't start with 'el', so he's left outside from the
    # results due to the pagination limit (4)
    assert danvers not in search_by_text_no_pj_pagination_result
    assert inactive_user not in search_by_text_no_pj_pagination_result
    assert ws_pj_admin not in search_by_text_no_pj_pagination_result
    assert storm not in search_by_text_no_pj_pagination_result

    # searching for inactive and system users
    search_by_text_inactive_system = await users_repositories.get_users_by_text(
        exclude_inactive=False, exclude_system=False
    )
    assert inactive_user in search_by_text_inactive_system
    assert system_user in search_by_text_inactive_system
    len(search_by_text_inactive_system) == 9
