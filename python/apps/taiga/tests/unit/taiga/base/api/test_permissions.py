# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import pytest
from taiga.base.api.permissions import And, Not, Or, check_permissions
from taiga.base.db.users import AnonymousUser
from taiga.exceptions import api as ex
from taiga.permissions import (
    AllowAny,
    CanViewProject,
    DenyAll,
    HasPerm,
    IsASelfRequest,
    IsAuthenticated,
    IsProjectAdmin,
    IsSuperUser,
    IsWorkspaceMember,
)
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


#####################################################
# check_permissions (is_authorized)
#####################################################


async def test_check_permission_allow_any():
    user1 = await f.create_user()
    permissions = AllowAny()

    # always granted permissions
    assert await check_permissions(permissions=permissions, user=user1, obj=None) is None


async def test_check_permission_deny_all():
    user = await f.create_user()
    permissions = DenyAll()

    # never granted permissions
    with pytest.raises(ex.ForbiddenError):
        await check_permissions(permissions=permissions, user=user, obj=None)


async def test_check_permission_is_authenticated():
    user1 = await f.create_user()
    user2 = AnonymousUser()
    permissions = IsAuthenticated()

    # User.is_authenticated is always True
    assert await check_permissions(permissions=permissions, user=user1, obj=None) is None
    # AnonymousUser.is_authenticated is always False
    with pytest.raises(ex.ForbiddenError):
        await check_permissions(permissions=permissions, user=user2, obj=None)


async def test_check_permission_is_superuser():
    user1 = await f.create_user(is_superuser=True)
    user2 = await f.create_user(is_superuser=False)
    permissions = IsSuperUser()

    assert await check_permissions(permissions=permissions, user=user1, obj=None) is None
    with pytest.raises(ex.ForbiddenError):
        await check_permissions(permissions=permissions, user=user2, obj=None)


async def test_check_permission_has_perm():
    user1 = await f.create_user()
    user2 = await f.create_user()
    project1 = await f.create_project(created_by=user1)
    project2 = await f.create_project()
    permissions = HasPerm("view_story")

    # user1 has modify permissions
    assert await check_permissions(permissions=permissions, user=user1, obj=project1) is None
    # user2 hasn't modify permissions
    with pytest.raises(ex.ForbiddenError):
        await check_permissions(permissions=permissions, user=user2, obj=project2)


async def test_check_permission_is_project_admin():
    user1 = await f.create_user()
    user2 = await f.create_user()
    project = await f.create_project(created_by=user1)
    permissions = IsProjectAdmin()

    # user1 is pj-admin
    assert await check_permissions(permissions=permissions, user=user1, obj=project) is None
    # user2 isn't pj-admin
    with pytest.raises(ex.ForbiddenError):
        await check_permissions(permissions=permissions, user=user2, obj=project)


async def test_check_permission_is_workspace_admin():
    user1 = await f.create_user()
    user2 = await f.create_user()
    workspace = await f.create_workspace(name="workspace1", created_by=user1)
    permissions = IsWorkspaceMember()

    # user1 is ws-admin
    assert await check_permissions(permissions=permissions, user=user1, obj=workspace) is None
    # user2 isn't ws-admin
    with pytest.raises(ex.ForbiddenError):
        await check_permissions(permissions=permissions, user=user2, obj=workspace)


async def test_check_permission_can_view_project():
    user1 = await f.create_user()
    user2 = await f.create_user()
    project = await f.create_project(created_by=user1)
    permissions = CanViewProject()

    # user is pj-admin
    assert await check_permissions(permissions=permissions, user=user1, obj=project) is None
    # user2 isn't pj-member
    with pytest.raises(ex.ForbiddenError):
        await check_permissions(permissions=permissions, user=user2, obj=project)


