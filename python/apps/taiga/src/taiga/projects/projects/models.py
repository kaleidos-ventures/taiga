# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import functools
from typing import Any

from slugify import slugify
from taiga.base.db import models
from taiga.base.db.mixins import CreatedMetaInfoMixin, ModifiedAtMetaInfoMixin
from taiga.base.utils.files import get_obfuscated_file_path
from taiga.base.utils.slug import slugify_uniquely
from taiga.base.utils.uuid import encode_uuid_to_b64str
from taiga.permissions.choices import ProjectPermissions
from taiga.projects import references

get_project_logo_file_path = functools.partial(get_obfuscated_file_path, base_path="project")


class Project(models.BaseModel, CreatedMetaInfoMixin, ModifiedAtMetaInfoMixin):
    name = models.CharField(max_length=80, null=False, blank=False, verbose_name="name")
    description = models.CharField(max_length=220, null=True, blank=True, verbose_name="description")
    color = models.IntegerField(default=1, null=False, blank=True, verbose_name="color")
    logo = models.FileField(
        upload_to=get_project_logo_file_path, max_length=500, null=True, blank=True, verbose_name="logo"
    )

    workspace = models.ForeignKey(
        "workspaces.Workspace",
        null=False,
        blank=False,
        related_name="projects",
        on_delete=models.SET_NULL,
        verbose_name="workspace",
    )

    members = models.ManyToManyField(
        "users.User",
        related_name="projects",
        through="projects_memberships.ProjectMembership",
        through_fields=("project", "user"),
        verbose_name="members",
    )

    public_permissions = models.ArrayField(
        models.TextField(null=False, blank=False, choices=ProjectPermissions.choices),
        null=True,
        blank=True,
        default=list,
        verbose_name="public permissions",
    )

    class Meta:
        verbose_name = "project"
        verbose_name_plural = "projects"
        indexes = [
            models.Index(fields=["workspace", "id"]),
        ]
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name

    def __repr__(self) -> str:
        return f"<Project {self.name}>"

    @property
    def slug(self) -> str:
        return slugify(self.name)

    @functools.cached_property
    def b64id(self) -> str:
        return encode_uuid_to_b64str(self.id)

    @property
    def public_user_can_view(self) -> bool:
        """
        Any registered user can view the project
        """
        return bool(self.public_permissions)

    @property
    def anon_user_can_view(self) -> bool:
        """
        Any unregistered/anonymous user can view the project
        """
        return bool(self.anon_permissions)

    @property
    def anon_permissions(self) -> list[str]:
        return list(filter(lambda x: x.startswith("view_"), self.public_permissions or []))

    def save(self, *args: Any, **kwargs: Any) -> None:
        super().save(*args, **kwargs)

        references.create_project_references_sequence(project_id=self.id)


class ProjectTemplate(models.BaseModel):
    name = models.CharField(max_length=250, null=False, blank=False, verbose_name="name")
    slug = models.LowerSlugField(max_length=250, null=False, blank=True, unique=True, verbose_name="slug")
    roles = models.JSONField(null=True, blank=True, verbose_name="roles")
    workflows = models.JSONField(null=True, blank=True, verbose_name="workflows")

    class Meta:
        verbose_name = "project template"
        verbose_name_plural = "project templates"
        indexes = [
            models.Index(fields=["slug"]),
        ]
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name

    def __repr__(self) -> str:
        return f"<Project Template: {self.name}>"

    def save(self, *args: Any, **kwargs: Any) -> None:
        if not self.slug:
            self.slug = slugify_uniquely(value=self.name, model=self.__class__)
        super().save(*args, **kwargs)
