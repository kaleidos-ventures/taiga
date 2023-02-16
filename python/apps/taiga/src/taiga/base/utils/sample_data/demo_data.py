# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import random
from uuid import UUID

from taiga.base.db import transaction
from taiga.base.utils.sample_data import factories
from taiga.users import repositories as users_repositories
from taiga.users.models import User
from taiga.workspaces.memberships import repositories as ws_memberships_repositories


@transaction.atomic
async def load_demo_data() -> None:
    # USERS. Create users
    users = []
    usernames = ["usera0", "userb0", "userc0", "userd0", "usere0", "userf0", "userg0"]
    for username in usernames:
        user = await factories.create_user_with_kwargs(username=username)
        users.append(user)

    # CUSTOM SCENARIOS
    print("  - Creating scenario to freelance user working for herself")
    await _create_scenario_freelance_working_for_herself(users=users)
    print("  - Creating scenario to freelance user working for others")
    await _create_scenario_freelance_working_for_others(users=users)
    print("  - Creating scenario to user in society working for others")
    await _create_scenario_user_in_society_working_for_others(users=users)
    print("  - Creating scenario to manager in society working for others")
    await _create_scenario_manager_in_society_working_for_others(users=users)
    print("  - Creating scenario to manager in society with big client")
    await _create_scenario_manager_in_society_with_big_client(users=users)
    print("  - Creating scenario to manager in society with own product")
    await _create_scenario_manager_in_society_with_own_product(users=users)
    print("  - Creating scenario to manager in big society with own product")
    await _create_scenario_manager_in_big_society_with_own_product(users=users)


async def _create_scenario_freelance_working_for_herself(users: list[User]) -> None:
    # USERS
    usera0 = users[0]
    usera1 = await factories.create_user_with_kwargs(username="usera1")
    userd0 = users[3]

    # WORKSPACES
    # admin role is created by default
    # usera0 ws-admin
    # ws "World domination" with no other members
    workspace = await factories.create_workspace(owner=usera0, name="World domination", is_premium=False)

    # PROJECTS
    # it applies a template and creates also admin and general roles
    # usera0 pj-admin
    projects = []

    # pj "The ong" userd0 pj-member/role:general
    ong_proj = await factories.create_project(workspace=workspace, name="The ong", owner=workspace.owner)
    projects.append(await factories.get_project_with_related_info(ong_proj.id))
    general_role = await ong_proj.roles.aget(slug="general")
    await factories.create_project_membership(project=ong_proj, user=userd0, role=general_role)

    # pj "My next idea" usera1 pj-member/role:general
    next_idea_proj = await factories.create_project(workspace=workspace, name="My next idea", owner=workspace.owner)
    projects.append(await factories.get_project_with_related_info(next_idea_proj.id))
    general_role = await next_idea_proj.roles.aget(slug="general")
    await factories.create_project_membership(project=next_idea_proj, user=usera1, role=general_role)

    # pj with no other members
    projects_names = ["My current idea", "My old idea"]
    for pj_name in projects_names:
        proj = await factories.create_project(workspace=workspace, name=pj_name, owner=workspace.owner)
        projects.append(await factories.get_project_with_related_info(proj.id))

    for project in projects:
        # PROJECT INVITATIONS
        await factories.create_project_invitations(project=project, users=users)

        # STORIES
        await factories.create_stories(project_id=project.id)