async def test_check_permission_is_a_self_request():
    user1 = f.build_user()
    user2 = f.build_user()
    permissions = IsASelfRequest()

    # user1 and obj are the same user
    assert await check_permissions(permissions=permissions, user=user1, obj=user1) is None

    # user1 and obj are not the same user
    with pytest.raises(ex.ForbiddenError):
        await check_permissions(permissions=permissions, user=user2, obj=user1)

    membership = f.build_project_membership(user=user1)
    # user1 and obj.user are the same user
    assert await check_permissions(permissions=permissions, user=user1, obj=membership) is None
    # user1 and obj.user are not the same user
    with pytest.raises(ex.ForbiddenError):
        await check_permissions(permissions=permissions, user=user2, obj=membership)


#######################################################
# check_permissions (global & enough_perms)
#######################################################


async def test_check_permission_global_perms():
    # user is pj-admin
    user = await f.create_user()
    project = await f.create_project(created_by=user)
    permissions = IsProjectAdmin()

    # user IsProjectAdmin (true) & globalPerm(AllowAny) (true)
    assert await check_permissions(permissions=permissions, global_perms=AllowAny(), user=user, obj=project) is None
    # user IsProjectAdmin (true) & globalPerm(AllowAny) (false)
    with pytest.raises(ex.ForbiddenError):
        await check_permissions(permissions=permissions, global_perms=DenyAll(), user=user, obj=project)


async def test_check_permission_enough_perms():
    # user is a pj-admin
    user = await f.create_user()
    project = await f.create_project(created_by=user)
    true_permission = IsProjectAdmin()

    # user IsProjectAdmin (true) | globalPerm(AllowAny) (true)
    assert await check_permissions(permissions=true_permission, enough_perms=AllowAny(), user=user, obj=project) is None
    # user IsProjectAdmin (true) | globalPerm(AllowAny) (false)
    assert await check_permissions(permissions=true_permission, enough_perms=DenyAll(), user=user, obj=project) is None


#############################################
# PermissionOperators (Not/Or/And)
#############################################
async def test_check_permission_operators():
    # user is a pj-admin
    user = await f.create_user()
    project = await f.create_project(created_by=user)

    permission_true_and = And(IsProjectAdmin(), HasPerm("view_story"))
    permission_false_and = And(IsProjectAdmin(), HasPerm("view_story"), IsSuperUser())
    permission_true_all_or = Or(IsProjectAdmin(), HasPerm("view_story"))
    permission_true_some_or = Or(IsProjectAdmin(), HasPerm("view_story"), IsSuperUser())
    permission_false_or = Or(IsSuperUser(), DenyAll())
    permission_true_not = Not(DenyAll())
    permission_false_not = Not(AllowAny())
    permission_true_all_together = Not(And(permission_true_all_or, permission_false_and))
    permission_false_all_together = Not(Or(permission_true_all_or, permission_false_and))

    # user IsProjectAdmin (true) & HasPerm("view_story") (true)
    assert await check_permissions(permissions=permission_true_and, user=user, obj=project) is None
    # user IsProjectAdmin (true) & HasPerm("view_story") (true) & IsSuperUser() (false)
    with pytest.raises(ex.ForbiddenError):
        await check_permissions(permissions=permission_false_and, user=user, obj=project)
    # user IsProjectAdmin (true) | HasPerm("view_story") (true)
    assert await check_permissions(permissions=permission_true_all_or, user=user, obj=project) is None
    # user IsProjectAdmin (true) | HasPerm("view_story") (true) | IsSuperUser() (false)
    assert await check_permissions(permissions=permission_true_some_or, user=user, obj=project) is None
    # user IsSuperUser (false) | DenyAll() (false)
    with pytest.raises(ex.ForbiddenError):
        await check_permissions(permissions=permission_false_or, user=user, obj=project)
    # Not(DenyAll()) Not(false)
    assert await check_permissions(permissions=permission_true_not, user=user, obj=project) is None
    # Not(AllowAny()) Not(true)
    with pytest.raises(ex.ForbiddenError):
        await check_permissions(permissions=permission_false_not, user=user, obj=project)
    # Not(permission_true_all_or (true) & permission_false_and (false))
    assert await check_permissions(permissions=permission_true_all_together, user=user, obj=project) is None
    # Not(permission_true_all_or (true) | permission_false_and (false))
    with pytest.raises(ex.ForbiddenError):
        await check_permissions(permissions=permission_false_all_together, user=user, obj=project)
