# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import TYPE_CHECKING, Any

from taiga.base.api.permissions import PermissionComponent

if TYPE_CHECKING:
    from taiga.users.models import AnyUser


############################################################
# Generic permissions
############################################################


class AllowAny(PermissionComponent):
    async def is_authorized(self, user: "AnyUser", obj: Any = None) -> bool:
        return True


class DenyAll(PermissionComponent):
    async def is_authorized(self, user: "AnyUser", obj: Any = None) -> bool:
        return False


class IsSuperUser(PermissionComponent):
    async def is_authorized(self, user: "AnyUser", obj: Any = None) -> bool:
        return bool(user and user.is_authenticated and user.is_superuser)


class IsAuthenticated(PermissionComponent):
    async def is_authorized(self, user: "AnyUser", obj: Any = None) -> bool:
        return bool(user and user.is_authenticated)


class HasPerm(PermissionComponent):
    def __init__(self, perm: str, *components: "PermissionComponent") -> None:
        self.object_perm = perm
        super().__init__(*components)

    async def is_authorized(self, user: "AnyUser", obj: Any = None) -> bool:
        from taiga.permissions import services as permissions_services

        return await permissions_services.user_has_perm(user=user, perm=self.object_perm, obj=obj)


class IsRelatedToTheUser(PermissionComponent):
    def __init__(self, field: str, *components: "PermissionComponent") -> None:
        self.related_field = field
        super().__init__(*components)

    async def is_authorized(self, user: "AnyUser", obj: Any = None) -> bool:
        from taiga.permissions import services as permissions_services

        return await permissions_services.is_an_object_related_to_the_user(user=user, obj=obj, field=self.related_field)


############################################################
# Project permissions
############################################################


class CanViewProject(PermissionComponent):
    async def is_authorized(self, user: "AnyUser", obj: Any = None) -> bool:
        from taiga.permissions import services as permissions_services

        return await permissions_services.user_can_view_project(user=user, obj=obj)


class IsProjectAdmin(PermissionComponent):
    async def is_authorized(self, user: "AnyUser", obj: Any = None) -> bool:
        from taiga.permissions import services as permissions_services

        return await permissions_services.is_project_admin(user=user, obj=obj)


############################################################
# Workspace permissions
############################################################


class IsWorkspaceMember(PermissionComponent):
    async def is_authorized(self, user: "AnyUser", obj: Any = None) -> bool:
        from taiga.permissions import services as permissions_services

        return await permissions_services.is_workspace_member(user=user, obj=obj)
