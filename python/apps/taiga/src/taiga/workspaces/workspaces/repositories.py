# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from itertools import chain
from typing import Callable, Iterable
from uuid import UUID

from asgiref.sync import sync_to_async
from taiga.base.db.models import (
    BooleanField,
    Case,
    CharField,
    Coalesce,
    Count,
    Exists,
    IntegerField,
    OuterRef,
    Prefetch,
    Q,
    Subquery,
    Value,
    When,
)
from taiga.projects.invitations.choices import ProjectInvitationStatus
from taiga.projects.projects.models import Project
from taiga.users.models import User
from taiga.workspaces.roles import repositories as roles_repositories
from taiga.workspaces.workspaces.models import Workspace


@sync_to_async
def get_user_workspaces_overview(user: User) -> list[Workspace]:
    # workspaces where the user is ws-admin with all its projects
    admin_ws_ids = (
        Workspace.objects.filter(
            memberships__user__id=user.id,  # user_is_ws_member
            memberships__role__is_admin=True,  # user_ws_role_is_admin
        )
        .order_by("-created_at")
        .values_list("id", flat=True)
    )
    admin_ws: Iterable[Workspace] = Workspace.objects.none()
    for ws_id in admin_ws_ids:
        projects_ids = list(
            Project.objects.filter(workspace_id=ws_id)  # pj_in_workspace
            .order_by("-created_at")
            .values_list("id", flat=True)
        )
        total_projects = len(projects_ids)
        projects_qs = Project.objects.filter(id__in=projects_ids[:6]).order_by("-created_at")
        has_projects = Workspace.objects.get(id=ws_id).projects.count() > 0
        user_is_owner = Workspace.objects.get(id=ws_id).owner.id == user.id
        invited_projects_qs = Project.objects.filter(
            Q(invitations__user_id=user.id)
            | (Q(invitations__user__isnull=True) & Q(invitations__email__iexact=user.email)),
            invitations__status=ProjectInvitationStatus.PENDING,
            workspace_id=ws_id,
        )
        qs = (
            Workspace.objects.filter(id=ws_id)
            .prefetch_related(
                Prefetch("projects", queryset=projects_qs, to_attr="latest_projects"),
                Prefetch("projects", queryset=invited_projects_qs, to_attr="invited_projects"),
            )
            .annotate(total_projects=Value(total_projects, output_field=IntegerField()))
            .annotate(has_projects=Value(has_projects, output_field=BooleanField()))
            .annotate(user_role=Value("admin", output_field=CharField()))
            .annotate(user_is_owner=Value(user_is_owner, output_field=BooleanField()))
        )
        admin_ws = chain(admin_ws, qs)

    # workspaces where the user is ws-member with all its visible projects
    member_ws_ids = (
        Workspace.objects.filter(
            memberships__user__id=user.id,  # user_is_ws_member
            memberships__role__is_admin=False,  # user_ws_role_is_member
        )
        .order_by("-created_at")
        .values_list("id", flat=True)
    )
    member_ws: Iterable[Workspace] = Workspace.objects.none()
    for ws_id in member_ws_ids:
        pj_in_workspace = Q(workspace_id=ws_id)
        ws_allowed = ~Q(memberships__user__id=user.id) & Q(workspace_member_permissions__len__gt=0)
        pj_allowed = Q(memberships__user__id=user.id)
        projects_ids = list(
            Project.objects.filter(pj_in_workspace, (ws_allowed | pj_allowed))
            .order_by("-created_at")
            .values_list("id", flat=True)
        )
        total_projects = len(projects_ids)
        projects_qs = Project.objects.filter(id__in=projects_ids[:6]).order_by("-created_at")
        has_projects = Workspace.objects.get(id=ws_id).projects.count() > 0
        invited_projects_qs = Project.objects.filter(
            Q(invitations__user_id=user.id)
            | (Q(invitations__user__isnull=True) & Q(invitations__email__iexact=user.email)),
            invitations__status=ProjectInvitationStatus.PENDING,
            workspace_id=ws_id,
        )
        qs = (
            Workspace.objects.filter(id=ws_id)
            .prefetch_related(
                Prefetch("projects", queryset=projects_qs, to_attr="latest_projects"),
                Prefetch("projects", queryset=invited_projects_qs, to_attr="invited_projects"),
            )
            .annotate(total_projects=Value(total_projects, output_field=IntegerField()))
            .annotate(has_projects=Value(has_projects, output_field=BooleanField()))
            .annotate(user_role=Value("member", output_field=CharField()))
            .annotate(user_is_owner=Value(False, output_field=BooleanField()))
        )
        member_ws = chain(member_ws, qs)

    # workspaces where the user is ws-guest with all its visible projects
    # or is not even a guest and only have invited projects
    user_pj_member = Q(memberships__user__id=user.id)
    user_invited_pj = Q(invitations__status=ProjectInvitationStatus.PENDING) & (
        Q(invitations__user_id=user.id) | (Q(invitations__user__isnull=True) & Q(invitations__email__iexact=user.email))
    )
    guest_ws_ids = (
        Project.objects.filter(user_pj_member | user_invited_pj)
        .exclude(workspace__memberships__user__id=user.id)  # user_not_ws_member
        .order_by("workspace_id")
        .distinct("workspace_id")
        .values_list("workspace_id", flat=True)
    )

    guest_ws: Iterable[Workspace] = Workspace.objects.none()
    for ws_id in guest_ws_ids:
        projects_ids = list(
            Project.objects.filter(
                workspace_id=ws_id,  # pj_in_workspace,
                memberships__user__id=user.id,  # user_pj_member
            )
            .order_by("-created_at")
            .values_list("id", flat=True)
        )
        total_projects = len(projects_ids)
        projects_qs = Project.objects.filter(id__in=projects_ids[:6]).order_by("-created_at")
        has_projects = Workspace.objects.get(id=ws_id).projects.count() > 0
        invited_projects_qs = Project.objects.filter(
            Q(invitations__user_id=user.id)
            | (Q(invitations__user__isnull=True) & Q(invitations__email__iexact=user.email)),
            invitations__status=ProjectInvitationStatus.PENDING,
            workspace_id=ws_id,
        )
        qs = (
            Workspace.objects.filter(id=ws_id)
            .prefetch_related(
                Prefetch("projects", queryset=projects_qs, to_attr="latest_projects"),
                Prefetch("projects", queryset=invited_projects_qs, to_attr="invited_projects"),
            )
            .annotate(total_projects=Value(total_projects, output_field=IntegerField()))
            .annotate(has_projects=Value(has_projects, output_field=BooleanField()))
            .annotate(user_role=Value("guest", output_field=CharField()))
            .annotate(user_is_owner=Value(False, output_field=BooleanField()))
        )
        guest_ws = chain(guest_ws, qs)

    result = list(chain(admin_ws, member_ws, guest_ws))
    return result


