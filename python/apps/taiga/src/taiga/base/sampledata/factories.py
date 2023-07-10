# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC


import random
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path
from typing import Final
from uuid import UUID

from asgiref.sync import sync_to_async
from django.db.models import Model
from faker import Faker
from fastapi import UploadFile
from taiga.base.sampledata import constants
from taiga.comments.models import Comment
from taiga.projects.invitations import repositories as pj_invitations_repositories
from taiga.projects.invitations.choices import ProjectInvitationStatus
from taiga.projects.invitations.models import ProjectInvitation
from taiga.projects.memberships import repositories as pj_memberships_repositories
from taiga.projects.projects import services as projects_services
from taiga.projects.projects.models import Project
from taiga.projects.references import get_new_project_reference_id
from taiga.projects.roles.models import ProjectRole
from taiga.stories.assignments.models import StoryAssignment
from taiga.stories.stories.models import Story
from taiga.users.models import User
from taiga.workflows.models import WorkflowStatus
from taiga.workspaces.workspaces import services as workspaces_services
from taiga.workspaces.workspaces.models import Workspace

fake: Faker = Faker()
Faker.seed(0)
random.seed(0)


MEDIA_DIR: Final[Path] = Path(__file__).parent.joinpath("media")
PROJECT_LOGOS_DIR: Final[Path] = MEDIA_DIR.joinpath("projects")


################################
# USERS
################################


@sync_to_async
def create_user_with_kwargs(
    username: str, full_name: str | None = None, email: str | None = None, color: int | None = None
) -> User:
    if not full_name:
        full_name = fake.name()
    if not email:
        email = f"{username}@taiga.demo"
    color = color or fake.random_int(min=1, max=constants.NUM_USER_COLORS)
    user = User.objects.create(username=username, email=email, full_name=full_name, color=color, is_active=True)
    user.set_password("123123")
    user.save()
    return user


################################
# WORKSPACES
################################


async def create_workspace(created_by: User, name: str | None = None, color: int | None = None) -> Workspace:
    name = name or fake.bs()[:35]
    color = color or fake.random_int(min=1, max=constants.NUM_WORKSPACE_COLORS)
    return await workspaces_services._create_workspace(name=name, color=color, created_by=created_by)


################################
# PROJECTS
################################


async def get_project_with_related_info(id: UUID) -> Project:
    return await (
        Project.objects.select_related()
        .prefetch_related(
            "roles",
            "members",
            "memberships",
            "memberships__user",
            "memberships__role",
            "workflows",
            "workflows__statuses",
        )
        .aget(id=id)
    )


async def create_project(
    workspace: Workspace, created_by: User, name: str | None = None, description: str | None = None
) -> Project:
    name = name or fake.catch_phrase()
    description = description or fake.paragraph(nb_sentences=2)
    logo = random.choice(list(PROJECT_LOGOS_DIR.iterdir()))

    with logo.open("rb") as file:
        logo_file = (
            UploadFile(file=file, filename=logo.name)
            if fake.boolean(chance_of_getting_true=constants.PROB_PROJECT_WITH_LOGO)
            else None
        )
        return await projects_services._create_project(
            name=name,
            description=description,
            color=fake.random_int(min=1, max=constants.NUM_PROJECT_COLORS),
            created_by=created_by,
            workspace=workspace,
            logo=logo_file,
        )


