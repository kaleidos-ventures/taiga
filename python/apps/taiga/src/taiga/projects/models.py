# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import functools
from typing import Any

from taiga.base.db import models
from taiga.base.utils.datetime import timestamp_mics
from taiga.base.utils.files import get_file_path
from taiga.base.utils.slug import slugify_uniquely
from taiga.permissions.choices import AnonPermissions, ProjectPermissions

get_project_logo_file_path = functools.partial(get_file_path, base_path="project")


class ProjectRole(models.BaseModel):
    name = models.CharField(max_length=200, null=False, blank=False, verbose_name="name")
    slug = models.LowerSlugField(max_length=250, null=False, blank=True, verbose_name="slug")
    permissions = models.ArrayField(
        models.TextField(null=False, blank=False, choices=ProjectPermissions.choices),
        null=True,
        blank=True,
        default=list,
        verbose_name="permissions",
    )
    order = models.BigIntegerField(default=timestamp_mics, null=False, blank=False, verbose_name="order")
    is_admin = models.BooleanField(null=False, blank=False, default=False, verbose_name="is_admin")
    project = models.ForeignKey(
        "projects.Project",
        null=False,
        blank=False,
        related_name="roles",
        on_delete=models.CASCADE,
        verbose_name="project",
    )

    class Meta:
        verbose_name = "project role"
        verbose_name_plural = "project roles"
        ordering = ["project", "order", "slug"]
        unique_together = (("slug", "project"),)

    def __str__(self) -> str:
        return self.name

    def __repr__(self) -> str:
        return f"<ProjectRole {self.project} {self.slug}>"

    def save(self, *args: Any, **kwargs: Any) -> None:
        if not self.slug:
            self.slug = slugify_uniquely(self.name, self.__class__)

        super().save(*args, **kwargs)


class ProjectMembership(models.BaseModel):
    user = models.ForeignKey(
        "users.User",
        null=False,
        blank=False,
        related_name="project_memberships",
        on_delete=models.CASCADE,
        verbose_name="user",
    )
    project = models.ForeignKey(
        "projects.Project",
        null=False,
        blank=False,
        related_name="memberships",
        on_delete=models.CASCADE,
        verbose_name="project",
    )
    role = models.ForeignKey(
        "projects.ProjectRole",
        null=False,
        blank=False,
        related_name="memberships",
        on_delete=models.CASCADE,
        verbose_name="role",
    )
    created_at = models.DateTimeField(null=False, blank=False, auto_now_add=True, verbose_name="created at")

    class Meta:
        verbose_name = "project membership"
        verbose_name_plural = "project memberships"
        unique_together = (
            "user",
            "project",
        )
        ordering = ["project", "user"]

    def __str__(self) -> str:
        return f"{self.project} - {self.user}"

    def __repr__(self) -> str:
        return f"<ProjectMembership {self.project} {self.user}>"


class Project(models.BaseModel):
    name = models.CharField(max_length=80, null=False, blank=False, verbose_name="name")
    slug = models.LowerSlugField(max_length=250, unique=True, null=False, blank=True, verbose_name="slug")
    description = models.CharField(max_length=220, null=True, blank=True, verbose_name="description")
    color = models.IntegerField(default=1, null=False, blank=True, verbose_name="color")
    logo = models.FileField(
        upload_to=get_project_logo_file_path, max_length=500, null=True, blank=True, verbose_name="logo"
    )

    created_at = models.DateTimeField(null=False, blank=False, auto_now_add=True, verbose_name="created at")
    modified_at = models.DateTimeField(null=False, blank=False, auto_now=True, verbose_name="modified at")

    workspace = models.ForeignKey(
        "workspaces.Workspace",
        null=False,
        blank=False,
        related_name="projects",
        on_delete=models.SET_NULL,
        verbose_name="workspace",
    )

    owner = models.ForeignKey(
        "users.User",
        null=False,
        blank=False,
        related_name="owned_projects",
        on_delete=models.SET_NULL,
        verbose_name="owner",
    )

    members = models.ManyToManyField(
        "users.User",
        related_name="projects",
        through="projects.ProjectMembership",
        through_fields=("project", "user"),
        verbose_name="members",
    )

    anon_permissions = models.ArrayField(
        models.TextField(null=False, blank=False, choices=AnonPermissions.choices),
        null=True,
        blank=True,
        default=list,
        verbose_name="anonymous permissions",
    )
    public_permissions = models.ArrayField(
        models.TextField(null=False, blank=False, choices=ProjectPermissions.choices),
        null=True,
        blank=True,
        default=list,
        verbose_name="public permissions",
    )
    workspace_member_permissions = models.ArrayField(
        models.TextField(null=False, blank=False, choices=ProjectPermissions.choices),
        null=True,
        blank=True,
        default=list,
        verbose_name="workspace member permissions",
    )

    class Meta:
        verbose_name = "project"
        verbose_name_plural = "projects"
        ordering = ["workspace", "slug"]
        # TODO refacxtor https://docs.djangoproject.com/en/4.0/ref/models/options/#indexes
        index_together = [
            ["name", "id"],
        ]

    def __str__(self) -> str:
        return self.name

    def __repr__(self) -> str:
        return f"<Project {self.slug}>"

    @property
    def is_public(self) -> bool:
        """
        Any registered user can view the project
        """
        return bool(self.public_permissions)

    @property
    def is_anon(self) -> bool:
        """
        Any unregistered/anonymous user can view the project
        """
        return bool(self.anon_permissions)

    def save(self, *args: Any, **kwargs: Any) -> None:
        if not self.slug:
            self.slug = slugify_uniquely(self.name, self.__class__)

        super().save(*args, **kwargs)


class ProjectTemplate(models.BaseModel):
    name = models.CharField(max_length=250, null=False, blank=False, verbose_name="name")
    slug = models.LowerSlugField(max_length=250, null=False, blank=True, unique=True, verbose_name="slug")
    created_at = models.DateTimeField(null=False, blank=False, auto_now_add=True, verbose_name="created at")
    modified_at = models.DateTimeField(null=False, blank=False, auto_now=True, verbose_name="modified at")
    default_owner_role = models.CharField(max_length=50, null=False, blank=False, verbose_name="default owner's role")
    roles = models.JSONField(null=True, blank=True, verbose_name="roles")
    workflows = models.JSONField(null=True, blank=True, verbose_name="workflows")

    class Meta:
        verbose_name = "project template"
        verbose_name_plural = "project templates"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name

    def __repr__(self) -> str:
        return f"<Project Template: {self.name}>"

    def save(self, *args: Any, **kwargs: Any) -> None:
        if not self.slug:
            self.slug = slugify_uniquely(self.name, self.__class__)
        super().save(*args, **kwargs)