@sync_to_async
def get_user_workspace_overview(user: User, slug: str) -> Workspace | None:
    # Generic annotations:
    has_projects = Exists(Project.objects.filter(workspace=OuterRef("pk")))
    user_is_owner = Case(When(owner_id=user.id, then=Value(True)), default=Value(False), output_field=BooleanField())
    user_role: Callable[[str], Value] = lambda role_name: Value(role_name, output_field=CharField())

    # Generic prefetch
    invited_projects_qs = Project.objects.filter(
        invitations__user_id=user.id, invitations__status=ProjectInvitationStatus.PENDING
    )

    # workspaces where the user is admin with all its projects
    try:
        total_projects: Subquery | Count = Count("projects")
        visible_project_ids_qs = (
            Project.objects.filter(workspace=OuterRef("workspace")).values_list("id", flat=True).order_by("-created_at")
        )
        latest_projects_qs = Project.objects.filter(id__in=Subquery(visible_project_ids_qs[:6])).order_by("-created_at")
        return (
            Workspace.objects.filter(
                slug=slug,
                memberships__user_id=user.id,  # user_is_ws_member
                memberships__role__is_admin=True,  # user_ws_role_is_admin
            )
            .prefetch_related(
                Prefetch("projects", queryset=latest_projects_qs, to_attr="latest_projects"),
                Prefetch("projects", queryset=invited_projects_qs, to_attr="invited_projects"),
            )
            .annotate(total_projects=Coalesce(total_projects, 0))
            .annotate(has_projects=has_projects)
            .annotate(user_role=user_role("admin"))
            .annotate(user_is_owner=user_is_owner)
            .get()
        )
    except Workspace.DoesNotExist:
        pass  # The workspace selected is not of this kind

    # workspaces where the user is ws-member with all its visible projects
    try:
        ws_allowed = ~Q(members__id=user.id) & Q(workspace_member_permissions__len__gt=0)
        pj_allowed = Q(members__id=user.id)
        total_projects = Subquery(
            Project.objects.filter(Q(workspace_id=OuterRef("id")))
            .filter((ws_allowed | pj_allowed))
            .values("workspace")
            .annotate(count=Count("*"))
            .values("count"),
            output_field=IntegerField(),
        )
        visible_project_ids_qs = (
            Project.objects.filter(Q(workspace=OuterRef("workspace")))
            .filter(ws_allowed | pj_allowed)
            .values_list("id", flat=True)
            .order_by("-created_at")
        )
        latest_projects_qs = Project.objects.filter(id__in=Subquery(visible_project_ids_qs[:6])).order_by("-created_at")
        return (
            Workspace.objects.filter(
                slug=slug,
                memberships__user__id=user.id,  # user_is_ws_member
                memberships__role__is_admin=False,  # user_ws_role_is_member
            )
            .prefetch_related(
                Prefetch("projects", queryset=latest_projects_qs, to_attr="latest_projects"),
                Prefetch("projects", queryset=invited_projects_qs, to_attr="invited_projects"),
            )
            .annotate(total_projects=Coalesce(total_projects, 0))
            .annotate(has_projects=has_projects)
            .annotate(user_role=user_role("member"))
            .annotate(user_is_owner=user_is_owner)
            .get()
        )
    except Workspace.DoesNotExist:
        pass  # The workspace selected is not of this kind

    # workspaces where the user is ws-guest with all its visible projects
    # or is not even a guest and only have invited projects
    try:
        user_not_ws_member = ~Q(members__id=user.id)
        user_pj_member = Q(projects__members__id=user.id)
        user_invited_pj = Q(
            projects__invitations__status=ProjectInvitationStatus.PENDING, projects__invitations__user_id=user.id
        )
        total_projects = Subquery(
            Project.objects.filter(
                Q(workspace_id=OuterRef("id")),
                members__id=user.id,
            )
            .values("workspace")
            .annotate(count=Count("*"))
            .values("count"),
            output_field=IntegerField(),
        )
        visible_project_ids_qs = (
            Project.objects.filter(
                Q(workspace=OuterRef("workspace")),
                members__id=user.id,
            )
            .order_by("-created_at")
            .values_list("id", flat=True)
        )
        latest_projects_qs = Project.objects.filter(id__in=Subquery(visible_project_ids_qs[:6])).order_by("-created_at")
        return (
            Workspace.objects.filter(user_not_ws_member & (user_pj_member | user_invited_pj), slug=slug)
            .distinct()
            .prefetch_related(
                Prefetch("projects", queryset=latest_projects_qs, to_attr="latest_projects"),
                Prefetch("projects", queryset=invited_projects_qs, to_attr="invited_projects"),
            )
            .annotate(total_projects=Coalesce(total_projects, 0))
            .annotate(has_projects=has_projects)
            .annotate(user_role=user_role("guest"))
            .annotate(user_is_owner=user_is_owner)
            .get()
        )
    except Workspace.DoesNotExist:
        return None  # There is no workspace with this slug for this user


