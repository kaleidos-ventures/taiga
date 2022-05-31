# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import random

from asgiref.sync import sync_to_async
from django.db import transaction
from faker import Faker
from fastapi import UploadFile
from taiga.invitations import repositories as invitations_repositories
from taiga.invitations.choices import InvitationStatus
from taiga.invitations.models import Invitation
from taiga.permissions import choices
from taiga.projects import services as projects_services
from taiga.projects.models import Project
from taiga.roles import repositories as roles_repositories
from taiga.roles.models import Membership, Role, WorkspaceRole
from taiga.users.models import User
from taiga.workspaces import services as workspaces_services
from taiga.workspaces.models import Workspace

fake: Faker = Faker()
Faker.seed(0)
random.seed(0)

################################
# CONFIGURATION
################################
NUM_USERS = 10
NUM_PROJECT_COLORS = 8
NUM_WORKSPACE_COLORS = 8
################################


@transaction.atomic
async def load_sample_data() -> None:
    print("Loading sample data.")

    # USERS. Create users
    users = await _create_users()

    # WORKSPACES
    # create one basic workspace and one premium workspace per user
    # admin role is created by deault
    # create members roles for premium workspaces
    workspaces = []
    for user in users:
        workspace = await _create_workspace(owner=user, is_premium=False)
        workspace_p = await _create_workspace(owner=user, is_premium=True)
        workspaces.extend([workspace, workspace_p])

    # create memberships for workspaces
    for workspace in workspaces:
        await _create_workspace_memberships(workspace=workspace, users=users, except_for=workspace.owner)

    # PROJECTS
    projects = []
    for workspace in workspaces:
        # create one project (kanban) in each workspace with the same owner
        # it applies a template and creates also admin and general roles
        project = await _create_project(workspace=workspace, owner=workspace.owner)

        # add other users to different roles (admin and general)
        await _create_project_memberships(project=project, users=users, except_for=workspace.owner)

        projects.append(project)

    # CUSTOM PROJECTS
    custom_owner = users[0]
    workspace = await _create_workspace(owner=custom_owner, name="Custom workspace")
    await _create_empty_project(owner=custom_owner, workspace=workspace)
    await _create_long_texts_project(owner=custom_owner, workspace=workspace)
    await _create_inconsistent_permissions_project(owner=custom_owner, workspace=workspace)
    await _create_project_with_several_roles(owner=custom_owner, workspace=workspace, users=users)
    await _create_membership_scenario()

    # PROJECT INVITATIONS
    for project in projects:
        await _create_project_invitations(project=project, users=users)

    # CUSTOM SCENARIOS
    await _create_scenario_with_invitations()
    await _create_scenario_for_searches()

    print("Sample data loaded.")


################################
# USERS
################################


async def _create_users() -> list[User]:
    users = []
    for i in range(NUM_USERS):
        user = await _create_user(index=i + 1)
        users.append(user)
    return users


@sync_to_async
def _create_user(index: int) -> User:
    username = f"user{index}"
    email = f"{username}@taiga.demo"
    full_name = fake.name()
    user = User.objects.create(username=username, email=email, full_name=full_name, is_active=True)
    user.set_password("123123")
    user.save()
    return user


@sync_to_async
def _create_user_with_kwargs(username: str, full_name: str) -> User:
    email = f"{username}@taiga.demo"
    user = User.objects.create(username=username, email=email, full_name=full_name, is_active=True)
    user.set_password("123123")
    user.save()
    return user


################################
# ROLES
################################
# admin and general roles are automatically created with `_create_project`


@sync_to_async
def _create_project_role(project: Project, name: str | None = None) -> Role:
    name = name or fake.word()
    return Role.objects.create(project=project, name=name, is_admin=False, permissions=choices.PROJECT_PERMISSIONS)


@sync_to_async
def _get_project_roles(project: Project) -> list[Role]:
    return list(project.roles.all())


@sync_to_async
def _get_project_admin_role(project: Project) -> Role:
    return project.roles.get(slug="admin")