async def _create_scenario_freelance_working_for_others(users: list[User]) -> None:
    # USERS
    userb0 = users[1]
    userb1 = await factories.create_user_with_kwargs(username="userb1")
    userb2 = await factories.create_user_with_kwargs(username="userb2")
    userb3 = await factories.create_user_with_kwargs(username="userb3")
    usera1 = await users_repositories.get_user(filters={"username_or_email": "usera1"})
    userd0 = users[3]
    userd1 = await factories.create_user_with_kwargs(username="userd1")
    userf0 = users[5]

    # WORKSPACES
    # admin role is created by default
    # userb0 ws-admin
    # ws "My projects" with no other members
    ws_my_projects = await factories.create_workspace(owner=userb0, name="My projects", is_premium=False)
    # ws "Projects" with no other members
    ws_projects = await factories.create_workspace(owner=userb0, name="Projects", is_premium=False)
    # ws random-name with no other members
    ws_random_name = await factories.create_workspace(owner=userb0, is_premium=False)

    # PROJECTS
    # it applies a template and creates also admin and general roles
    # userb0 pj-admin
    projects = []

    # for ws "My projects"
    # pj with no other members
    projects_names = ["Holidays", "Great project"]
    for pj_name in projects_names:
        proj = await factories.create_project(workspace=ws_my_projects, name=pj_name, owner=ws_my_projects.owner)
        projects.append(await factories.get_project_with_related_info(proj.id))

    # for ws "Projects"
    # pj random-name userb1, userb2, userb3 pj-member/role:general
    proj = await factories.create_project(workspace=ws_projects, owner=ws_projects.owner)
    projects.append(await factories.get_project_with_related_info(proj.id))
    general_role = await proj.roles.aget(slug="general")
    await factories.create_project_membership(project=proj, user=userb1, role=general_role)
    await factories.create_project_membership(project=proj, user=userb2, role=general_role)
    await factories.create_project_membership(project=proj, user=userb3, role=general_role)

    # 2 pj random-name with no other members
    for i in range(2):
        proj = await factories.create_project(workspace=ws_projects, owner=ws_projects.owner)
        projects.append(await factories.get_project_with_related_info(proj.id))

    # pj random-name userf0 pj-member/role:general
    proj = await factories.create_project(workspace=ws_projects, owner=ws_projects.owner)
    projects.append(await factories.get_project_with_related_info(proj.id))
    general_role = await proj.roles.aget(slug="general")
    await factories.create_project_membership(project=proj, user=userf0, role=general_role)

    # pj random-name userb1, usera1, userd1 pj-member/role:general. userd0 pj-member/role:admin
    proj = await factories.create_project(workspace=ws_projects, owner=ws_projects.owner)
    projects.append(await factories.get_project_with_related_info(proj.id))
    general_role = await proj.roles.aget(slug="general")
    await factories.create_project_membership(project=proj, user=userb1, role=general_role)
    await factories.create_project_membership(project=proj, user=usera1, role=general_role)
    await factories.create_project_membership(project=proj, user=userd1, role=general_role)
    admin_role = await proj.roles.aget(slug="admin")
    await factories.create_project_membership(project=proj, user=userd0, role=admin_role)

    # for ws random-name
    # pj random-name userd0 pj-member/role:general
    proj = await factories.create_project(workspace=ws_random_name, owner=ws_random_name.owner)
    projects.append(await factories.get_project_with_related_info(proj.id))
    general_role = await proj.roles.aget(slug="general")
    await factories.create_project_membership(project=proj, user=userd0, role=general_role)

    for project in projects:
        # PROJECT INVITATIONS
        await factories.create_project_invitations(project=project, users=users)

        # STORIES
        await factories.create_stories(project_id=project.id)


async def _create_scenario_user_in_society_working_for_others(users: list[User]) -> None:
    # USERS
    userc0 = users[2]

    # WORKSPACES
    # admin role is created by default
    # userc0 ws-admin
    # ws "Personal" with no other members
    workspace = await factories.create_workspace(owner=userc0, name="Personal", is_premium=False)

    # PROJECTS
    # it applies a template and creates also admin and general roles
    # userc0 pj-admin
    projects = []

    # pj with no other members
    projects_names = ["TODO", "Holidays", "Family"]
    for pj_name in projects_names:
        proj = await factories.create_project(workspace=workspace, name=pj_name, owner=workspace.owner)
        projects.append(await factories.get_project_with_related_info(proj.id))

    for project in projects:
        # PROJECT INVITATIONS
        await factories.create_project_invitations(project=project, users=users)

        # STORIES
        await factories.create_stories(project_id=project.id)


