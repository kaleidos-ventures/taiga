# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import random
from decimal import Decimal

from asgiref.sync import sync_to_async
from faker import Faker
from fastapi import UploadFile
from taiga.base.db import transaction
from taiga.permissions import choices
from taiga.projects.invitations import repositories as pj_invitations_repositories
from taiga.projects.invitations.choices import ProjectInvitationStatus
from taiga.projects.invitations.models import ProjectInvitation
from taiga.projects.memberships import repositories as pj_memberships_repositories
from taiga.projects.memberships.models import ProjectMembership
from taiga.projects.projects import services as projects_services
from taiga.projects.projects.models import Project
from taiga.projects.roles.models import ProjectRole
from taiga.stories.assignees import repositories as story_assignees_repositories
from taiga.stories.stories import repositories as stories_repositories
from taiga.stories.stories.models import Story
from taiga.users.models import User
from taiga.workflows.models import Workflow, WorkflowStatus
from taiga.workspaces.memberships import repositories as ws_memberships_repositories
from taiga.workspaces.roles.models import WorkspaceRole
from taiga.workspaces.workspaces import services as workspaces_services
from taiga.workspaces.workspaces.models import Workspace

fake: Faker = Faker()
Faker.seed(0)
random.seed(0)

################################
# CONFIGURATION
################################
# Users
NUM_USERS = 10
NUM_USER_COLORS = 8
# Projects
NUM_PROJECT_COLORS = 8
# Workspaces
NUM_WORKSPACE_COLORS = 8
# Workflows
NUM_WORKFLOWS_COLORS = 4

# Stories
NUM_STORIES_PER_WORKFLOW = (0, 30)  # (min, max) by default
STORY_TITLE_MAX_SIZE = ((80,) * 3) + ((120,) * 6) + (490,)  # 80 (30%), 120 (60%), 490 (10%)
PROB_STORY_ASSIGNEES = {  # 0-99 prob of a story to be assigned by its workflow status
    "new": 10,
    "ready": 40,
    "in-progress": 80,
    "done": 95,
}

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

    for project in projects:
        # PROJECT INVITATIONS
        await _create_project_invitations(project=project, users=users)

        # STORIES
        await _create_stories(project=project)

    # CUSTOM PROJECTS
    custom_owner = users[0]
    workspace = await _create_workspace(owner=custom_owner, name="Custom workspace")
    await _create_empty_project(owner=custom_owner, workspace=workspace)
    await _create_inconsistent_permissions_project(owner=custom_owner, workspace=workspace)
    await _create_project_with_several_roles(owner=custom_owner, workspace=workspace, users=users)
    await _create_project_membership_scenario()

    # CUSTOM SCENARIOS
    await _create_scenario_with_invitations()
    await _create_scenario_for_searches()
    await _create_scenario_for_revoke()
    await _create_scenario_with_1k_stories(workspace=workspace, owner=custom_owner, users=users)
    await _create_scenario_with_2k_stories_and_40_workflow_statuses(
        workspace=workspace, owner=custom_owner, users=users
    )

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
    color = fake.random_int(min=1, max=NUM_USER_COLORS)
    user = User.objects.create(username=username, email=email, full_name=full_name, color=color, is_active=True)
    user.set_password("123123")
    user.save()
    return user


@sync_to_async
def _create_user_with_kwargs(username: str, full_name: str, email: str | None = None, color: int | None = None) -> User:
    if not email:
        email = f"{username}@taiga.demo"
    color = color or fake.random_int(min=1, max=NUM_USER_COLORS)
    user = User.objects.create(username=username, email=email, full_name=full_name, color=color, is_active=True)
    user.set_password("123123")
    user.save()
    return user


################################
# ROLES
################################
# admin and general roles are automatically created with `_create_project`


@sync_to_async
def _create_project_role(project: Project, name: str | None = None) -> ProjectRole:
    name = name or fake.word()
    return ProjectRole.objects.create(
        project=project, name=name, is_admin=False, permissions=choices.ProjectPermissions.values
    )


