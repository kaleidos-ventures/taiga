# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Any

from taiga.base.api.permissions import PermissionComponent
from taiga.permissions import services as permissions_services
from taiga.users.models import User


class AllowAny(PermissionComponent):
    async def is_authorized(self, user: User, obj: Any = None) -> bool:
        return True


class DenyAll(PermissionComponent):
    async def is_authorized(self, user: User, obj: Any = None) -> bool:
        return False


class IsAuthenticated(PermissionComponent):
    async def is_authorized(self, user: User, obj: Any = None) -> bool:
        return user and user.is_authenticated


class IsSuperUser(PermissionComponent):
    async def is_authorized(self, user: User, obj: Any = None) -> bool:
        return user and user.is_authenticated and user.is_superuser


class HasPerm(PermissionComponent):
    def __init__(self, perm: str, *components: "PermissionComponent") -> None:
        self.object_perm = perm
        super().__init__(*components)

    async def is_authorized(self, user: User, obj: Any = None) -> bool:
        return await permissions_services.user_has_perm(user=user, perm=self.object_perm, obj=obj)


class CanViewProject(PermissionComponent):
    async def is_authorized(self, user: User, obj: Any = None) -> bool:
        return await permissions_services.user_can_view_project(user=user, project=obj)


class IsProjectAdmin(PermissionComponent):
    async def is_authorized(self, user: User, obj: Any = None) -> bool:
        return await permissions_services.is_project_admin(user=user, obj=obj)


class IsWorkspaceAdmin(PermissionComponent):
    async def is_authorized(self, user: User, obj: Any = None) -> bool:
        return await permissions_services.is_workspace_admin(user, obj)


class IsObjectOwner(PermissionComponent):
    async def is_authorized(self, user: User, obj: Any = None) -> bool:
        if not obj or obj.owner is None:
            return False

        return obj.owner == user
