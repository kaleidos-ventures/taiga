# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from fastapi import APIRouter
from taiga.auth.routing import AuthAPIRouter
from taiga.exceptions.api.errors import ERROR_401

tags_metadata = []


# /auth
auth = AuthAPIRouter(prefix="/auth", tags=["auth"])
unauth = APIRouter(prefix="/auth", tags=["auth"], responses=ERROR_401)
tags_metadata.append(
    {
        "name": "auth",
        "description": "Enpoints for API authentication.",
    }
)

# /users
users = AuthAPIRouter(prefix="/users", tags=["users"])
unauth_users = APIRouter(prefix="/users", tags=["users"])
tags_metadata.append(
    {
        "name": "users",
        "description": "Endpoint for users resources.",
    }
)

# /projects
projects = AuthAPIRouter(prefix="/projects", tags=["projects"])
unauth_projects = APIRouter(prefix="/projects", tags=["projects"])
tags_metadata.append(
    {
        "name": "projects",
        "description": "Endpoint for projects resources.",
    }
)

# /workspaces
workspaces = AuthAPIRouter(prefix="/workspaces", tags=["workspaces"])
tags_metadata.append(
    {
        "name": "workspaces",
        "description": "Endpoint for workspaces resources.",
    }
)

# /my
my = AuthAPIRouter(prefix="/my", tags=["my"])
tags_metadata.append({"name": "my", "description": "Endpoints for logged-in user's resources."})


# /system
system = APIRouter(prefix="/system", tags=["system"])
tags_metadata.append(
    {
        "name": "system",
        "description": "Endpoint for system settings and other resources.",
    }
)