async def _create_scenario_manager_in_society_working_for_others(users: list[User]) -> None:
    # USERS
    userd0 = users[3]
    userc0 = users[2]
    # usersdx total 150
    usersdx = [
        await factories.create_user_with_kwargs(username=f"userd{i+1}") for i in range(1, 150)
    ]  # userd1 already exist

    # WORKSPACES
    # admin role is created by default
    # userd0 ws-admin
    ws_internal = await factories.create_workspace(owner=userd0, name="Internal", is_premium=False)
    ws_projects = await factories.create_workspace(owner=userd0, name="Projects", is_premium=False)

    workspaces = [ws_internal, ws_projects]
    # ws with ws-admins between 0-10 of usersdx
    for ws in workspaces:
        num_ws_admins = random.randint(0, 10)
        if num_ws_admins > 0:
            await _create_workspace_memberships(workspace_id=ws.id, users=usersdx[:num_ws_admins], role_slug="admin")

    # ws "Personal" with no other members
    ws_personal = await factories.create_workspace(owner=userd0, name="Personal", is_premium=False)

    # PROJECTS
    # it applies a template and creates also admin and general roles
    # userd0 pj-admin
    projects = []

    # for ws "Internal"
    # pj with members between 0-150 of usersdx
    projects_names = ["Comms", "Human resources"]
    for pj_name in projects_names:
        proj = await factories.create_project(workspace=ws_internal, name=pj_name, owner=ws_internal.owner)
        projects.append(await factories.get_project_with_related_info(proj.id))

    # pj "Innovation week" userc0 pj-member/role:general and others members between 0-150 of usersdx
    proj = await factories.create_project(workspace=ws_internal, name="Innovation week", owner=ws_internal.owner)
    projects.append(await factories.get_project_with_related_info(proj.id))
    general_role = await proj.roles.aget(slug="general")
    await factories.create_project_membership(project=proj, user=userc0, role=general_role)

    # for ws "Projects"
    # pj random-name members between 0-150 of usersdx
    proj = await factories.create_project(workspace=ws_projects, owner=ws_projects.owner)
    projects.append(await factories.get_project_with_related_info(proj.id))

    # 2 pj random-name userc0 pj-member/role:general and others members between 0-150 of usersdx
    for i in range(2):
        proj = await factories.create_project(workspace=ws_projects, owner=ws_projects.owner)
        projects.append(await factories.get_project_with_related_info(proj.id))
        general_role = await proj.roles.aget(slug="general")
        await factories.create_project_membership(project=proj, user=userc0, role=general_role)

    # for ws "Personal"
    # pj "TODO" with no other members
    proj = await factories.create_project(workspace=ws_personal, name="TODO", owner=ws_personal.owner)
    projects.append(await factories.get_project_with_related_info(proj.id))

    for project in projects:
        # PROJECT MEMBERSHIPS
        if project.name != "TODO":
            num_members = random.randint(0, 150)
            if num_members > 0:
                await factories.create_project_memberships(project_id=project.id, users=usersdx[:num_members])

        # PROJECT INVITATIONS
        await factories.create_project_invitations(project=project, users=users + usersdx)

        # STORIES
        await factories.create_stories(project_id=project.id)


