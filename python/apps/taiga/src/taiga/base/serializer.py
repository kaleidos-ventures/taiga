from typing import TYPE_CHECKING, Any, Iterable, List, Type, TypeVar

from humps import camelize
from pydantic import BaseModel as _BaseModel

if TYPE_CHECKING:
    Model = TypeVar("Model", bound="BaseModel")


class BaseModel(_BaseModel):
    class Config:
        alias_generator = camelize
        allow_population_by_field_name = True

    @classmethod
    def from_queryset(cls: Type["Model"], qs: Iterable[Any]) -> List["Model"]:
        return [super(BaseModel, cls).from_orm(obj) for obj in qs]
