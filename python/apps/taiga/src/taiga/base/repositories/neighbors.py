# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL


from typing import Generic, TypeVar

from asgiref.sync import sync_to_async
from django.core.exceptions import EmptyResultSet, ObjectDoesNotExist
from django.db import connection
from taiga.base.db.models import BaseModel, QuerySet

T = TypeVar("T", bound=BaseModel)


class Neighbor(Generic[T]):
    prev: T | None
    next: T | None

    def __init__(self, prev: T | None = None, next: T | None = None) -> None:
        self.next = next
        self.prev = prev


def get_neighbors_sync(obj: T, model_queryset: QuerySet[T] | None = None) -> Neighbor[T]:
    """Get the neighbors of a model instance.

    The neighbors are the objects that are at the left/right of `obj` that also fulfill the queryset.

    :param obj: The object model you want to know its neighbors.
    :param model_queryset: Additional model constraints to be applied to the default queryset.

    :return: Neighbor class object with the previous and next model objects (if any).
    """
    if model_queryset is None:
        model_queryset = type(obj).objects.get_queryset()

    try:
        base_sql, base_params = model_queryset.query.sql_with_params()
    except EmptyResultSet:
        return Neighbor(prev=None, next=None)

    query = """
        SELECT * FROM
                (SELECT "id",
                    ROW_NUMBER() OVER(),
                    LAG("id", 1) OVER() AS prev,
                    LEAD("id", 1) OVER() AS next
                FROM (%s) as ID_AND_ROW)
        AS SELECTED_ID_AND_ROW
        """ % (
        base_sql
    )
    query += " WHERE id=%s;"
    params = list(base_params) + [obj.id]

    cursor = connection.cursor()
    cursor.execute(query, params)
    sql_row_result = cursor.fetchone()

    if sql_row_result is None:
        return Neighbor(prev=None, next=None)

    prev_object_id = sql_row_result[2]
    next_object_id = sql_row_result[3]

    try:
        prev = model_queryset.get(id=prev_object_id)
    except ObjectDoesNotExist:
        prev = None

    try:
        next = model_queryset.get(id=next_object_id)
    except ObjectDoesNotExist:
        next = None

    return Neighbor(prev=prev, next=next)


get_neighbors = sync_to_async(get_neighbors_sync)