@sync_to_async
def _get_project_roles(project: Project) -> list[ProjectRole]:
    return list(project.roles.all())


@sync_to_async
def _get_project_admin_role(project: Project) -> ProjectRole:
    return project.roles.get(slug="admin")


@sync_to_async
def _get_project_other_roles(project: Project) -> list[ProjectRole]:
    return list(project.roles.exclude(slug="admin"))


@sync_to_async
def _get_project_memberships(project: Project) -> list[ProjectMembership]:
    return list(project.memberships.all())


@sync_to_async
def _get_project_memberships_without_owner(project: Project) -> list[ProjectMembership]:
    return list(project.memberships.exclude(user=project.owner))


@sync_to_async
def _get_project_members(project: Project) -> list[User]:
    return list(project.members.all())


@sync_to_async
def _get_project_owner(project: Project) -> User:
    return project.owner


@sync_to_async
def _get_membership_user(membership: ProjectMembership) -> User:
    return membership.user


@sync_to_async
def _get_membership_role(membership: ProjectMembership) -> ProjectRole:
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
        await pj_memberships_repositories.create_project_membership(user=user, project=project, role=admin_role)

    # add other members in the different roles
    num_members = random.randint(0, len(other_users))
    for _ in range(num_members):
        user = other_users.pop(0)
        role = random.choice(other_roles)
        await pj_memberships_repositories.create_project_membership(user=user, project=project, role=role)


@sync_to_async
def _create_workspace_role(workspace: Workspace) -> WorkspaceRole:
    return WorkspaceRole.objects.create(
        workspace=workspace, name="Members", is_admin=False, permissions=choices.WorkspacePermissions.values
    )


@sync_to_async
def _get_workspace_admin_role(workspace: Workspace) -> WorkspaceRole:
    return workspace.roles.get(slug="admin")


@sync_to_async
def _get_workspace_other_roles(workspace: Workspace) -> list[WorkspaceRole]:
    return list(workspace.roles.exclude(slug="admin"))


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
        await ws_memberships_repositories.create_workspace_membership(user=user, workspace=workspace, role=admin_role)

    # add other members in the different roles if any
    if other_roles:
        num_members = random.randint(0, len(other_users))
        for _ in range(num_members):
            user = other_users.pop(0)
            role = random.choice(other_roles)
            await ws_memberships_repositories.create_workspace_membership(user=user, workspace=workspace, role=role)


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
            logo=random.choice([None, logo_file]),
        )

    return project


#################################
# WORKFLOWS
#################################


@sync_to_async
def _get_workflows(project: Project) -> list[Workflow]:
    return list(project.workflows.all())


@sync_to_async
def _get_workflow_statuses(workflow: Workflow) -> list[WorkflowStatus]:
    return list(workflow.statuses.all())


async def _create_workflow_status(
    workflow: Workflow,
    name: str | None = None,
    color: int | None = None,
) -> None:
    await WorkflowStatus.objects.acreate(
        name=name or fake.unique.text(max_nb_chars=15)[:-1],
        color=color or fake.random_int(min=1, max=NUM_WORKSPACE_COLORS),
        workflow=workflow,
    )


#################################
# STORIES
#################################


async def _create_stories(
    project: Project, min_stories: int = NUM_STORIES_PER_WORKFLOW[0], max_stories: int | None = None
) -> None:
    num_stories_to_create = fake.random_int(
        min=min_stories, max=max_stories or min_stories or NUM_STORIES_PER_WORKFLOW[1]
    )

    members = await _get_project_members(project=project)
    for workflow in await _get_workflows(project=project):
        statuses = await _get_workflow_statuses(workflow=workflow)
        for i in range(num_stories_to_create):
            story = await _create_story(status=random.choice(statuses), owner=random.choice(members), order=Decimal(i))
            status = story.status.slug.lower()
            if status in PROB_STORY_ASSIGNEES.keys() and fake.random_number(digits=2) < PROB_STORY_ASSIGNEES[status]:
                for random_member in fake.random_elements(elements=members, unique=True):
                    await story_assignees_repositories.create_story_assignee(story=story, user=random_member)


