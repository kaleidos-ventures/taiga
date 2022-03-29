# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from fastapi import APIRouter
from taiga.auth import api as auth_api
from taiga.invitations import api as invitations_api
from taiga.projects import api as projects_api
from taiga.roles import api as roles_api
from taiga.users import api as users_api
from taiga.workspaces import api as workspaces_api

router = APIRouter()

router.include_router(auth_api.unauthorized_router)
router.include_router(auth_api.router)
router.include_router(projects_api.router)
router.include_router(users_api.router)
router.include_router(users_api.router_my)
router.include_router(users_api.unauthorized_router)
router.include_router(workspaces_api.router)
router.include_router(workspaces_api.router_my)
router.include_router(projects_api.router_workspaces)
router.include_router(roles_api.router)
router.include_router(invitations_api.router)

tags_metadata = [
    auth_api.metadata,
    projects_api.metadata,
    users_api.metadata,
    workspaces_api.metadata,
    workspaces_api.my_metadata,
]
