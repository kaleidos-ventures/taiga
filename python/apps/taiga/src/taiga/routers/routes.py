# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from fastapi import APIRouter
from taiga.auth.routing import AuthAPIRouter
from taiga.exceptions.api.errors import ERROR_401

tags_metadata = []


# /auth
auth = AuthAPIRouter(tags=["auth"])
unauth = APIRouter(tags=["auth"], responses=ERROR_401)
tags_metadata.append(
    {
        "name": "auth",
        "description": "Enpoints for API authentication.",
    }
)

# /users
users = AuthAPIRouter(tags=["users"])
unauth_users = APIRouter(tags=["users"])
tags_metadata.append(
    {
        "name": "users",
        "description": "Endpoint for users resources.",
    }
)

# /workspaces
workspaces = AuthAPIRouter(tags=["workspaces"])
tags_metadata.append(
    {
        "name": "workspaces",
        "description": "Endpoint for workspaces resources.",
    }
)

# /workspaces/{id}/invitations
workspaces_invitations = AuthAPIRouter(tags=["workspaces invitations"])
# /workspaces/invitations/{token}
unauth_workspaces_invitations = APIRouter(tags=["workspaces invitations"])
tags_metadata.append(
    {
        "name": "workspaces invitations",
        "description": "Endpoints for workspaces invitations resources.",
    }
)

# /workspaces/{id}/memberships
workspaces_memberships = AuthAPIRouter(tags=["workspaces memberships"])
tags_metadata.append(
    {
        "name": "workspaces memberships",
        "description": "Endpoint for workspaces memberships resources.",
    }
)

# /projects
projects = AuthAPIRouter(tags=["projects"])
tags_metadata.append(
    {
        "name": "projects",
        "description": "Endpoint for projects resources.",
    }
)

# /projects/{id}/invitations
projects_invitations = AuthAPIRouter(tags=["projects invitations"])
# /projects/invitations/{token}
unauth_projects_invitations = APIRouter(tags=["projects invitations"])
tags_metadata.append(
    {
        "name": "projects invitations",
        "description": "Endpoint for projects invitations resources.",
    }
)


# /projects/{id}/memberships
projects_memberships = AuthAPIRouter(tags=["projects memberships"])
tags_metadata.append(
    {
        "name": "projects memberships",
        "description": "Endpoint for projects memberships resources.",
    }
)

# /projects/{id}/workflows
workflows = AuthAPIRouter(tags=["workflows and workflow statuses"])
tags_metadata.append(
    {
        "name": "workflows and workflow statuses",
        "description": "Endpoint for workflows and workflow statuses resources.",
    }
)

# /projects/{id}/stories
# /projects/{id}/workflows/{slug}/stories
stories = AuthAPIRouter(tags=["stories and assignments"])
tags_metadata.append(
    {
        "name": "stories and assignments",
        "description": "Endpoint for stories resources.",
    }
)


# /projects/{id}/stories/{ref}/attachments
story_attachments = AuthAPIRouter(tags=["story attachments"])
unauth_story_attachments = APIRouter(tags=["story attachments"])
tags_metadata.append(
    {
        "name": "story attachments",
        "description": "Endpoint for story attachments.",
    }
)

# /projects/{id}/stories/{ref}/comments
story_comments = AuthAPIRouter(tags=["story comments"])
tags_metadata.append(
    {
        "name": "story comments",
        "description": "Endpoint for story comments.",
    }
)


# /system
system = APIRouter(tags=["system"])
tags_metadata.append(
    {
        "name": "system",
        "description": "Endpoint for system settings and other resources.",
    }
)