async def _create_story(status: WorkflowStatus, owner: User, order: Decimal, title: str | None = None) -> Story:
    _title = title or fake.text(max_nb_chars=random.choice(STORY_TITLE_MAX_SIZE))

    return await stories_repositories.create_story(
        title=_title,
        project_id=status.workflow.project_id,
        workflow_id=status.workflow_id,
        status_id=status.id,
        user_id=owner.id,
        order=order,
    )


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


async def _create_inconsistent_permissions_project(owner: User, workspace: Workspace) -> None:
    # give general role less permissions than public-permissions
    project = await _create_project(
        name="Inconsistent Permissions",
        owner=owner,
        workspace=workspace,
    )
    general_members_role = await sync_to_async(project.roles.get)(slug="general")
    general_members_role.permissions = ["view_story", "view_task"]
    await sync_to_async(general_members_role.save)()
    project.public_permissions = choices.ProjectPermissions.values
    await sync_to_async(project.save)()


async def _create_project_with_several_roles(owner: User, workspace: Workspace, users: list[User]) -> None:
    project = await _create_project(name="Several Roles", owner=owner, workspace=workspace)
    await _create_project_role(project=project, name="UX/UI")
    await _create_project_role(project=project, name="Developer")
    await _create_project_role(project=project, name="Stakeholder")
    await _create_project_memberships(project=project, users=users, except_for=project.owner)


