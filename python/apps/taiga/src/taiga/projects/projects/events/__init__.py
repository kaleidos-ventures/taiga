# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL


from taiga.events import events_manager
from taiga.projects.projects.events.content import DeleteProjectContent
from taiga.projects.projects.models import Project
from taiga.users.models import AnyUser, User
from taiga.workspaces.workspaces.models import Workspace

PROJECT_PERMISSIONS_UPDATE = "projects.permissions.update"
PROJECT_DELETE = "projects.delete"


async def emit_event_when_project_permissions_are_updated(project: Project) -> None:
    """
    This event is emitted whenever there's a change in the project's direct permissions (public / workspace permissions)
    :param project: The project affected by the permission change
    """
    await events_manager.publish_on_project_channel(project=project, type=PROJECT_PERMISSIONS_UPDATE)


async def emit_event_when_project_is_deleted(
    workspace: Workspace,
    project: Project,
    deleted_by: AnyUser,
    guests: list[User],
) -> None:
    # for ws-members, both in the home page and in the ws-detail
    await events_manager.publish_on_workspace_channel(
        workspace=workspace,
        type=PROJECT_DELETE,
        content=DeleteProjectContent(
            id=project.id, name=project.name, deleted_by=deleted_by, workspace_id=workspace.id
        ),
    )

    # for anyuser in the project detail
    await events_manager.publish_on_project_channel(
        project=project,
        type=PROJECT_DELETE,
        content=DeleteProjectContent(
            id=project.id, name=project.name, deleted_by=deleted_by, workspace_id=workspace.id
        ),
    )

    # for ws-guests (pj-members or pj-invitees) in the home page,
    # this is the only way we can notify the change
    for guest in guests:
        await events_manager.publish_on_user_channel(
            user=guest,
            type=PROJECT_DELETE,
            content=DeleteProjectContent(
                id=project.id, name=project.name, deleted_by=deleted_by, workspace_id=workspace.id
            ),
        )
