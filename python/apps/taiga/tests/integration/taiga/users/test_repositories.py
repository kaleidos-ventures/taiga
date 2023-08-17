# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC
from unittest import IsolatedAsyncioTestCase

import pytest
from asgiref.sync import sync_to_async
from taiga.base.db.exceptions import IntegrityError
from taiga.projects.invitations.choices import ProjectInvitationStatus
from taiga.users import repositories as users_repositories
from taiga.users.models import User
from taiga.users.tokens import VerifyUserToken
from tests.utils import db
from tests.utils import factories as f

pytestmark = pytest.mark.django_db(transaction=True)


##########################################################
# create_user
##########################################################


async def test_create_user_success():
    email = "EMAIL@email.com"
    full_name = "Full Name"
    color = 8
    password = "password"
    lang = "es-ES"
    user = await users_repositories.create_user(
        email=email, full_name=full_name, color=color, password=password, lang=lang
    )
    await db.refresh_model_from_db(user)
    assert user.email == email.lower()
    assert user.username == "email"
    assert user.password
    assert user.lang == lang


async def test_create_user_error_email_or_username_case_insensitive():
    email = "EMAIL@email.com"
    full_name = "Full Name"
    password = "password"
    lang = "es-ES"
    color = 1

    await users_repositories.create_user(email=email, full_name=full_name, password=password, lang=lang, color=color)

    with pytest.raises(IntegrityError):
        await users_repositories.create_user(
            email=email.upper(), full_name=full_name, password=password, lang=lang, color=color
        )


async def test_create_user_no_password_from_social():
    email = "EMAIL@email.com"
    full_name = "Full Name"
    password = None
    lang = "es-ES"
    color = 1

    res = await users_repositories.create_user(
        email=email, full_name=full_name, password=password, lang=lang, color=color
    )

    assert res.password == ""


##########################################################
# list_users
##########################################################


async def test_list_users_by_usernames():
    user1 = await f.create_user()
    user2 = await f.create_user()
    user3 = await f.create_user(is_active=False)

    users = await users_repositories.list_users(
        filters={"is_active": True, "usernames": [user1.username, user2.username, user3.username]}
    )

    assert len(users) == 2
    assert user3 not in users


async def test_list_users_by_emails():
    user1 = await f.create_user()
    user2 = await f.create_user()
    user3 = await f.create_user(is_active=False)

    users = await users_repositories.list_users(
        filters={"is_active": True, "emails": [user1.email, user2.email, user3.email]}
    )

    assert len(users) == 2
    assert user3 not in users


async def test_list_guests_in_ws_for_project():
    member = await f.create_user()
    invitee = await f.create_user()
    workspace = await f.create_workspace()
    project = await f.create_project(created_by=workspace.created_by, workspace=workspace)
    general_role = await f.create_project_role(project=project, is_admin=False)
    await f.create_project_membership(user=member, project=project, role=general_role)
    await f.create_project_invitation(
        email=invitee.email,
        user=invitee,
        project=project,
        role=general_role,
        status=ProjectInvitationStatus.PENDING,
        invited_by=project.created_by,
    )

    users = await users_repositories.list_users(filters={"guest_in_ws_for_project": project})

    assert len(users) == 2
    assert invitee in users
    assert member in users


async def test_list_guests_in_workspace():
    workspace = await f.create_workspace()
    pj_member = await f.create_user()
    project = await f.create_project(created_by=workspace.created_by, workspace=workspace)
    general_role = await f.create_project_role(project=project, is_admin=False)
    await f.create_project_membership(user=pj_member, project=project, role=general_role)
    ws_invitee = await f.create_user()
    await f.create_workspace_invitation(user=ws_invitee, workspace=workspace)

    guests = await users_repositories.list_users(filters={"guests_in_workspace": workspace})

    assert len(guests) == 1
    assert pj_member in guests
    assert ws_invitee not in guests