@sync_to_async
def create_workspace(name: str, color: int, owner: User) -> Workspace:
    return Workspace.objects.create(name=name, color=color, owner=owner)


@sync_to_async
def get_workspace(slug: str) -> Workspace | None:
    try:
        return Workspace.objects.get(slug=slug)
    except Workspace.DoesNotExist:
        return None


def _get_total_user_projects_sync(workspace_id: UUID, user_id: UUID) -> int:
    ws_admin = Q(workspace__memberships__user_id=user_id) & Q(workspace__memberships__role__is_admin=True)
    ws_member_allowed = (
        Q(workspace__memberships__user_id=user_id)
        & ~Q(memberships__user_id=user_id)
        & Q(workspace_member_permissions__len__gt=0)
    )
    pj_member_allowed = Q(memberships__user_id=user_id)

    return (
        Project.objects.filter(workspace_id=workspace_id)
        .filter(ws_admin | ws_member_allowed | pj_member_allowed)
        .distinct()
        .count()
    )


@sync_to_async
def get_workspace_detail(id: UUID, user_id: UUID) -> Workspace | None:
    user_workspace_role_name = roles_repositories.get_user_workspace_role_name_sync(workspace_id=id, user_id=user_id)
    user_projects_count = _get_total_user_projects_sync(workspace_id=id, user_id=user_id)

    try:
        return (
            Workspace.objects.annotate(total_projects=Value(user_projects_count, output_field=IntegerField()))
            .annotate(has_projects=Exists(Project.objects.filter(workspace=OuterRef("pk"))))
            .annotate(
                user_is_owner=Case(
                    When(owner_id=user_id, then=Value(True)), default=Value(False), output_field=BooleanField()
                )
            )
            .annotate(user_role=Value(user_workspace_role_name, output_field=CharField()))
            .get(id=id)
        )
    except Workspace.DoesNotExist:
        return None


@sync_to_async
def get_workspace_summary(id: UUID, user_id: UUID) -> Workspace | None:
    user_workspace_role_name = roles_repositories.get_user_workspace_role_name_sync(workspace_id=id, user_id=user_id)
    try:
        return Workspace.objects.annotate(user_role=Value(user_workspace_role_name, output_field=CharField())).get(
            id=id
        )
    except Workspace.DoesNotExist:
        return None


