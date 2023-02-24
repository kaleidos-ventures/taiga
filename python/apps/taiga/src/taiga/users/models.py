# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import re
from typing import Iterable, TypeAlias, Union

from taiga.base.db import models, validators
from taiga.base.db.users import AbstractBaseUser, AnonymousUser, UserManager
from taiga.base.utils.colors import generate_random_color
from taiga.conf import settings

AnyUser: TypeAlias = Union[AnonymousUser, "User"]


def default_language() -> str:
    return settings.LANG


class User(models.BaseModel, AbstractBaseUser):
    username = models.LowerCharField(
        max_length=255,
        null=False,
        blank=False,
        unique=True,
        verbose_name="username",
        help_text="Required. 255 characters or fewer. Letters, numbers and /./-/_ characters",
        validators=[validators.RegexValidator(re.compile(r"^[\w.-]+$"), "Enter a valid username.", "invalid")],
    )
    email = models.LowerEmailField(max_length=255, null=False, blank=False, unique=True, verbose_name="email address")
    color = models.IntegerField(null=False, blank=True, default=generate_random_color, verbose_name="color")
    is_active = models.BooleanField(
        null=False,
        blank=True,
        default=False,
        verbose_name="active",
        help_text="Designates whether this user should be treated as active.",
    )
    is_superuser = models.BooleanField(
        null=False,
        blank=True,
        default=False,
        verbose_name="superuser status",
        help_text="Designates that this user has all permissions without " "explicitly assigning them.",
    )
    full_name = models.CharField(max_length=256, null=True, blank=True, verbose_name="full name")
    accepted_terms = models.BooleanField(null=False, blank=False, default=True, verbose_name="accepted terms")
    lang = models.CharField(max_length=20, null=False, blank=False, default=default_language, verbose_name="language")
    date_joined = models.DateTimeField(null=False, blank=False, auto_now_add=True, verbose_name="date joined")
    date_verification = models.DateTimeField(null=True, blank=True, default=None, verbose_name="date verification")

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = ["email"]

    objects = UserManager()

    class Meta:
        verbose_name = "user"
        verbose_name_plural = "users"
        indexes = [
            models.Index(fields=["username"]),
            models.Index(fields=["email"]),
        ]
        ordering = ["username"]

    def __str__(self) -> str:
        return self.get_full_name()

    def __repr__(self) -> str:
        return f"<User {self.username}>"

    def get_short_name(self) -> str:
        return self.username

    def get_full_name(self) -> str:
        return self.full_name or self.username

    @property
    def is_staff(self) -> bool:
        return self.is_superuser

    def has_perm(self, perm: str, obj: AnyUser | None = None) -> bool:
        return self.is_active and self.is_superuser

    def has_perms(self, perm_list: Iterable[str], obj: AnyUser | None = None) -> bool:
        return self.is_active and self.is_superuser

    def has_module_perms(self, app_label: str) -> bool:
        return self.is_active and self.is_superuser


class AuthData(models.BaseModel):
    user = models.ForeignKey("users.User", null=False, blank=False, related_name="auth_data", on_delete=models.CASCADE)
    key = models.LowerSlugField(max_length=50, null=False, blank=False, verbose_name="key")
    value = models.CharField(max_length=300, null=False, blank=False, verbose_name="value")
    extra = models.JSONField(null=True, blank=True, verbose_name="extra")

    class Meta:
        verbose_name = "user's auth data"
        verbose_name_plural = "user's auth data"
        constraints = [
            models.UniqueConstraint(fields=["user", "key"], name="%(app_label)s_%(class)s_unique_user_key"),
        ]
        indexes = [
            models.Index(fields=["user", "key"]),
        ]
        ordering = ["user", "key"]

    def __str__(self) -> str:
        return f"{self.key}: {self.value}"

    def __repr__(self) -> str:
        return f"<AuthData {self.user} {self.key}>"
