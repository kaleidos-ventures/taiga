# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from fastapi import FastAPI

# these import are needed to load the api
# before adding the routes to Fastapi
from taiga.auth import api as auth_api  # noqa
from taiga.projects import api as projects_api  # noqa
from taiga.roles import api as roles_api  # noqa
from taiga.routers import routes
from taiga.routers.routes import tags_metadata
from taiga.users import api as users_api  # noqa
from taiga.workspaces import api as workspaces_api  # noqa


def load_routes(api: FastAPI) -> None:
    api.openapi_tags = tags_metadata

    api.include_router(routes.unauth)
    api.include_router(routes.auth)
    api.include_router(routes.users)
    api.include_router(routes.unauth_users)
    api.include_router(routes.projects)
    api.include_router(routes.workspaces)
    api.include_router(routes.workspaces_projects)
    api.include_router(routes.my)
