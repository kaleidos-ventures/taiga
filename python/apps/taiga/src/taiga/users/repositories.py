# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Any

from asgiref.sync import sync_to_async
from django.contrib.auth.models import update_last_login as django_update_last_login
from django.db.models import Q
from taiga.base.utils.datetime import aware_utcnow
from taiga.tokens.models import OutstandingToken
from taiga.users.models import User


@sync_to_async
def get_first_user(**kwargs: Any) -> User | None:
    return User.objects.filter(**kwargs).first()


@sync_to_async
def user_exists(**kwargs: Any) -> bool:
    return User.objects.filter(**kwargs).exists()


@sync_to_async
def get_user_by_username_or_email(username_or_email: str) -> User | None:
    # first search is case insensitive
    qs = User.objects.filter(Q(username__iexact=username_or_email) | Q(email__iexact=username_or_email))

    if len(qs) > 1:
        # there are some users with thr same email or username,
        # the search should be case sensitive
        qs = qs.filter(Q(username=username_or_email) | Q(email=username_or_email))

    return qs[0] if len(qs) > 0 else None


@sync_to_async
def check_password(user: User, password: str) -> bool:
    return user.check_password(password)


@sync_to_async
def update_last_login(user: User) -> None:
    django_update_last_login(User, user)


@sync_to_async
def create_user(email: str, username: str, full_name: str, password: str) -> User:
    user = User.objects.create(
        email=email, username=username, full_name=full_name, is_active=False, accepted_terms=True
    )
    user.set_password(password)
    return user


@sync_to_async
def verify_user(user: User) -> None:
    user.is_active = True
    user.date_verification = aware_utcnow()
    user.save()


@sync_to_async
def update_user(user: User, new_values: Any) -> User:
    if "password" in new_values:
        user.set_password(new_values.pop("password"))

    for attr, value in new_values.items():
        setattr(user, attr, value)

    user.save()
    return user


@sync_to_async
def clean_expired_users() -> None:
    # delete all users that are not currently active (is_active=False)
    # and have never verified the account (date_verification=None)
    # and don't have an outstanding token associated (exclude)
    (
        User.objects.filter(is_system=False, is_active=False, date_verification=None)
        .exclude(id__in=OutstandingToken.objects.all().values_list("user_id"))
        .delete()
    )
