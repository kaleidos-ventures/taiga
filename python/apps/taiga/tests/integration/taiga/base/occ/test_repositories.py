# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import pytest
from taiga.base.occ import repositories
from tests.samples.occ.models import SampleOCCItem

pytestmark = pytest.mark.django_db(transaction=True)


async def test_update_success() -> None:
    name = "item"
    name_new = "item updated"

    item = await SampleOCCItem.objects.acreate(name=name)
    values = {"name": name_new}

    assert await repositories.update(
        model_class=SampleOCCItem,
        id=item.id,
        current_version=item.version,
        values=values,
    )

    item = await SampleOCCItem.objects.aget(id=item.id)
    assert item.name == name_new
    assert item.version == 2


async def test_update_success_without_version() -> None:
    name = "item"
    name_new = "item updated"

    item = await SampleOCCItem.objects.acreate(name=name)
    values = {"name": name_new}

    assert await repositories.update(
        model_class=SampleOCCItem,
        id=item.id,
        values=values,
    )

    item = await SampleOCCItem.objects.aget(id=item.id)
    assert item.name == name_new
    assert item.version == 2


async def test_update_success_with_invalid_version() -> None:
    name = "item"
    name_new = "item updated"

    item = await SampleOCCItem.objects.acreate(name=name)
    values = {"name": name_new}

    assert await repositories.update(
        model_class=SampleOCCItem,
        id=item.id,
        current_version=item.version - 1,
        values=values,
    )

    item = await SampleOCCItem.objects.aget(id=item.id)
    assert item.name == name_new
    assert item.version == 2


async def test_update_success_with_protected_attrs() -> None:
    name = "item"
    name_new = "item updated"
    new_description = "item description updated"

    item = await SampleOCCItem.objects.acreate(name=name)
    values = {"name": name_new, "description": new_description}

    assert await repositories.update(
        model_class=SampleOCCItem,
        id=item.id,
        current_version=item.version,
        values=values,
        protected_attrs=["description"],
    )

    item = await SampleOCCItem.objects.aget(id=item.id)
    assert item.name == name_new
    assert item.version == 2


async def test_update_error_without_changes() -> None:
    name = "item"

    item = await SampleOCCItem.objects.acreate(name=name)
    values = {}

    assert not await repositories.update(
        model_class=SampleOCCItem,
        id=item.id,
        current_version=item.version,
        values=values,
    )

    item = await SampleOCCItem.objects.aget(id=item.id)
    assert item.name == name
    assert item.version == 1


async def test_update_error_without_version_when_is_needed() -> None:
    name = "item"
    name_new = "item updated"

    item = await SampleOCCItem.objects.acreate(name=name)
    values = {"name": name_new}

    assert not await repositories.update(
        model_class=SampleOCCItem,
        id=item.id,
        values=values,
        protected_attrs=["name"],
    )

    item = await SampleOCCItem.objects.aget(id=item.id)
    assert item.name == name
    assert item.version == 1


async def test_update_error_with_protected_attrs_and_worng_version() -> None:
    name = "item"
    name_new = "item updated"

    item = await SampleOCCItem.objects.acreate(name=name)
    values = {"name": name_new}

    assert not await repositories.update(
        model_class=SampleOCCItem,
        id=item.id,
        values=values,
        current_version=item.version + 1,
        protected_attrs=["name"],
    )

    item = await SampleOCCItem.objects.aget(id=item.id)
    assert item.name == name
    assert item.version == 1


async def test_update_error_concurrency_example() -> None:
    name = "item"
    name_new_a = "item updated a"
    name_new_b = "item updated b"

    item_a = await SampleOCCItem.objects.acreate(name=name)
    item_b = await SampleOCCItem.objects.aget(id=item_a.id)

    assert item_a.version == item_b.version == 1

    values_a = {"name": name_new_a}
    values_b = {"name": name_new_b}

    assert await repositories.update(
        model_class=SampleOCCItem,
        id=item_a.id,
        values=values_a,
        current_version=item_a.version,
        protected_attrs=["name"],
    )
    assert not await repositories.update(
        model_class=SampleOCCItem,
        id=item_b.id,
        values=values_b,
        current_version=item_b.version,
        protected_attrs=["name"],
    )

    item = await SampleOCCItem.objects.aget(id=item_a.id)
    assert item.name == name_new_a
    assert item.version == 2