@sync_to_async
def _get_project_other_roles(project: Project) -> list[Role]:
    return list(project.roles.exclude(slug="admin"))


@sync_to_async
def _get_project_memberships(project: Project) -> list[Membership]:
    return list(project.memberships.all())


@sync_to_async
def _get_project_memberships_without_owner(project: Project) -> list[Membership]:
    return list(project.memberships.exclude(user=project.owner))


@sync_to_async
def _get_project_members(project: Project) -> list[User]:
    return list(project.members.all())


@sync_to_async
def _get_project_owner(project: Project) -> User:
    return project.owner


@sync_to_async
def _get_membership_user(membership: Membership) -> User:
    return membership.user


@sync_to_async
def _get_membership_role(membership: Membership) -> Role:
    return membership.role


async def _create_project_memberships(project: Project, users: list[User], except_for: User) -> None:
    # get admin and other roles
    admin_role = await _get_project_admin_role(project=project)
    other_roles = await _get_project_other_roles(project=project)

    # get users except the owner of the project
    other_users = [user for user in users if user.id != except_for.id]
    random.shuffle(other_users)

    # add 0, 1 or 2 other admins
    num_admins = random.randint(0, 2)
    for _ in range(num_admins):
        user = other_users.pop(0)
        await roles_repositories.create_membership(user=user, project=project, role=admin_role)

    # add other members in the different roles
    num_members = random.randint(0, len(other_users))
    for _ in range(num_members):
        user = other_users.pop(0)
        role = random.choice(other_roles)
        await roles_repositories.create_membership(user=user, project=project, role=role)


@sync_to_async
def _create_workspace_role(workspace: Workspace) -> WorkspaceRole:
    return WorkspaceRole.objects.create(
        workspace=workspace, name="Members", is_admin=False, permissions=choices.WORKSPACE_PERMISSIONS
    )


@sync_to_async
def _get_workspace_admin_role(workspace: Workspace) -> WorkspaceRole:
    return workspace.workspace_roles.get(slug="admin")


@sync_to_async
def _get_workspace_other_roles(workspace: Workspace) -> list[WorkspaceRole]:
    return list(workspace.workspace_roles.exclude(slug="admin"))


async def _create_workspace_memberships(workspace: Workspace, users: list[User], except_for: User) -> None:
    # get admin and other roles
    admin_role = await _get_workspace_admin_role(workspace)
    other_roles = await _get_workspace_other_roles(workspace)

    # get users except the owner of the project
    other_users = [user for user in users if user.id != except_for.id]
    random.shuffle(other_users)

    # add 0, 1 or 2 other admins
    num_admins = random.randint(0, 2)
    for _ in range(num_admins):
        user = other_users.pop(0)
        await roles_repositories.create_workspace_membership(user=user, workspace=workspace, workspace_role=admin_role)

    # add other members in the different roles if any
    if other_roles:
        num_members = random.randint(0, len(other_users))
        for _ in range(num_members):
            user = other_users.pop(0)
            role = random.choice(other_roles)
            await roles_repositories.create_workspace_membership(user=user, workspace=workspace, workspace_role=role)


################################
# WORKSPACES
################################


async def _create_workspace(
    owner: User, name: str | None = None, color: int | None = None, is_premium: bool = False
) -> Workspace:
    name = name or fake.bs()[:35]
    if is_premium:
        name = f"{name}(P)"
    color = color or fake.random_int(min=1, max=NUM_WORKSPACE_COLORS)
    workspace = await workspaces_services.create_workspace(name=name, owner=owner, color=color)
    if is_premium:
        workspace.is_premium = True
        # create non-admin role
        await _create_workspace_role(workspace=workspace)
        await sync_to_async(workspace.save)()
    return workspace


################################
# PROJECTS
################################


async def _create_project(
    workspace: Workspace, owner: User, name: str | None = None, description: str | None = None
) -> Project:
    name = name or fake.catch_phrase()
    description = description or fake.paragraph(nb_sentences=2)
    with open("src/taiga/base/utils/sample_data/logo.png", "rb") as png_image_file:
        logo_file = UploadFile(file=png_image_file, filename="Logo")

        project = await projects_services.create_project(
            name=name,
            description=description,
            color=fake.random_int(min=1, max=NUM_PROJECT_COLORS),
            owner=owner,
            workspace=workspace,
            logo=logo_file,
        )

    return project


