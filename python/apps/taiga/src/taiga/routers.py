# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from fastapi import APIRouter
from taiga.api import auth as auth_api
from taiga.api import projects as projects_api
from taiga.api import users as users_api
from taiga.api import workspaces as workspaces_api

router = APIRouter()
router.include_router(auth_api.router)
router.include_router(projects_api.router)
router.include_router(users_api.router)
router.include_router(workspaces_api.router)

tags_metadata = [
    auth_api.metadata,
    projects_api.metadata,
    users_api.metadata,
    workspaces_api.metadata,
]
