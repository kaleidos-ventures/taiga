# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from collections.abc import Iterable
from itertools import chain
from typing import Optional

from asgiref.sync import sync_to_async
from django.db.models import BooleanField, CharField, IntegerField, Prefetch, Q, Value
from taiga.projects.models import Project
from taiga.users.models import User
from taiga.workspaces.models import Workspace


@sync_to_async
def get_user_workspaces_with_latest_projects(user: User) -> Iterable[Workspace]:
    # workspaces where the user is ws-admin with all its projects
    admin_ws_ids = list(
        Workspace.objects.filter(
            workspace_memberships__user__id=user.id,  # user_is_ws_member
            workspace_memberships__workspace_role__is_admin=True,  # user_ws_role_is_admin
        )
        .order_by("-created_date")
        .values_list("id", flat=True)
    )
    admin_ws = Workspace.objects.none()
    for ws_id in admin_ws_ids:
        projects_ids = list(
            Project.objects.filter(workspace_id=ws_id)  # pj_in_workspace
            .order_by("-created_date")
            .values_list("id", flat=True)
        )
        total_projects = len(projects_ids)
        projects_qs = Project.objects.filter(id__in=projects_ids[:6])
        has_projects = Workspace.objects.get(id=ws_id).projects.count() > 0
        is_owner = Workspace.objects.get(id=ws_id).owner.id == user.id
        qs = (
            Workspace.objects.filter(id=ws_id)
            .prefetch_related(Prefetch("projects", queryset=projects_qs, to_attr="latest_projects"))
            .annotate(total_projects=Value(total_projects, output_field=IntegerField()))
            .annotate(has_projects=Value(has_projects, output_field=BooleanField()))
            .annotate(my_role=Value("admin", output_field=CharField()))
            .annotate(is_owner=Value(is_owner, output_field=BooleanField()))
        )
        admin_ws = chain(admin_ws, qs)

    # workspaces where the user is ws-member with all its visible projects
    member_ws_ids = list(
        Workspace.objects.filter(
            workspace_memberships__user__id=user.id,  # user_is_ws_member
            workspace_memberships__workspace_role__is_admin=False,  # user_ws_role_is_member
        )
        .order_by("-created_date")
        .values_list("id", flat=True)
    )
    member_ws = Workspace.objects.none()
    for ws_id in member_ws_ids:
        pj_in_workspace = Q(workspace_id=ws_id)
        ws_allowed = ~Q(memberships__user__id=user.id) & Q(workspace_member_permissions__len__gt=0)
        pj_allowed = Q(memberships__user__id=user.id) & Q(memberships__role__permissions__len__gt=0)
        projects_ids = list(
            Project.objects.filter(pj_in_workspace, (ws_allowed | pj_allowed))
            .order_by("-created_date")
            .values_list("id", flat=True)
        )
        total_projects = len(projects_ids)
        projects_qs = Project.objects.filter(id__in=projects_ids[:6])
        has_projects = Workspace.objects.get(id=ws_id).projects.count() > 0
        qs = (
            Workspace.objects.filter(id=ws_id)
            .prefetch_related(Prefetch("projects", queryset=projects_qs, to_attr="latest_projects"))
            .annotate(total_projects=Value(total_projects, output_field=IntegerField()))
            .annotate(has_projects=Value(has_projects, output_field=BooleanField()))
            .annotate(my_role=Value("member", output_field=CharField()))
            .annotate(is_owner=Value(False, output_field=BooleanField()))
        )
        member_ws = chain(member_ws, qs)

    # workspaces where the user is ws-guest with all its visible projects
    guest_ws_ids = list(
        Project.objects.filter(
            memberships__user__id=user.id,  # user_pj_member
            memberships__role__permissions__len__gt=0,  # _with_access,
        )
        .exclude(workspace__workspace_memberships__user__id=user.id)  # user_not_ws_member
        .order_by("workspace_id")
        .distinct("workspace_id")
        .values_list("workspace_id", flat=True)
    )

    guest_ws = Workspace.objects.none()
    for ws_id in guest_ws_ids:
        projects_ids = list(
            Project.objects.filter(
                workspace_id=ws_id,  # pj_in_workspace,
                memberships__user__id=user.id,  # user_pj_member
                memberships__role__permissions__len__gt=0,  # _with_access
            )
            .order_by("-created_date")
            .values_list("id", flat=True)
        )
        total_projects = len(projects_ids)
        projects_qs = Project.objects.filter(id__in=projects_ids[:6])
        has_projects = Workspace.objects.get(id=ws_id).projects.count() > 0
        qs = (
            Workspace.objects.filter(id=ws_id)
            .prefetch_related(Prefetch("projects", queryset=projects_qs, to_attr="latest_projects"))
            .annotate(total_projects=Value(total_projects, output_field=IntegerField()))
            .annotate(has_projects=Value(has_projects, output_field=BooleanField()))
            .annotate(my_role=Value("guest", output_field=CharField()))
            .annotate(is_owner=Value(False, output_field=BooleanField()))
        )
        guest_ws = chain(guest_ws, qs)

    result = list(chain(admin_ws, member_ws, guest_ws))
    return result


@sync_to_async
def create_workspace(name: str, color: int, owner: User) -> Workspace:
    return Workspace.objects.create(name=name, color=color, owner=owner)


@sync_to_async
def get_workspace(slug: str) -> Optional[Workspace]:
    try:
        return Workspace.objects.get(slug=slug)
    except Workspace.DoesNotExist:
        return None


# # DRAFT: This is a not-working attempt to solve the problematic using just one query
#
# from django.db.models import Count, OuterRef, Subquery
#
# def get_user_workspaces_with_latest_projects(user: User) -> Iterable[Workspace]:
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
#     projects_with_ws_role_admin = Q(workspace__workspace_memberships__workspace_role__is_admin=True)
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
#                 Q(workspace__workspace_memberships__workspace_role__is_admin=True)
#             ).filter(
#                 # workspaces the user is a ws-member (not-pj-member) (just if user has ws-permissions)
#                 Q(workspace_id=OuterRef("workspace_id")) &
#                 Q(workspace__members__id=user.id) &
#                 Q(workspace__workspace_memberships__workspace_role__is_admin=False) &
#                 ((Q(members__id=user.id) &
#                   Q(workspace__workspace_memberships__workspace_role__permissions__len__gt=0))
#                  |( ~Q(members__id=user.id) & Q(workspace_member_permissions__len__gt=0)))
#             ).filter(  # workspaces the user is not ws-member but a pj-member (just if user has pj-permissions)
#                 Q(workspace_id=OuterRef("workspace_id")) &
#                 ~Q(workspace__members__id=user.id) &
#                 Q(members__id=user.id) &
#                 Q(memberships__role__permissions__len__gt=0))
#         )
#             .values_list("id", flat=True)
#             .order_by("-created_date")[:6]
#     )
#
#     latest_user_projects = Project.objects.filter(id__in=latest_user_projects_ids).order_by("-created_date")
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
#             .values_list("workspace_role__id", flat=True)
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
#         # .order_by("-created_date")
#     )