async def create_project_memberships(project_id: UUID, users: list[User]) -> None:
    project = await get_project_with_related_info(project_id)

    # get admin and other roles
    other_roles = [r for r in project.roles.all() if r.slug != "admin"]
    admin_role = await project.roles.aget(slug="admin")

    # get users except the creator of the project
    users = [u for u in users if u.id != project.created_by_id]

    # calculate admin (at least 1/3 of the members) and no admin users
    num_admins = random.randint(0, len(users) // 3)
    for user in users[:num_admins]:
        await pj_memberships_repositories.create_project_membership(user=user, project=project, role=admin_role)

    if other_roles:
        for user in users[num_admins:]:
            role = random.choice(other_roles)
            await pj_memberships_repositories.create_project_membership(user=user, project=project, role=role)


async def create_project_membership(project: Project, user: User, role: ProjectRole) -> None:
    await pj_memberships_repositories.create_project_membership(user=user, project=project, role=role)


async def create_project_invitations(project: Project, users: list[User]) -> None:
    # add accepted invitations for project memberships
    invitations = [
        ProjectInvitation(
            user=m.user,
            project=project,
            role=m.role,
            email=m.user.email,
            status=ProjectInvitationStatus.ACCEPTED,
            invited_by=project.created_by,
        )
        for m in project.memberships.all()
        if m.user_id != project.created_by_id
    ]

    # get no members
    members = list(project.members.all())
    no_members = [u for u in users if u not in members]
    random.shuffle(no_members)

    # get project roles
    roles = list(project.roles.all())

    # add 0, 1 or 2 pending invitations for registered users
    num_users = random.randint(0, 2)
    for user in no_members[:num_users]:
        invitations.append(
            ProjectInvitation(
                user=user,
                project=project,
                role=random.choice(roles),
                email=user.email,
                status=ProjectInvitationStatus.PENDING,
                invited_by=project.created_by,
            )
        )

    # add 0, 1 or 2 pending invitations for unregistered users
    num_users = random.randint(0, 2)
    for i in range(num_users):
        invitations.append(
            ProjectInvitation(
                user=None,
                project=project,
                role=random.choice(roles),
                email=f"email-{i}@email.com",
                status=ProjectInvitationStatus.PENDING,
                invited_by=project.created_by,
            )
        )

    # create invitations in bulk
    await pj_invitations_repositories.create_project_invitations(objs=invitations)


#################################
# STORIES
#################################


async def create_stories(
    project_id: UUID,
    min_stories: int = constants.NUM_STORIES_PER_WORKFLOW[0],
    max_stories: int | None = None,
    with_comments: bool = False,
) -> None:
    project = await get_project_with_related_info(project_id)
    num_stories_to_create = fake.random_int(
        min=min_stories, max=max_stories or min_stories or constants.NUM_STORIES_PER_WORKFLOW[1]
    )
    members = list(project.members.all())
    workflows = list(project.workflows.all())

    # Create stories
    stories = []
    for workflow in workflows:
        statuses = list(workflow.statuses.all())

        for i in range(num_stories_to_create):
            stories.append(
                await _create_story(
                    status=random.choice(statuses),
                    created_by=random.choice(members),
                    order=Decimal(i),
                    save=False,
                )
            )
        await Story.objects.abulk_create(stories)

    # Create story assignments and comments
    story_assignments = []
    async for story in Story.objects.select_related().filter(project=project):

        if fake.random_number(digits=2) < constants.PROB_STORY_ASSIGNMENTS.get(
            story.status.name, constants.PROB_STORY_ASSIGNMENTS_DEFAULT
        ):
            # Sometimes we assign all the members
            members_sample = (
                members if fake.boolean(chance_of_getting_true=10) else fake.random_sample(elements=members)
            )
            for member in members_sample:
                story_assignments.append(
                    StoryAssignment(
                        story=story,
                        user=member,
                        created_at=fake.date_time_between(start_date=story.created_at, tzinfo=timezone.utc),
                    )
                )

        # Create story comments
        if with_comments:
            await create_story_comments(
                story=story,
                status_name=story.status.name,
                pj_members=members,
            )

    await StoryAssignment.objects.abulk_create(story_assignments)


async def _create_story(
    status: WorkflowStatus,
    created_by: User,
    order: Decimal,
    title: str | None = None,
    description: str | None = None,
    save: bool = True,
) -> Story:
    _ref = await sync_to_async(get_new_project_reference_id)(status.workflow.project_id)
    _title = title or fake.text(max_nb_chars=random.choice(constants.STORY_TITLE_MAX_SIZE))[:500]
    _description = description or f"<p>{fake.paragraph(nb_sentences=2)}</p>"
    _created_at = fake.date_time_between(start_date="-2y", tzinfo=timezone.utc)

    story = Story(
        ref=_ref,
        title=_title,
        description=_description,
        order=order,
        created_at=_created_at,
        created_by_id=created_by.id,
        project_id=status.workflow.project_id,
        workflow_id=status.workflow_id,
        status_id=status.id,
    )
    if save:
        await sync_to_async(story.save)()
    return story


#################################
# COMMENTS
#################################


async def create_story_comments(
    story: Story, status_name: str, pj_members: list[User], text: str | None = None
) -> None:
    story_comments = []
    prob_comments = constants.PROB_STORY_COMMENTS.get(status_name, constants.PROB_STORY_COMMENTS_DEFAULT)
    if fake.random_number(digits=2) < prob_comments:
        max_comments = constants.PROB_STORY_COMMENTS.get(status_name, constants.PROB_STORY_COMMENTS_DEFAULT)
        for _ in range(fake.random_int(min=1, max=max_comments)):
            story_comments.append(
                await _create_comment_object(
                    text=text if text else f"<p>{fake.paragraph(nb_sentences=2)}</p>",
                    created_by=fake.random_element(elements=pj_members),
                    object=story,
                )
            )
    await Comment.objects.abulk_create(story_comments)


@sync_to_async
def _create_comment_object(
    text: str,
    created_by: User,
    object: Model,
    created_at: datetime | None = None,
) -> Comment:
    return Comment(
        text=text,
        content_object=object,
        created_by=created_by,
        created_at=created_at
        if created_at
        else fake.date_time_between(
            start_date=object.created_at,  # type: ignore[attr-defined]
            tzinfo=timezone.utc,
            end_date=object.created_at + timedelta(days=constants.MAX_DAYS_LAST_COMMENT),  # type: ignore[attr-defined]
        ),
    )
