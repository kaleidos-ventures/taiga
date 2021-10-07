# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from fastapi import APIRouter, Security
from taiga.api import auth as auth_api
from taiga.api import projects as projects_api
from taiga.api import users as users_api
from taiga.api import workspaces as workspaces_api
from taiga.auth.security import HTTPBearer

router = APIRouter(dependencies=[Security(HTTPBearer())])  # This is just to get auth running in OpenAPI documentation

router.include_router(auth_api.router)
router.include_router(projects_api.router)
router.include_router(users_api.router)
router.include_router(workspaces_api.router)
router.include_router(projects_api.router2)

tags_metadata = [
    auth_api.metadata,
    projects_api.metadata,
    users_api.metadata,
    workspaces_api.metadata,
]
