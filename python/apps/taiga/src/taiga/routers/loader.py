# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from fastapi import FastAPI

# these import are needed to load the api
# before adding the routes to Fastapi
from taiga.auth import api as auth_api  # noqa
from taiga.integrations.github.auth import api as github_auth_api  # noqa
from taiga.integrations.gitlab.auth import api as gitlab_auth_api  # noqa
from taiga.integrations.google.auth import api as google_auth_api  # noqa
from taiga.projects.invitations import api as projects_invitations_api  # noqa
from taiga.projects.memberships import api as projects_memberships_api  # noqa
from taiga.projects.projects import api as projects_api  # noqa
from taiga.projects.roles import api as projects_roles_api  # noqa
from taiga.routers import routes
from taiga.routers.routes import tags_metadata
from taiga.stories.assignments import api as stories_assignments_api  # noqa
from taiga.stories.stories import api as stories_api  # noqa
from taiga.system import api as system_api  # noqa
from taiga.users import api as users_api  # noqa
from taiga.workflows import api as workflows_api  # noqa
from taiga.workspaces.invitations import api as workspaces_invitations_api  # noqa
from taiga.workspaces.memberships import api as workspaces_memberships_api  # noqa
from taiga.workspaces.workspaces import api as workspaces_api  # noqa


def load_routes(api: FastAPI) -> None:
    api.openapi_tags = tags_metadata

    api.include_router(routes.unauth)
    api.include_router(routes.auth)
    api.include_router(routes.users)
    api.include_router(routes.unauth_users)
    api.include_router(routes.workspaces)
    api.include_router(routes.workspaces_invitations)
    api.include_router(routes.workspaces_memberships)
    api.include_router(routes.projects)
    api.include_router(routes.unauth_projects)
    api.include_router(routes.my)
    api.include_router(routes.system)
