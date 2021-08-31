# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Any, Dict, Optional

from django.contrib.auth.models import update_last_login as django_update_last_login
from django.db.models import Q
from taiga.models.users import User


def get_first_user(**kwargs: Dict[str, Any]) -> Optional[User]:
    return User.objects.filter(**kwargs).first()


def get_user_by_username_or_email(username_or_email: str) -> Optional[User]:
    # first search is case insensitive
    qs = User.objects.filter(Q(username__iexact=username_or_email) | Q(email__iexact=username_or_email))

    if len(qs) > 1:
        # there are some users with thr same email or username,
        # the search should be case sensitive
        qs = qs.filter(Q(username=username_or_email) | Q(email=username_or_email))

    user: Optional[User] = qs[0] if len(qs) > 0 else None
    return user


def update_last_login(user: User) -> None:
    django_update_last_login(User, user)