# # DRAFT: This is a not-working attempt to solve the problematic using just one query
#
# from taiga.base.db.models import Count, OuterRef, Subquery
#
# def get_user_workspaces_overview(user: User) -> list[Workspace]:
#     # return the user"s workspaces including those projects viewable by the user:
#     #   (1) all the workspaces the user is a member of (all workspace roles will have at least "view" permission),
#     #         (1a) listing all the projects if the user is a ws_admin (no mattering if the user is a pj-member), or
#     #         (1b) listing just the projects the user can view if the user is a ws_member.
#     #   (2) all the workspaces containing projects the user is a member of (with permissions)
#
#     objects_with_member = Q(members__id=user.id)
#     projects_that_belongs_to_a_ws = Q(workspace_id=OuterRef("workspace_id"))
#     projects_with_member_and_permissions = objects_with_member & Q(memberships__role__permissions__len__gt=0)
#     projects_with_ws_member = Q(workspace__members__id=user.id)
#     projects_with_ws_role_admin = Q(workspace__memberships__role__is_admin=True)
#
#     project_workspaces_ids = Project.objects.filter(objects_with_member).values_list("workspace", flat=True)
#     user_is_workspace_member = projects_that_belongs_to_a_ws & projects_with_ws_member
#     user_is_workspace_admin = user_is_workspace_member & projects_with_ws_role_admin
#     user_is_not_workspace_admin = user_is_workspace_member & ~projects_with_ws_role_admin
#     # TODO: Subquery is not working
#     latest_user_projects_ids = Subquery(
#         (
#             Project.objects.filter(
#                 # workspaces the user is a ws-admin (all its projects
#                 Q(workspace_id=OuterRef("workspace_id")) &
#                 Q(workspace__members__id=user.id) &
#                 Q(workspace__memberships__role__is_admin=True)
#             ).filter(
#                 # workspaces the user is a ws-member (not-pj-member) (just if user has ws-permissions)
#                 Q(workspace_id=OuterRef("workspace_id")) &
#                 Q(workspace__members__id=user.id) &
#                 Q(workspace__memberships__role__is_admin=False) &
#                 ((Q(members__id=user.id) &
#                   Q(workspace__memberships__role__permissions__len__gt=0))
#                  |( ~Q(members__id=user.id) & Q(workspace_member_permissions__len__gt=0)))
#             ).filter(  # workspaces the user is not ws-member but a pj-member (just if user has pj-permissions)
#                 Q(workspace_id=OuterRef("workspace_id")) &
#                 ~Q(workspace__members__id=user.id) &
#                 Q(members__id=user.id) &
#                 Q(memberships__role__permissions__len__gt=0))
#         )
#             .values_list("id", flat=True)
#             .order_by("-created_at")[:6]
#     )
#
#     latest_user_projects = Project.objects.filter(id__in=latest_user_projects_ids).order_by("-created_at")
#
#     all_user_projects = Subquery(
#         Project.objects.filter(
#             Q(workspace_id=OuterRef("id"))  # (1a)
#             if user_is_workspace_admin
#             else Q(workspace_id=OuterRef("id")) & projects_with_member_and_permissions  # (1b)
#         )
#             .annotate(cnt=Count("pk"))
#             .order_by("cnt")
#             .values("cnt")[:1],
#         output_field=IntegerField(),
#             )
#
#     # all_user_projects.contains_aggregate = False
#     # qs = Project.objects.annotate(total_projects=all_user_projects)
#
#     workspace_user_rol_id = Subquery(
#         WorkspaceMembership.objects.filter(Q(user_id=user.id) & Q(workspace_id=OuterRef("id")))
#             .values_list("role__id", flat=True)
#             .order_by("-id")[:1]
#     )
#     # role = WorkspaceRole.objects.filter(id__in=workspace_user_rol_id)
#
#     projects = Project.objects.filter(Q(workspace_id=OuterRef("id")))
#
#     return (
#         Workspace.objects.filter(objects_with_member | Q(id__in=project_workspaces_ids))  # (1)  # (2)
#             .prefetch_related(Prefetch("projects", queryset=latest_user_projects, to_attr="latest_projects"))
#             # TODO: fix the count of variable (not use the ORM field)
#             .annotate(total_projects=Count("projects", queryset=all_user_projects))
#             .annotate(has_projects=Exists(projects))
#             .annotate(my_role=workspace_user_rol_id)
#         # TODO: add "myRol" object, not the id
#         # .order_by("-created_at")
#     )
