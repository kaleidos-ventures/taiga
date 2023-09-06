# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from datetime import timedelta
from uuid import uuid1

import pytest
from asgiref.sync import sync_to_async
from taiga.base.utils.datetime import aware_utcnow
from taiga.commons.storage import repositories
from tests.utils import factories as f

pytestmark = pytest.mark.django_db(transaction=True)


#############################################################
# create_storaged_objects
#############################################################


async def test_create_storaged_object():
    file = f.build_image_file(name="test")

    storaged_object = await repositories.create_storaged_object(
        file=file,
    )

    assert storaged_object.id
    assert len(await repositories.list_storaged_objects(filters={"id": storaged_object.id})) == 1


##########################################################
# list_storaged_objects
##########################################################


async def test_list_storage_objects():
    storaged_object1 = await f.create_storaged_object()
    storaged_object2 = await f.create_storaged_object(deleted_at=aware_utcnow() - timedelta(days=3))

    assert await repositories.list_storaged_objects() == [
        storaged_object2,
        storaged_object1,
    ]


async def test_list_storage_objects_filters_by_id():
    storaged_object1 = await f.create_storaged_object()
    await f.create_storaged_object(deleted_at=aware_utcnow() - timedelta(days=3))

    assert await repositories.list_storaged_objects(filters={"id": uuid1()}) == []
    assert await repositories.list_storaged_objects(filters={"id": storaged_object1.id}) == [storaged_object1]


async def test_list_storage_objects_filters_by_deleted_datetime():
    await f.create_storaged_object()
    storaged_object2 = await f.create_storaged_object(deleted_at=aware_utcnow() - timedelta(days=3))

    assert (
        await repositories.list_storaged_objects(filters={"deleted_before": aware_utcnow() - timedelta(days=4)}) == []
    )
    assert await repositories.list_storaged_objects(filters={"deleted_before": aware_utcnow() - timedelta(days=2)}) == [
        storaged_object2
    ]


##########################################################
# delete_storaged_object
##########################################################


async def test_delete_storaged_object():
    storaged_object = await f.create_storaged_object()
    file_path = storaged_object.file.path
    storage = storaged_object.file.storage

    assert len(await repositories.list_storaged_objects()) == 1
    assert storage.exists(file_path)

    await repositories.delete_storaged_object(storaged_object=storaged_object)

    assert len(await repositories.list_storaged_objects()) == 0
    assert not storage.exists(file_path)


async def test_delete_storaged_object_that_has_been_used():
    storaged_object = await f.create_storaged_object()
    file_path = storaged_object.file.path
    storage = storaged_object.file.storage

    story = await f.create_story()
    await f.create_attachment(content_object=story, file=storaged_object)

    assert len(await repositories.list_storaged_objects()) == 1
    assert storage.exists(file_path)

    assert not await repositories.delete_storaged_object(storaged_object=storaged_object)

    assert len(await repositories.list_storaged_objects()) == 1
    assert storage.exists(file_path)


##########################################################
# mark_storaged_object_as_deleted
##########################################################


async def test_mark_storaged_object_as_deleted():
    storaged_object = await f.create_storaged_object()

    assert not storaged_object.deleted_at
    await sync_to_async(repositories.mark_storaged_object_as_deleted)(storaged_object=storaged_object)
    assert storaged_object.deleted_at