async def _create_project_membership_scenario() -> None:
    user1000 = await _create_user(1000)
    user1001 = await _create_user(1001)
    user1002 = await _create_user(1002)
    user1003 = await _create_user(1003)  # noqa: F841

    # workspace premium: user1000 ws-admin, user1001 ws-member
    workspace = await _create_workspace(owner=user1000, is_premium=True, name="u1001 is ws member")
    members_role = await sync_to_async(workspace.roles.exclude(is_admin=True).first)()
    await ws_memberships_repositories.create_workspace_membership(user=user1001, workspace=workspace, role=members_role)
    # project: user1000 pj-admin, user1001 pj-member
    project = await _create_project(
        workspace=workspace,
        owner=user1000,
        name="pj 11",
        description="user1000 pj-admin, user1001 pj-member",
    )
    members_role = await sync_to_async(project.roles.get)(slug="general")
    await pj_memberships_repositories.create_project_membership(user=user1001, project=project, role=members_role)
    # project: user1000 pj-admin, user1001 pj-member without permissions
    project = await _create_project(
        workspace=workspace,
        owner=user1000,
        name="pj 12",
        description="user1000 pj-admin, user1001 pj-member without permissions",
    )
    members_role = await sync_to_async(project.roles.get)(slug="general")
    await pj_memberships_repositories.create_project_membership(user=user1001, project=project, role=members_role)
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
    project.workspace_member_permissions = ["view_story"]
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
    await pj_memberships_repositories.create_project_membership(user=user1001, project=project, role=members_role)
    # project: user1000 pj-admin, user1001 pj-member
    project = await _create_project(
        workspace=workspace,
        owner=user1000,
        name="more - pj 17",
        description="user1000 pj-admin, user1001 pj-member",
    )
    members_role = await sync_to_async(project.roles.get)(slug="general")
    await pj_memberships_repositories.create_project_membership(user=user1001, project=project, role=members_role)
    # project: user1000 pj-admin, user1001 pj-member
    project = await _create_project(
        workspace=workspace,
        owner=user1000,
        name="more - pj 18",
        description="user1000 pj-admin, user1001 pj-member",
    )
    members_role = await sync_to_async(project.roles.get)(slug="general")
    await pj_memberships_repositories.create_project_membership(user=user1001, project=project, role=members_role)
    # project: user1000 pj-admin, user1001 pj-member
    project = await _create_project(
        workspace=workspace,
        owner=user1000,
        name="more - pj 19",
        description="user1000 pj-admin, user1001 pj-member",
    )
    members_role = await sync_to_async(project.roles.get)(slug="general")
    await pj_memberships_repositories.create_project_membership(user=user1001, project=project, role=members_role)
    # project: user1000 pj-admin, user1001 pj-member
    project = await _create_project(
        workspace=workspace,
        owner=user1000,
        name="more - pj 20",
        description="user1000 pj-admin, user1001 pj-member",
    )
    members_role = await sync_to_async(project.roles.get)(slug="general")
    await pj_memberships_repositories.create_project_membership(user=user1001, project=project, role=members_role)

    # workspace premium: user1000 ws-admin, user1001 ws-member, has_projects=true
    workspace = await _create_workspace(owner=user1000, is_premium=True, name="u1001 is ws member, hasProjects:T")
    members_role = await sync_to_async(workspace.roles.exclude(is_admin=True).first)()
    await ws_memberships_repositories.create_workspace_membership(user=user1001, workspace=workspace, role=members_role)
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
    await pj_memberships_repositories.create_project_membership(user=user1001, project=project, role=members_role)
    members_role.permissions = []
    await sync_to_async(members_role.save)()
    project.workspace_member_permissions = ["view_story"]
    await sync_to_async(project.save)()

    # workspace premium: user1000 ws-admin, user1001 ws-member, has_projects=false
    workspace = await _create_workspace(owner=user1000, is_premium=True, name="u1001 is ws member, hasProjects:F")
    members_role = await sync_to_async(workspace.roles.exclude(is_admin=True).first)()
    await ws_memberships_repositories.create_workspace_membership(user=user1001, workspace=workspace, role=members_role)

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
    await pj_memberships_repositories.create_project_membership(user=user1001, project=project, role=members_role)
    # project: user1000 pj-member, user1001 pj-admin
    project = await _create_project(
        workspace=workspace,
        owner=user1001,
        name="pj 42",
        description="user1000 pj-member, user1001 pj-admin",
    )
    members_role = await sync_to_async(project.roles.get)(slug="general")
    await pj_memberships_repositories.create_project_membership(user=user1000, project=project, role=members_role)
    # project: user1000 pj-admin, user1001 not pj-member, ws-allowed
    project = await _create_project(
        workspace=workspace,
        owner=user1000,
        name="pj 43",
        description="user1000 pj-admin, user1001 not pj-member, ws-allowed",
    )
    project.workspace_member_permissions = ["view_story"]
    await sync_to_async(project.save)()
    # project: user1000 pj-admin, user1001 pj-member without permissions, ws-members allowed
    project = await _create_project(
        workspace=workspace,
        owner=user1000,
        name="pj 44",
        description="user1000 pj-admin, user1001 pj-member without permissions, ws-members allowed",
    )
    members_role = await sync_to_async(project.roles.get)(slug="general")
    await pj_memberships_repositories.create_project_membership(user=user1001, project=project, role=members_role)
    members_role.permissions = []
    project.workspace_member_permissions = ["view_story"]
    await sync_to_async(project.save)()

    # workspace basic: user1000 & user1001 (ws-admin), user1002/user1003 (ws-guest)
    workspace = await _create_workspace(owner=user1000, is_premium=False, name="uk/uk1 (ws-admin), uk2/uk3 (ws-guest)")
    admin_role = await _get_workspace_admin_role(workspace)
    await ws_memberships_repositories.create_workspace_membership(user=user1001, workspace=workspace, role=admin_role)
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
    await pj_memberships_repositories.create_project_membership(user=user1002, project=project, role=members_role)
    await sync_to_async(project.save)()
    # project: u1000 pj-admin, u1002 pj-member view_story, u1001/u1003 no pj-members ws-members/public not-allowed
    project = await _create_project(
        workspace=workspace,
        owner=user1000,
        name="p46 pj-mb-view_story ws-mb/public-NA",
        description="project: u1000 pj-admin, u1002 pj-member view_story, u1001/u1003 no pj-members "
        "ws-members/public not-allowed",
    )
    members_role = await sync_to_async(project.roles.get)(slug="general")
    members_role.permissions = ["view_story"]
    await sync_to_async(members_role.save)()
    await pj_memberships_repositories.create_project_membership(user=user1002, project=project, role=members_role)
    await sync_to_async(project.save)()
    # project: u1k pj-admin, u1k2 pj-member view_story, u1k1/u1k3 no pj-member, public view-us, ws-members not-allowed
    project = await _create_project(
        workspace=workspace,
        owner=user1000,
        name="p47 pj-mb-view_story ws-mb-NA public-viewUs",
        description="u1000 pj-admin, u1002 pj-member view_story, u1001/u1003 no pj-member, public view-us, ws-members "
        "not-allowed",
    )
    members_role = await sync_to_async(project.roles.get)(slug="general")
    members_role.permissions = ["view_story"]
    project.public_permissions = ["view_story"]
    await sync_to_async(members_role.save)()
    await pj_memberships_repositories.create_project_membership(user=user1002, project=project, role=members_role)
    await sync_to_async(project.save)()

    # workspace premium: user1000 (ws-admin), user1001 (ws-member), user1002 (ws-guest), user1003 (ws-guest)
    workspace = await _create_workspace(owner=user1000, is_premium=True, name="uk-ws-adm uk1-ws-mb uk2/uk3-ws-guest")
    members_role = await sync_to_async(workspace.roles.exclude(is_admin=True).first)()
    await ws_memberships_repositories.create_workspace_membership(user=user1001, workspace=workspace, role=members_role)
    # project: u1k pj-admin, u1k2 pj-member view_story, u1k1/u1k3 no pj-member, public view-us, ws-members not-allowed
    project = await _create_project(
        workspace=workspace,
        owner=user1000,
        name="p48 pj-mb-view_story public-viewUs ws-mb-NA",
        description="u1000 pj-admin, u1002 pj-member view_story, u1001/u1003 no pj-member, public view-us, ws-members "
        "not-allowed",
    )
    members_role = await sync_to_async(project.roles.get)(slug="general")
    members_role.permissions = ["view_story"]
    project.public_permissions = ["view_story"]
    await sync_to_async(members_role.save)()
    await pj_memberships_repositories.create_project_membership(user=user1002, project=project, role=members_role)
    await sync_to_async(project.save)()

    # workspace premium: user1000 (ws-admin), user1001/user1002 (ws-member), user1003 (ws-guest)
    workspace = await _create_workspace(owner=user1000, is_premium=True, name="uk-ws-admin uk1/k2-ws-mb uk3-ws-guest")
    members_role = await sync_to_async(workspace.roles.exclude(is_admin=True).first)()
    await ws_memberships_repositories.create_workspace_membership(user=user1001, workspace=workspace, role=members_role)
    await ws_memberships_repositories.create_workspace_membership(user=user1002, workspace=workspace, role=members_role)
    # project: u1k pj-admin, u1k2 pj-member view_story, u1k1/u1k3 no pj-member, public view-us, ws-members not-allowed
    project = await _create_project(
        workspace=workspace,
        owner=user1000,
        name="p49 pj-mb-view_story public-viewUs ws-mb-NA",
        description="u1000 pj-admin, u1002 pj-member view_story, u1001/u1003 no pj-member, public view-us, ws-members "
        "not-allowed",
    )
    members_role = await sync_to_async(project.roles.get)(slug="general")
    members_role.permissions = ["view_story"]
    project.public_permissions = ["view_story"]
    await sync_to_async(members_role.save)()
    await pj_memberships_repositories.create_project_membership(user=user1002, project=project, role=members_role)
    await sync_to_async(project.save)()