################################
# CUSTOM PROJECTS
################################


async def _create_empty_project(owner: User, workspace: Workspace) -> None:
    await projects_services.create_project(
        name="Empty project",
        description=fake.paragraph(nb_sentences=2),
        color=fake.random_int(min=1, max=NUM_PROJECT_COLORS),
        owner=owner,
        workspace=workspace,
    )


async def _create_long_texts_project(owner: User, workspace: Workspace) -> None:
    await _create_project(
        owner=owner,
        workspace=workspace,
        name=f"Long texts project: { fake.sentence(nb_words=10) } ",
        description=fake.paragraph(nb_sentences=8),
    )


async def _create_inconsistent_permissions_project(owner: User, workspace: Workspace) -> None:
    # give general role less permissions than public-permissions
    project = await _create_project(
        name="Inconsistent Permissions",
        owner=owner,
        workspace=workspace,
    )
    general_members_role = await sync_to_async(project.roles.get)(slug="general")
    general_members_role.permissions = ["view_us", "view_tasks"]
    await sync_to_async(general_members_role.save)()
    project.public_permissions = choices.PROJECT_PERMISSIONS
    await sync_to_async(project.save)()


async def _create_project_with_several_roles(owner: User, workspace: Workspace, users: list[User]) -> None:
    project = await _create_project(name="Several Roles", owner=owner, workspace=workspace)
    await _create_project_role(project=project, name="UX/UI")
    await _create_project_role(project=project, name="Developer")
    await _create_project_role(project=project, name="Stakeholder")
    await _create_project_memberships(project=project, users=users, except_for=project.owner)


