# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from taiga.projects.projects.models import Project


def collect_metrics() -> None:
    _update_users()
    _update_metrics()
    print("sefiní")


def _update_users() -> None:
    print(f"{Project.objects.count()}")
    # new activated_users
    # select activated_users.exclude(user_uuid__in=[Users.objects.all().values_list('id'])
    # save with activated=Today and active=True

    # active
    # users_to_update = []
    # users = select ids.exclude(activated=Today)
    # for user in users:
    #     if user.is_currently_active():
    #         users_to_update.append([user.id, True])
    #     else:
    #         users_to_update.append([user.id, False])

    # User.objects.bulk_update(users_to_update, values=[user_uuid, active])
    ...


def _update_metrics() -> None:
    # signups
    # what else
    ...