async def _create_scenario_manager_in_society_with_big_client(users: list[User]) -> None:
    # USERS
    usere0 = users[4]
    userc0 = users[2]
    usere1 = await factories.create_user_with_kwargs(username="usere1")
    # usersex total 50
    usersex = [
        await factories.create_user_with_kwargs(username=f"usere{i+1}") for i in range(1, 50)
    ]  # usere1 already exist

    # WORKSPACES
    # admin role is created by default
    # usere0 ws-admin
    ws_random_name1 = await factories.create_workspace(owner=usere0, is_premium=False)
    ws_random_name2 = await factories.create_workspace(owner=usere0, is_premium=False)
    ws_random_name3 = await factories.create_workspace(owner=usere0, is_premium=False)
    ws_projects = await factories.create_workspace(owner=usere0, name="Projects", is_premium=False)

    workspaces = [ws_random_name1, ws_random_name2, ws_random_name3, ws_projects]
    # ws with ws-admins between 0-4 of usersex
    for ws in workspaces:
        num_ws_admins = random.randint(0, 4)
        if num_ws_admins > 0:
            await _create_workspace_memberships(workspace_id=ws.id, users=usersex[:num_ws_admins], role_slug="admin")

    # ws "Personal" with no other members
    ws_personal = await factories.create_workspace(owner=usere0, name="Personal", is_premium=False)

    # PROJECTS
    # it applies a template and creates also admin and general roles
    # usere0 pj-admin
    projects = []

    # for ws random-name1
    # 2 pj random-name usere1 pj-member/role:general and others members between 0-50 of usersex
    for i in range(2):
        proj = await factories.create_project(workspace=ws_random_name1, owner=ws_random_name1.owner)
        projects.append(await factories.get_project_with_related_info(proj.id))
        general_role = await proj.roles.aget(slug="general")
        await factories.create_project_membership(project=proj, user=usere1, role=general_role)

    # for ws random-name2
    # pj random-name usere1 pj-member/role:general and others members between 0-50 of usersex
    proj = await factories.create_project(workspace=ws_random_name2, owner=ws_random_name2.owner)
    projects.append(await factories.get_project_with_related_info(proj.id))
    general_role = await proj.roles.aget(slug="general")
    await factories.create_project_membership(project=proj, user=usere1, role=general_role)

    # for ws random-name3
    # pj with members between 0-50 of usersex
    projects_names = [
        "The one that doesn’t start",
        "The bigger one",
        "The one that failed",
        "The other one",
        "That project",
    ]
    for pj_name in projects_names:
        proj = await factories.create_project(workspace=ws_random_name3, name=pj_name, owner=ws_random_name3.owner)
        projects.append(await factories.get_project_with_related_info(proj.id))

    # for ws "Projects"
    # 5 pj random-name members between 0-50 of usersex
    for i in range(5):
        proj = await factories.create_project(workspace=ws_projects, owner=ws_projects.owner)
        projects.append(await factories.get_project_with_related_info(proj.id))

    # for ws "Personal"
    # pj "Birthday party" userc0 pj-member/role:general
    proj = await factories.create_project(workspace=ws_personal, name="Birthday party", owner=ws_personal.owner)
    projects.append(await factories.get_project_with_related_info(proj.id))
    general_role = await proj.roles.aget(slug="general")
    await factories.create_project_membership(project=proj, user=userc0, role=general_role)

    # pj "TODO" with no other members
    proj = await factories.create_project(workspace=ws_personal, name="TODO", owner=ws_personal.owner)
    projects.append(await factories.get_project_with_related_info(proj.id))

    for project in projects:
        # PROJECT MEMBERSHIPS
        if project.workspace.name != "Personal":
            num_members = random.randint(0, 50)
            if num_members > 0:
                await factories.create_project_memberships(project_id=project.id, users=usersex[:num_members])

        # PROJECT INVITATIONS
        await factories.create_project_invitations(project=project, users=users + usersex)

        # STORIES
        await factories.create_stories(project_id=project.id)


async def _create_scenario_manager_in_society_with_own_product(users: list[User]) -> None:
    # USERS
    userf0 = users[5]
    userf1 = await factories.create_user_with_kwargs(username="userf1")
    userf2 = await factories.create_user_with_kwargs(username="userf2")
    userf3 = await factories.create_user_with_kwargs(username="userf3")
    # usersfx total 40
    usersfx = [
        await factories.create_user_with_kwargs(username=f"userf{i+1}") for i in range(3, 40)
    ]  # userf1, userf2, userf3 already exist

    # WORKSPACES
    # admin role is created by default
    # userf0 ws-admin
    # ws "Projects" userf1, userf2 and userf3 ws-admins
    ws_projects = await factories.create_workspace(owner=userf0, name="Projects", is_premium=False)
    await _create_workspace_memberships(workspace_id=ws_projects.id, users=[userf1, userf2, userf3], role_slug="admin")
    # ws "Personal" with no other members
    ws_personal = await factories.create_workspace(owner=userf0, name="Personal", is_premium=False)

    # PROJECTS
    # it applies a template and creates also admin and general roles
    # userf0 pj-admin
    projects = []

    # for ws "Projects"
    # pj with members between 0-40 of usersfx
    projects_names = [
        "Our product - marketing",
        "Our product - growth",
        "Our product - research",
        "The old product",
        "Our product but mobile",
        "Onboarding",
        "Killer project (beta)",
        "The project that is already in production",
    ]
    for pj_name in projects_names:
        proj = await factories.create_project(workspace=ws_projects, name=pj_name, owner=ws_projects.owner)
        projects.append(await factories.get_project_with_related_info(proj.id))

    # for ws "Personal"
    # pj with no other members
    projects_names = ["Birthday party", "TODO"]
    for pj_name in projects_names:
        proj = await factories.create_project(workspace=ws_personal, name=pj_name, owner=ws_personal.owner)
        projects.append(await factories.get_project_with_related_info(proj.id))

    for project in projects:
        # PROJECT MEMBERSHIPS
        if project.workspace.name != "Personal":
            num_members = random.randint(0, 40)
            if num_members > 0:
                await factories.create_project_memberships(project_id=project.id, users=usersfx[:num_members])

        # PROJECT INVITATIONS
        await factories.create_project_invitations(project=project, users=users + usersfx)

        # STORIES
        await factories.create_stories(project_id=project.id)