async def _create_membership_scenario() -> None:
    user1000 = await _create_user(1000)
    user1001 = await _create_user(1001)
    user1002 = await _create_user(1002)
    user1003 = await _create_user(1003)  # noqa: F841

    # workspace premium: user1000 ws-admin, user1001 ws-member
    workspace = await _create_workspace(owner=user1000, is_premium=True, name="u1001 is ws member")
    members_role = await sync_to_async(workspace.workspace_roles.exclude(is_admin=True).first)()
    await roles_repositories.create_workspace_membership(
        user=user1001, workspace=workspace, workspace_role=members_role
    )
    # project: user1000 pj-admin, user1001 pj-member
    project = await _create_project(
        workspace=workspace,
        owner=user1000,
        name="pj 11",
        description="user1000 pj-admin, user1001 pj-member",
    )
    members_role = await sync_to_async(project.roles.get)(slug="general")
    await roles_repositories.create_membership(user=user1001, project=project, role=members_role)
    # project: user1000 pj-admin, user1001 pj-member without permissions
    project = await _create_project(
        workspace=workspace,
        owner=user1000,
        name="pj 12",
        description="user1000 pj-admin, user1001 pj-member without permissions",
    )
    members_role = await sync_to_async(project.roles.get)(slug="general")
    await roles_repositories.create_membership(user=user1001, project=project, role=members_role)
    members_role.permissions = []
    await sync_to_async(members_role.save)()
    # project: user1000 pj-admin, user1001 not pj-member, ws-members not allowed
    await _create_project(
        workspace=workspace,
        owner=user1000,
        name="pj 13",
        description="user1000 pj-admin, user1001 not pj-member, ws-members not allowed",
    )
    # project: user1000 pj-admin, user1001 not pj-member, ws-members allowed
    project = await _create_project(
        workspace=workspace,
        owner=user1000,
        name="pj 14",
        description="user1000 pj-admin, user1001 not pj-member, ws-members allowed",
    )
    project.workspace_member_permissions = ["view_us"]
    await sync_to_async(project.save)()
    # project: user1000 no pj-member, user1001 pj-admin, ws-members not allowed
    await _create_project(
        workspace=workspace,
        owner=user1001,
        name="pj 15",
        description="user1000 no pj-member, user1001 pj-admin, ws-members not allowed",
    )
    # more projects
    # project: user1000 pj-admin, user1001 pj-member
    project = await _create_project(
        workspace=workspace,
        owner=user1000,
        name="more - pj 16",
        description="user1000 pj-admin, user1001 pj-member",
    )
    members_role = await sync_to_async(project.roles.get)(slug="general")
    await roles_repositories.create_membership(user=user1001, project=project, role=members_role)
    # project: user1000 pj-admin, user1001 pj-member
    project = await _create_project(
        workspace=workspace,
        owner=user1000,
        name="more - pj 17",
        description="user1000 pj-admin, user1001 pj-member",
    )
    members_role = await sync_to_async(project.roles.get)(slug="general")
    await roles_repositories.create_membership(user=user1001, project=project, role=members_role)
    # project: user1000 pj-admin, user1001 pj-member
    project = await _create_project(
        workspace=workspace,
        owner=user1000,
        name="more - pj 18",
        description="user1000 pj-admin, user1001 pj-member",
    )
    members_role = await sync_to_async(project.roles.get)(slug="general")
    await roles_repositories.create_membership(user=user1001, project=project, role=members_role)
    # project: user1000 pj-admin, user1001 pj-member
    project = await _create_project(
        workspace=workspace,
        owner=user1000,
        name="more - pj 19",
        description="user1000 pj-admin, user1001 pj-member",
    )
    members_role = await sync_to_async(project.roles.get)(slug="general")
    await roles_repositories.create_membership(user=user1001, project=project, role=members_role)
    # project: user1000 pj-admin, user1001 pj-member
    project = await _create_project(
        workspace=workspace,
        owner=user1000,
        name="more - pj 20",
        description="user1000 pj-admin, user1001 pj-member",
    )
    members_role = await sync_to_async(project.roles.get)(slug="general")
    await roles_repositories.create_membership(user=user1001, project=project, role=members_role)

    # workspace premium: user1000 ws-admin, user1001 ws-member, has_projects=true
    workspace = await _create_workspace(owner=user1000, is_premium=True, name="u1001 is ws member, hasProjects:T")
    members_role = await sync_to_async(workspace.workspace_roles.exclude(is_admin=True).first)()
    await roles_repositories.create_workspace_membership(
        user=user1001, workspace=workspace, workspace_role=members_role
    )
    # project: user1000 pj-admin, user1001 not pj-member, ws-members not allowed
    await _create_project(
        workspace=workspace,
        owner=user1000,
        name="pj 21",
        description="user1000 pj-admin, user1001 not pj-member, ws-members not allowed",
    )
    # project: user1000 pj-admin, user1001 pj-member without permissions, ws-members allowed
    project = await _create_project(
        workspace=workspace,
        owner=user1000,
        name="pj 22",
        description="user1000 pj-admin, user1001 pj-member without permissions, ws-members allowed",
    )
    members_role = await sync_to_async(project.roles.get)(slug="general")
    await roles_repositories.create_membership(user=user1001, project=project, role=members_role)
    members_role.permissions = []
    await sync_to_async(members_role.save)()
    project.workspace_member_permissions = ["view_us"]
    await sync_to_async(project.save)()

    # workspace premium: user1000 ws-admin, user1001 ws-member, has_projects=false
    workspace = await _create_workspace(owner=user1000, is_premium=True, name="u1001 is ws member, hasProjects:F")
    members_role = await sync_to_async(workspace.workspace_roles.exclude(is_admin=True).first)()
    await roles_repositories.create_workspace_membership(
        user=user1001, workspace=workspace, workspace_role=members_role
    )

    # workspace premium: user1000 ws-admin, user1001 ws-guest
    workspace = await _create_workspace(owner=user1000, is_premium=True, name="u1001 ws guest")
    # project: user1000 pj-admin, user1001 pj-member
    project = await _create_project(
        workspace=workspace,
        owner=user1000,
        name="pj 41",
        description="user1000 pj-admin, user1001 pj-member",
    )
    members_role = await sync_to_async(project.roles.get)(slug="general")
    await roles_repositories.create_membership(user=user1001, project=project, role=members_role)
    # project: user1000 pj-member, user1001 pj-admin
    project = await _create_project(
        workspace=workspace,
        owner=user1001,
        name="pj 42",
        description="user1000 pj-member, user1001 pj-admin",
    )
    members_role = await sync_to_async(project.roles.get)(slug="general")
    await roles_repositories.create_membership(user=user1000, project=project, role=members_role)
    # project: user1000 pj-admin, user1001 not pj-member, ws-allowed
    project = await _create_project(
        workspace=workspace,
        owner=user1000,
        name="pj 43",
        description="user1000 pj-admin, user1001 not pj-member, ws-allowed",
    )
    project.workspace_member_permissions = ["view_us"]
    await sync_to_async(project.save)()
    # project: user1000 pj-admin, user1001 pj-member without permissions, ws-members allowed
    project = await _create_project(
        workspace=workspace,
        owner=user1000,
        name="pj 44",
        description="user1000 pj-admin, user1001 pj-member without permissions, ws-members allowed",
    )
    members_role = await sync_to_async(project.roles.get)(slug="general")
    await roles_repositories.create_membership(user=user1001, project=project, role=members_role)
    members_role.permissions = []
    project.workspace_member_permissions = ["view_us"]
    await sync_to_async(project.save)()

    # workspace basic: user1000 & user1001 (ws-admin), user1002/user1003 (ws-guest)
    workspace = await _create_workspace(owner=user1000, is_premium=False, name="uk/uk1 (ws-admin), uk2/uk3 (ws-guest)")
    admin_role = await _get_workspace_admin_role(workspace)
    await roles_repositories.create_workspace_membership(user=user1001, workspace=workspace, workspace_role=admin_role)
    # project: u1000 pj-admin, u1002 pj-member without permissions, u1001/u1003 no pj-member, ws-members/public
    # not-allowed
    project = await _create_project(
        workspace=workspace,
        owner=user1000,
        name="p45 pj-mb-NA ws-mb/public-NA",
        description="u1000 pj-admin, u1002 pj-member without permissions, u1001/u1003 no pj-member, ws-members/public "
        "not-allowed",
    )
    members_role = await sync_to_async(project.roles.get)(slug="general")
    members_role.permissions = []
    await sync_to_async(members_role.save)()
    await roles_repositories.create_membership(user=user1002, project=project, role=members_role)
    await sync_to_async(project.save)()
    # project: u1000 pj-admin, u1002 pj-member view_us, u1001/u1003 no pj-members ws-members/public not-allowed
    project = await _create_project(
        workspace=workspace,
        owner=user1000,
        name="p46 pj-mb-view_us ws-mb/public-NA",
        description="project: u1000 pj-admin, u1002 pj-member view_us, u1001/u1003 no pj-members "
        "ws-members/public not-allowed",
    )
    members_role = await sync_to_async(project.roles.get)(slug="general")
    members_role.permissions = ["view_us"]
    await sync_to_async(members_role.save)()
    await roles_repositories.create_membership(user=user1002, project=project, role=members_role)
    await sync_to_async(project.save)()
    # project: u1000 pj-admin, u1002 pj-member view_us, u1001/u1003 no pj-member, public view-us, ws-members not-allowed
    project = await _create_project(
        workspace=workspace,
        owner=user1000,
        name="p47 pj-mb-view_us ws-mb-NA public-viewUs",
        description="u1000 pj-admin, u1002 pj-member view_us, u1001/u1003 no pj-member, public view-us, ws-members "
        "not-allowed",
    )
    members_role = await sync_to_async(project.roles.get)(slug="general")
    members_role.permissions = ["view_us"]
    project.public_permissions = ["view_us"]
    await sync_to_async(members_role.save)()
    await roles_repositories.create_membership(user=user1002, project=project, role=members_role)
    await sync_to_async(project.save)()

    # workspace premium: user1000 (ws-admin), user1001 (ws-member), user1002 (ws-guest), user1003 (ws-guest)
    workspace = await _create_workspace(owner=user1000, is_premium=True, name="uk-ws-adm uk1-ws-mb uk2/uk3-ws-guest")
    members_role = await sync_to_async(workspace.workspace_roles.exclude(is_admin=True).first)()
    await roles_repositories.create_workspace_membership(
        user=user1001, workspace=workspace, workspace_role=members_role
    )
    # project: u1000 pj-admin, u1002 pj-member view_us, u1001/u1003 no pj-member, public view-us, ws-members not-allowed
    project = await _create_project(
        workspace=workspace,
        owner=user1000,
        name="p48 pj-mb-view_us public-viewUs ws-mb-NA",
        description="u1000 pj-admin, u1002 pj-member view_us, u1001/u1003 no pj-member, public view-us, ws-members "
        "not-allowed",
    )
    members_role = await sync_to_async(project.roles.get)(slug="general")
    members_role.permissions = ["view_us"]
    project.public_permissions = ["view_us"]
    await sync_to_async(members_role.save)()
    await roles_repositories.create_membership(user=user1002, project=project, role=members_role)
    await sync_to_async(project.save)()

    # workspace premium: user1000 (ws-admin), user1001/user1002 (ws-member), user1003 (ws-guest)
    workspace = await _create_workspace(owner=user1000, is_premium=True, name="uk-ws-admin uk1/k2-ws-mb uk3-ws-guest")
    members_role = await sync_to_async(workspace.workspace_roles.exclude(is_admin=True).first)()
    await roles_repositories.create_workspace_membership(
        user=user1001, workspace=workspace, workspace_role=members_role
    )
    await roles_repositories.create_workspace_membership(
        user=user1002, workspace=workspace, workspace_role=members_role
    )
    # project: u1000 pj-admin, u1002 pj-member view_us, u1001/u1003 no pj-member, public view-us, ws-members not-allowed
    project = await _create_project(
        workspace=workspace,
        owner=user1000,
        name="p49 pj-mb-view_us public-viewUs ws-mb-NA",
        description="u1000 pj-admin, u1002 pj-member view_us, u1001/u1003 no pj-member, public view-us, ws-members "
        "not-allowed",
    )
    members_role = await sync_to_async(project.roles.get)(slug="general")
    members_role.permissions = ["view_us"]
    project.public_permissions = ["view_us"]
    await sync_to_async(members_role.save)()
    await roles_repositories.create_membership(user=user1002, project=project, role=members_role)
    await sync_to_async(project.save)()


