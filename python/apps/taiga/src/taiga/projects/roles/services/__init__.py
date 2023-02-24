# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from uuid import UUID

from taiga.permissions import services as permissions_services
from taiga.projects.projects.models import Project
from taiga.projects.roles import events as pj_roles_events
from taiga.projects.roles import repositories as pj_roles_repositories
from taiga.projects.roles.models import ProjectRole
from taiga.projects.roles.services import exceptions as ex
from taiga.stories.assignments import repositories as story_assignments_repositories

##########################################################
# list project roles
##########################################################


async def list_project_roles(project: Project) -> list[ProjectRole]:
    return await pj_roles_repositories.list_project_roles(filters={"project_id": project.id})


async def list_project_roles_as_dict(project: Project) -> dict[str, ProjectRole]:
    """
    This method forms a custom dictionary with the roles matching a project
    :param project: The project to get their roles from
    :return: Dictionary whose key is the role slug and value the Role object
    """

    return {r.slug: r for r in await pj_roles_repositories.list_project_roles(filters={"project_id": project.id})}


##########################################################
# get project role
##########################################################


async def get_project_role(project_id: UUID, slug: str) -> ProjectRole | None:
    return await pj_roles_repositories.get_project_role(filters={"project_id": project_id, "slug": slug})


##########################################################
# update project role permissions
##########################################################


async def update_project_role_permissions(role: ProjectRole, permissions: list[str]) -> ProjectRole:
    if role.is_admin:
        raise ex.NonEditableRoleError("Cannot edit permissions in an admin role")

    # Check if new permissions have view_story
    view_story_is_deleted = False
    if role.permissions:
        view_story_is_deleted = await permissions_services.is_view_story_permission_deleted(
            old_permissions=role.permissions, new_permissions=permissions
        )

    project_role_permissions = await pj_roles_repositories.update_project_role_permissions(
        role=role,
        values={"permissions": permissions},
    )

    await pj_roles_events.emit_event_when_project_role_permissions_are_updated(role=role)

    # Unassign stories for user if the new permissions don't have view_story
    if view_story_is_deleted:
        await story_assignments_repositories.delete_stories_assignments(filters={"role_id": role.id})

    return project_role_permissions