async def _create_scenario_manager_in_big_society_with_own_product(users: list[User]) -> None:
    # USERS
    userg0 = users[6]
    # usersgx total 100
    usersgx = [await factories.create_user_with_kwargs(username=f"userg{i+1}") for i in range(0, 100)]

    # WORKSPACES
    # admin role is created by default
    # userg0 ws-admin
    ws_inner = await factories.create_workspace(owner=userg0, name="Inner", is_premium=False)
    ws_marketing = await factories.create_workspace(owner=userg0, name="Marketing & comms", is_premium=False)
    ws_support = await factories.create_workspace(owner=userg0, name="Support", is_premium=False)
    ws_events = await factories.create_workspace(owner=userg0, name="Events", is_premium=False)
    ws_mobile = await factories.create_workspace(owner=userg0, name="Mobile app", is_premium=False)
    ws_desktop = await factories.create_workspace(owner=userg0, name="Desktop app", is_premium=False)

    workspaces = [ws_inner, ws_marketing, ws_support, ws_events, ws_mobile, ws_desktop]
    # ws with ws-admins between 1-9 of usersgx
    for ws in workspaces:
        num_ws_admins = random.randint(1, 9)
        if num_ws_admins > 0:
            await _create_workspace_memberships(workspace_id=ws.id, users=usersgx[:num_ws_admins], role_slug="admin")

    # PROJECTS
    # it applies a template and creates also admin and general roles
    # userg0 pj-admin
    projects = []

    # for ws "Inner"
    # pj with members between 1-100 of usersgx
    projects_names = ["Human resources", "Innovation week", "Onboarding"]
    for pj_name in projects_names:
        proj = await factories.create_project(workspace=ws_inner, name=pj_name, owner=ws_inner.owner)
        projects.append(await factories.get_project_with_related_info(proj.id))

    # for ws "Events"
    # pj with members between 1-100 of usersgx
    projects_names = ["2023", "2022", "2021", "2020"]
    for pj_name in projects_names:
        proj = await factories.create_project(workspace=ws_events, name=pj_name, owner=ws_events.owner)
        projects.append(await factories.get_project_with_related_info(proj.id))

    # for ws "Mobile app"
    # pj with members between 1-100 of usersgx
    projects_names = ["First idea that didn’t work", "Design"]
    for pj_name in projects_names:
        proj = await factories.create_project(workspace=ws_mobile, name=pj_name, owner=ws_mobile.owner)
        projects.append(await factories.get_project_with_related_info(proj.id))

    # for ws "Desktop app"
    # pjs with members between 1-100 of usersgx
    projects_names = ["The old product", "Hardware", "Software", "Research", "Support"]
    for pj_name in projects_names:
        proj = await factories.create_project(workspace=ws_desktop, name=pj_name, owner=ws_desktop.owner)
        projects.append(await factories.get_project_with_related_info(proj.id))

    for project in projects:
        # PROJECT MEMBERSHIPS
        num_members = random.randint(1, 100)
        await factories.create_project_memberships(project_id=project.id, users=usersgx[:num_members])

        # PROJECT INVITATIONS
        await factories.create_project_invitations(project=project, users=users + usersgx)

        # STORIES
        await factories.create_stories(project_id=project.id)


async def _create_workspace_memberships(workspace_id: UUID, users: list[User], role_slug: str) -> None:
    workspace = await factories.get_workspace_with_related_info(workspace_id)

    # get role
    role = await workspace.roles.aget(slug=role_slug)

    # get users except the owner of the workspace
    users = [u for u in users if u.id != workspace.owner_id]

    # add ws members
    for user in users:
        await ws_memberships_repositories.create_workspace_membership(user=user, workspace=workspace, role=role)