################################
# PROJECT INVITATIONS
################################


async def _create_project_invitations(project: Project, users: list[User]) -> None:
    # add accepted invitations for project memberships
    project_owner = await _get_project_owner(project=project)
    invitations = [
        Invitation(
            user=await _get_membership_user(membership=membership),
            project=project,
            role=await _get_membership_role(membership=membership),
            email=(await _get_membership_user(membership=membership)).email,
            status=InvitationStatus.ACCEPTED,
            invited_by=project_owner,
        )
        for membership in await _get_project_memberships_without_owner(project=project)
    ]

    # get users except the owner and the memberships of the project
    other_users = [user for user in users if user not in await _get_project_members(project=project)]
    random.shuffle(other_users)

    # add 0, 1 or 2 pending invitations for registered users
    num_users = random.randint(0, 2)
    for user in other_users[:num_users]:
        invitations.append(
            Invitation(
                user=user,
                project=project,
                role=random.choice(await _get_project_roles(project=project)),
                email=user.email,
                status=InvitationStatus.PENDING,
                invited_by=project_owner,
            )
        )

    # add 0, 1 or 2 pending invitations for unregistered users
    num_users = random.randint(0, 2)
    for i in range(num_users):
        invitations.append(
            Invitation(
                user=None,
                project=project,
                role=random.choice(await _get_project_roles(project=project)),
                email=f"email-{i}@email.com",
                status=InvitationStatus.PENDING,
                invited_by=project_owner,
            )
        )

    # create invitations in bulk
    await invitations_repositories.create_invitations(objs=invitations)


