# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import abc
from typing import Any

from taiga.exceptions import api as ex
from taiga.users.models import User

######################################################################
# Permission components - basic class
######################################################################


class PermissionComponent(metaclass=abc.ABCMeta):
    @abc.abstractmethod
    async def is_authorized(self, user: User, obj: Any = None) -> bool:
        pass

    def __invert__(self) -> "Not":
        return Not(self)

    def __and__(self, component: "PermissionComponent") -> "And":
        return And(self, component)

    def __or__(self, component: "PermissionComponent") -> "Or":
        return Or(self, component)


######################################################################
# check_permissions - main function
######################################################################


async def check_permissions(
    permissions: PermissionComponent,
    user: User,
    obj: object = None,
    global_perms: PermissionComponent | None = None,
    enough_perms: PermissionComponent | None = None,
) -> None:
    if user.is_superuser:
        return

    _required_permissions = permissions

    if global_perms:
        _required_permissions = global_perms & _required_permissions

    if enough_perms:
        _required_permissions = enough_perms | _required_permissions

    if not await _required_permissions.is_authorized(user=user, obj=obj):
        raise ex.ForbiddenError("User doesn't have permissions to perform this action")


######################################################################
# Permission components - operators
######################################################################


class PermissionOperator(PermissionComponent):
    """
    Base class for all logical operators for compose components.
    """

    def __init__(self, *components: "PermissionComponent") -> None:
        self.components = tuple(components)


class Not(PermissionOperator):
    """
    Negation operator as permission component.
    """

    # Overwrites the default constructor for fix
    # to one parameter instead of variable list of them.
    def __init__(self, component: "PermissionComponent") -> None:
        super().__init__(component)

    async def is_authorized(self, user: User, obj: Any = None) -> bool:
        component = self.components[0]
        return not await component.is_authorized(user, obj)


class Or(PermissionOperator):
    """
    Or logical operator as permission component.
    """

    async def is_authorized(self, user: User, obj: Any = None) -> bool:
        valid = False

        for component in self.components:
            if await component.is_authorized(user, obj):
                valid = True
                break

        return valid


class And(PermissionOperator):
    """
    And logical operator as permission component.
    """

    async def is_authorized(self, user: User, obj: Any = None) -> bool:
        valid = True

        for component in self.components:
            if not await component.is_authorized(user, obj):
                valid = False
                break

        return valid