################################
# PROJECT INVITATIONS
################################


async def _create_project_invitations(project: Project, users: list[User]) -> None:
    # add accepted invitations for project memberships
    project_owner = await _get_project_owner(project=project)
    invitations = [
        ProjectInvitation(
            user=await _get_membership_user(membership=membership),
            project=project,
            role=await _get_membership_role(membership=membership),
            email=(await _get_membership_user(membership=membership)).email,
            status=ProjectInvitationStatus.ACCEPTED,
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
            ProjectInvitation(
                user=user,
                project=project,
                role=random.choice(await _get_project_roles(project=project)),
                email=user.email,
                status=ProjectInvitationStatus.PENDING,
                invited_by=project_owner,
            )
        )

    # add 0, 1 or 2 pending invitations for unregistered users
    num_users = random.randint(0, 2)
    for i in range(num_users):
        invitations.append(
            ProjectInvitation(
                user=None,
                project=project,
                role=random.choice(await _get_project_roles(project=project)),
                email=f"email-{i}@email.com",
                status=ProjectInvitationStatus.PENDING,
                invited_by=project_owner,
            )
        )

    # create invitations in bulk
    await pj_invitations_repositories.create_project_invitations(objs=invitations)


################################
# CUSTOM SCENARIOS
################################


async def _create_scenario_with_invitations() -> None:
    user900 = await _create_user(900)
    user901 = await _create_user(901)

    # user900 is admin of several workspaces
    ws1 = await workspaces_services.create_workspace(name="ws1 for admins", owner=user900, color=2)
    ws2 = await workspaces_services.create_workspace(name="ws2 for members allowed(p)", owner=user900, color=2)
    ws2.is_premium = True
    await sync_to_async(ws2.save)()
    ws3 = await workspaces_services.create_workspace(name="ws3 for members not allowed(p)", owner=user900, color=2)
    ws3.is_premium = True
    await sync_to_async(ws3.save)()
    await workspaces_services.create_workspace(name="ws4 for guests", owner=user900, color=2)
    ws5 = await workspaces_services.create_workspace(name="ws5 lots of projects", owner=user900, color=2)

    # user901 is admin of ws1
    ws_admin_role = await _get_workspace_admin_role(workspace=ws1)
    await ws_memberships_repositories.create_workspace_membership(user=user901, workspace=ws1, role=ws_admin_role)

    # user901 is member of ws2
    members_role = await _create_workspace_role(workspace=ws2)
    await ws_memberships_repositories.create_workspace_membership(user=user901, workspace=ws2, role=members_role)

    # user901 is member of ws3
    members_role = await _create_workspace_role(workspace=ws3)
    await ws_memberships_repositories.create_workspace_membership(user=user901, workspace=ws3, role=members_role)

    # user900 creates a project in ws1
    await _create_project(workspace=ws1, owner=user900)

    # user900 creates a project in ws2 with ws-members allowed
    pj2 = await _create_project(workspace=ws2, owner=user900)
    pj2.workspace_member_permissions = ["view_story"]
    await sync_to_async(pj2.save)()

    # user900 creates a project in ws3 with ws-members NOT allowed
    await _create_project(workspace=ws3, owner=user900)

    # user900 creates 7 projects in ws5 and user901 is member of these
    pj = await _create_project(workspace=ws5, owner=user900)
    pj_member_role = (await _get_project_other_roles(project=pj))[0]
    await pj_memberships_repositories.create_project_membership(user=user901, project=pj, role=pj_member_role)
    pj = await _create_project(workspace=ws5, owner=user900)
    pj_member_role = (await _get_project_other_roles(project=pj))[0]
    await pj_memberships_repositories.create_project_membership(user=user901, project=pj, role=pj_member_role)
    pj = await _create_project(workspace=ws5, owner=user900)
    pj_member_role = (await _get_project_other_roles(project=pj))[0]
    await pj_memberships_repositories.create_project_membership(user=user901, project=pj, role=pj_member_role)
    pj = await _create_project(workspace=ws5, owner=user900)
    pj_member_role = (await _get_project_other_roles(project=pj))[0]
    await pj_memberships_repositories.create_project_membership(user=user901, project=pj, role=pj_member_role)
    pj = await _create_project(workspace=ws5, owner=user900)
    pj_member_role = (await _get_project_other_roles(project=pj))[0]
    await pj_memberships_repositories.create_project_membership(user=user901, project=pj, role=pj_member_role)
    pj = await _create_project(workspace=ws5, owner=user900)
    pj_member_role = (await _get_project_other_roles(project=pj))[0]
    await pj_memberships_repositories.create_project_membership(user=user901, project=pj, role=pj_member_role)
    pj = await _create_project(workspace=ws5, owner=user900)
    pj_member_role = (await _get_project_other_roles(project=pj))[0]
    await pj_memberships_repositories.create_project_membership(user=user901, project=pj, role=pj_member_role)


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
    ws_members_role = await _create_workspace_role(workspace=ws1)
    await ws_memberships_repositories.create_workspace_membership(user=elettescar, workspace=ws1, role=ws_members_role)

    # electra is pj member of a project in ws1
    pj1 = await _create_project(workspace=ws1, owner=user800)
    pj_member_role = (await _get_project_other_roles(project=pj1))[0]
    await pj_memberships_repositories.create_project_membership(user=electra, project=pj1, role=pj_member_role)


async def _create_scenario_for_revoke() -> None:
    # some users
    user1 = await _create_user_with_kwargs(
        username="pruebastaiga1", full_name="Pruebas Taiga 1", email="pruebastaiga+1@gmail.com"
    )
    user2 = await _create_user_with_kwargs(
        username="pruebastaiga2", full_name="Pruebas Taiga 2", email="pruebastaiga+2@gmail.com"
    )
    user3 = await _create_user_with_kwargs(
        username="pruebastaiga3", full_name="Pruebas Taiga 3", email="pruebastaiga+3@gmail.com"
    )
    user4 = await _create_user_with_kwargs(
        username="pruebastaiga4", full_name="Pruebas Taiga 4", email="pruebastaiga+4@gmail.com"
    )

    ws = await workspaces_services.create_workspace(name="ws for revoking(p)", owner=user1, color=2)
    ws.is_premium = True
    await sync_to_async(ws.save)()

    ws_admin_role = await _get_workspace_admin_role(workspace=ws)
    await ws_memberships_repositories.create_workspace_membership(user=user4, workspace=ws, role=ws_admin_role)

    members_role = await _create_workspace_role(workspace=ws)
    await ws_memberships_repositories.create_workspace_membership(user=user2, workspace=ws, role=members_role)

    pj = await _create_project(workspace=ws, owner=user1)
    pj_member_role = (await _get_project_other_roles(project=pj))[0]
    await pj_memberships_repositories.create_project_membership(user=user3, project=pj, role=pj_member_role)


async def _create_scenario_with_1k_stories(workspace: Workspace, users: list[User], owner: User) -> None:
    """
    Create a new project with 1000 stories.
    """
    project = await _create_project(
        name="1k Stories", description="This project contains 1000 stories.", owner=owner, workspace=workspace
    )
    await _create_project_memberships(project=project, users=users, except_for=project.owner)
    await _create_stories(project=project, min_stories=1000)


async def _create_scenario_with_2k_stories_and_40_workflow_statuses(
    workspace: Workspace, users: list[User], owner: User
) -> None:
    """
    Create a new project with 2000 stories and 40 statuses.
    """
    project = await _create_project(
        name="2k Stories, 40 statuses",
        description="This project contains 2000 stories and 40 statuses.",
        owner=owner,
        workspace=workspace,
    )
    await _create_project_memberships(project=project, users=users, except_for=project.owner)
    workflow = (await _get_workflows(project=project))[0]
    for i in range(0, 40 - len(await _get_workflow_statuses(workflow=workflow))):
        await _create_workflow_status(workflow=workflow)
    await _create_stories(project=project, min_stories=2000)