################################
# CUSTOM SCENARIOS
################################


async def _create_scenario_with_invitations() -> None:
    user900 = await _create_user(900)
    user901 = await _create_user(901)

    # user900 is admin of several workspaces
    ws1 = await workspaces_services.create_workspace(name="ws invitations for members(p)", owner=user900, color=2)
    ws1.is_premium = True
    await sync_to_async(ws1.save)()

    ws2 = await workspaces_services.create_workspace(name="ws invitations for guests(p)", owner=user900, color=2)
    ws2.is_premium = True
    await sync_to_async(ws2.save)()

    ws3 = await workspaces_services.create_workspace(name="ws invitations for invited(p)", owner=user900, color=2)
    ws3.is_premium = True
    await sync_to_async(ws3.save)()

    ws4 = await workspaces_services.create_workspace(name="ws for admins", owner=user900, color=2)
    ws4.is_premium = True
    await sync_to_async(ws4.save)()

    # user901 is member of ws1
    members_role = await _create_workspace_role(workspace=ws1)
    await roles_repositories.create_workspace_membership(user=user901, workspace=ws1, workspace_role=members_role)

    # user900 creates a project in ws1
    pj1 = await _create_project(workspace=ws1, owner=user900)
    # and invites user901 to the project
    invitation = Invitation(
        user=user901,
        project=pj1,
        role=random.choice(await _get_project_roles(project=pj1)),
        email=user901.email,
        status=InvitationStatus.PENDING,
        invited_by=user900,
    )
    await invitations_repositories.create_invitations(objs=[invitation])

    # user901 is guest of ws2
    pj2 = await _create_project(workspace=ws2, owner=user900)
    await roles_repositories.create_membership(
        user=user901, project=pj2, role=random.choice(await _get_project_roles(project=pj2))
    )
    # and has an invitation
    pj3 = await _create_project(workspace=ws2, owner=user900)
    invitation = Invitation(
        user=user901,
        project=pj3,
        role=random.choice(await _get_project_roles(project=pj3)),
        email=user901.email,
        status=InvitationStatus.PENDING,
        invited_by=user900,
    )
    await invitations_repositories.create_invitations(objs=[invitation])

    # user901 is invited of ws3 (not member)
    pj4 = await _create_project(workspace=ws3, owner=user900)
    invitation = Invitation(
        user=user901,
        project=pj4,
        role=random.choice(await _get_project_roles(project=pj4)),
        email=user901.email,
        status=InvitationStatus.PENDING,
        invited_by=user900,
    )
    await invitations_repositories.create_invitations(objs=[invitation])

    # user901 is admin of ws4
    ws_admin_role = await _get_workspace_admin_role(workspace=ws4)
    await roles_repositories.create_workspace_membership(user=user901, workspace=ws4, workspace_role=ws_admin_role)


async def _create_scenario_for_searches() -> None:
    # some users
    user800 = await _create_user(800)
    elettescar = await _create_user_with_kwargs(username="elettescar", full_name="Martina Eaton")
    electra = await _create_user_with_kwargs(username="electra", full_name="Sonia Moreno")
    await _create_user_with_kwargs(username="danvers", full_name="Elena Riego")
    await _create_user_with_kwargs(username="storm", full_name="Martina Elliott")
    await _create_user_with_kwargs(username="elmarv", full_name="Joanna Marinari")

    # user800 is admin of ws1
    ws1 = await workspaces_services.create_workspace(name="ws for searches(p)", owner=user800, color=2)
    ws1.is_premium = True
    await sync_to_async(ws1.save)()

    # elettescar is member of ws1
    members_role = await _create_workspace_role(workspace=ws1)
    await roles_repositories.create_workspace_membership(user=elettescar, workspace=ws1, workspace_role=members_role)

    # electra is pj member of a project in ws1
    pj1 = await _create_project(workspace=ws1, owner=user800)
    member_role = (await _get_project_other_roles(project=pj1))[0]
    await roles_repositories.create_membership(user=electra, project=pj1, role=member_role)