class ListUserByText(IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.ws_pj_admin = await f.create_user(is_active=True, username="wsadmin", full_name="ws-pj-admin")
        self.elettescar = await f.create_user(is_active=True, username="elettescar", full_name="Elettescar - ws member")
        self.electra = await f.create_user(is_active=True, username="electra", full_name="Electra - pj member")
        self.danvers = await f.create_user(is_active=True, username="danvers", full_name="Danvers elena")
        await f.create_user(is_active=True, username="edanvers", full_name="Elena Danvers")
        await f.create_user(is_active=True, username="elmary", full_name="Él Marinari")
        self.storm = await f.create_user(is_active=True, username="storm", full_name="Storm Smith")
        self.inactive_user = await f.create_user(is_active=False, username="inactive", full_name="Inactive User")

        # elettescar is ws-member
        self.workspace = await f.create_workspace(created_by=self.ws_pj_admin, color=2)
        await f.create_workspace_membership(user=self.elettescar, workspace=self.workspace)

        # electra is a pj-member (from the previous workspace)
        self.project = await f.create_project(workspace=self.workspace, created_by=self.ws_pj_admin)
        self.general_role = await f.create_project_role(project=self.project, is_admin=False)
        await f.create_project_membership(user=self.electra, project=self.project, role=self.general_role)

        # danvers has a pending invitation
        await f.create_project_invitation(
            email="danvers@email.com",
            user=self.danvers,
            project=self.project,
            role=self.general_role,
            status=ProjectInvitationStatus.PENDING,
            invited_by=self.ws_pj_admin,
        )

    ##########################################################
    # list_project_users_by_text
    ##########################################################

    async def test_list_project_users_no_filter(self):
        # searching all but inactive or system users (no text or project specified).
        # results returned by alphabetical order (full_name/username)
        all_active_no_sys_users_result = await users_repositories.list_project_users_by_text()
        assert len(all_active_no_sys_users_result) == 7
        assert all_active_no_sys_users_result[0].full_name == "Danvers elena"
        assert all_active_no_sys_users_result[1].full_name == "Electra - pj member"
        assert all_active_no_sys_users_result[2].full_name == "Elena Danvers"
        assert self.inactive_user not in all_active_no_sys_users_result

    async def test_list_project_users_ordering(self):
        # searching for project, no text search. Ordering by project closeness and alphabetically (full_name/username)
        result = await users_repositories.list_project_users_by_text(project_id=self.project.id)
        assert len(result) == 7
        # pj members should be returned first (project closeness criteria)
        assert result[0].full_name == "Electra - pj member"
        assert result[0].user_is_member is True
        assert result[0].user_has_pending_invitation is False
        assert result[1].full_name == "ws-pj-admin"
        assert result[1].user_is_member is True
        assert result[1].user_has_pending_invitation is False
        # ws members should be returned secondly
        assert result[2].full_name == "Elettescar - ws member"
        assert result[2].user_is_member is False
        assert result[2].user_has_pending_invitation is False
        # then the rest of users alphabetically
        assert result[3].full_name == "Danvers elena"
        assert result[3].user_is_member is False
        assert result[3].user_has_pending_invitation is True
        assert result[4].full_name == "Elena Danvers"
        assert result[5].full_name == "Él Marinari"
        assert result[6].full_name == "Storm Smith"

        assert self.inactive_user not in result

    async def test_list_project_users_by_text_lower_case(self):
        # searching for a text containing several words in lower case
        result = await users_repositories.list_project_users_by_text(text_search="storm smith")
        assert len(result) == 1
        assert result[0].full_name == "Storm Smith"

    async def test_list_project_users_by_text_special_chars(self):
        # searching for texts containing special chars (and cause no exception)
        result = await users_repositories.list_project_users_by_text(text_search="<")
        assert len(result) == 0

    async def test_list_project_users_text_weights(self):
        # Paginated search according to search text weights.
        # 1st order by project closeness (pj, ws, others), 2nd by text search order (rank, left match)
        result = await users_repositories.list_project_users_by_text(
            text_search="EL", project_id=self.project.id, offset=0, limit=4
        )
        assert len(result) == 4
        # first result must be `electra` as a pj-member (no matter how low her rank is against other farther pj users)
        assert result[0].full_name == "Electra - pj member"
        # second result should be `elettescar` as ws-member matching the text
        assert result[1].full_name == "Elettescar - ws member"
        # then the rest of users alphabetically ordered by rank and alphabetically.
        # first would be *Él* Marinari/*el*mary with the highest rank (0.6079)
        assert result[2].full_name == "Él Marinari"
        # then goes `Elena Danvers` with a tied second rank (0.3039) but her name starts with the searched text ('el')
        assert result[3].full_name == "Elena Danvers"
        # `Danvers Elena` has the same rank (0.3039) but his name doesn't start with 'el', so he's left outside from the
        # results due to the pagination limit (4)
        assert self.danvers not in result
        assert self.inactive_user not in result
        assert self.ws_pj_admin not in result
        assert self.storm not in result

    ##########################################################
    # list_workspace_users_by_text
    ##########################################################

    async def test_list_workspace_users_by_workspace(self):
        # workspace search, no text search. Ordering by workspace closeness and alphabetically (full_name/username)
        result = await users_repositories.list_workspace_users_by_text(workspace_id=self.workspace.id)
        assert len(result) == 7
        # ws members should be returned first (workspace closeness criteria)
        assert result[0].full_name == "Elettescar - ws member"
        assert result[0].user_is_member is True
        assert result[0].user_has_pending_invitation is False
        assert result[1].full_name == "ws-pj-admin"
        assert result[1].user_is_member is True
        assert result[1].user_has_pending_invitation is False
        # any member of the workspace's projects should be returned secondly
        assert result[2].full_name == "Electra - pj member"
        assert result[2].user_is_member is False
        assert result[2].user_has_pending_invitation is False
        # then the rest of users alphabetically
        assert result[3].full_name == "Danvers elena"
        assert result[3].user_is_member is False
        assert result[3].user_has_pending_invitation is False
        assert result[4].full_name == "Elena Danvers"
        assert result[5].full_name == "Él Marinari"
        assert result[6].full_name == "Storm Smith"

        assert self.inactive_user not in result

    async def test_list_workspace_users_by_text_lower_case(self):
        # searching for a text containing several words in lower case
        result = await users_repositories.list_workspace_users_by_text(
            text_search="storm smith", workspace_id=self.workspace.id
        )
        assert len(result) == 1
        assert result[0].full_name == "Storm Smith"

    async def test_list_workspace_users_by_text_special_chars(self):
        # searching for texts containing special chars (and cause no exception)
        result = await users_repositories.list_workspace_users_by_text(text_search="<", workspace_id=self.workspace.id)
        assert len(result) == 0

    async def test_list_workspace_users_text_weights(self):
        # Paginated search according to search text weights.
        # 1st order by workspace closeness (ws, ws'pj membership, others), 2nd by text search order (rank, left match)
        result = await users_repositories.list_workspace_users_by_text(
            text_search="EL", workspace_id=self.workspace.id, offset=0, limit=4
        )
        assert len(result) == 4
        # first result must be 'elettescar' as the only ws-member matching the text
        assert result[0].full_name == "Elettescar - ws member"
        # second result should be `electra` as the only member of the workspace's projects matching the text
        assert result[1].full_name == "Electra - pj member"
        # then the rest of users alphabetically ordered by rank and alphabetically, always matching the text.
        # first would be *Él* Marinari/*el*mary with the highest rank (0.6079)
        assert result[2].full_name == "Él Marinari"
        # then goes `Elena Danvers` with a tied second rank (0.3039) but her name starts with the searched text ('el')
        assert result[3].full_name == "Elena Danvers"
        # `Danvers Elena` has the same rank (0.3039) but his name doesn't start with 'el', so he's left outside from the
        # results due to the pagination limit (4)
        assert self.danvers not in result
        assert self.inactive_user not in result
        assert self.ws_pj_admin not in result
        assert self.storm not in result


##########################################################
# get_user
##########################################################


async def test_get_user_by_username_or_email_success_username_case_insensitive():
    user = await f.create_user(username="test_user_1")
    await f.create_user(username="test_user_2")
    assert user == await users_repositories.get_user(filters={"username_or_email": "test_user_1"})
    assert user == await users_repositories.get_user(filters={"username_or_email": "TEST_user_1"})


async def test_get_user_by_username_or_email_error_invalid_username_case_insensitive():
    assert await users_repositories.get_user(filters={"username_or_email": "test_other_user"}) is None


async def test_get_user_by_username_or_email_success_email_case_insensitive():
    user = await f.create_user(email="test_user_1@email.com")
    await f.create_user(email="test_user_2@email.com")
    assert user == await users_repositories.get_user(filters={"username_or_email": "test_user_1@email.com"})
    assert user == await users_repositories.get_user(filters={"username_or_email": "TEST_user_1@email.com"})


async def test_get_user_by_username_or_email_error_invalid_email_case_insensitive():
    assert await users_repositories.get_user(filters={"username_or_email": "test_other_user@email.com"}) is None


async def test_get_user_by_email():
    user = await f.create_user()
    assert user == await users_repositories.get_user(filters={"email": user.email})


async def test_get_user_by_uuid():
    user = await f.create_user()
    assert user == await users_repositories.get_user(filters={"id": user.id})


##########################################################
# update_user
##########################################################


async def test_update_user():
    user = await f.create_user(username="old_username")
    assert user.username == "old_username"
    updated_user = await users_repositories.update_user(
        user=user,
        values={"username": "new_username"},
    )
    assert updated_user.username == "new_username"


##########################################################
# delete_user
##########################################################


async def test_delete_user():
    user = await f.create_user(username="user", is_active=True)

    deleted = await users_repositories.delete_user(filters={"id": user.id})
    assert deleted == 1


##########################################################
# misc - check_password / change_password
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
# misc - clean_expired_users
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
# create_auth_data
##########################################################


async def test_create_auth_data():
    user = await f.create_user()
    key = "google"
    value = "1234"

    await users_repositories.create_auth_data(user=user, key=key, value=value)

    auth_data = await users_repositories.get_auth_data(filters={"key": key, "value": value})
    assert auth_data.user == user
    assert auth_data.key == key


##########################################################
# list_auths_data
##########################################################


async def test_list_auths_data():
    user = await f.create_user()
    auth_data1 = await f.create_auth_data(user=user, key="google")
    auth_data2 = await f.create_auth_data(user=user, key="gitlab")

    auth_datas = await users_repositories.list_auths_data(filters={"user_id": user.id})
    assert auth_data1 in auth_datas
    assert auth_data2 in auth_datas

    auth_datas = await users_repositories.list_auths_data(filters={"user_id": user.id, "key": auth_data1.key})
    assert auth_data1 in auth_datas
    assert auth_data2 not in auth_datas


async def test_list_auths_data_filtered():
    user = await f.create_user()
    auth_data1 = await f.create_auth_data(user=user, key="google")
    auth_data2 = await f.create_auth_data(user=user, key="gitlab")

    auth_datas = await users_repositories.list_auths_data(filters={"user_id": user.id})
    assert auth_data1 in auth_datas
    assert auth_data2 in auth_datas

    auth_datas = await users_repositories.list_auths_data(filters={"user_id": user.id, "key": auth_data1.key})
    assert auth_data1 in auth_datas
    assert auth_data2 not in auth_datas


async def test_list_auths_data_default_related():
    user = await f.create_user()
    await f.create_auth_data(user=user)

    auth_datas = await users_repositories.list_auths_data(filters={"user_id": user.id})
    assert auth_datas[0].user.email == user.email


##########################################################
# get_auth_data
##########################################################


async def test_get_auth_data():
    auth_data = await f.create_auth_data()
    assert auth_data == await users_repositories.get_auth_data(filters={"key": auth_data.key, "value": auth_data.value})
