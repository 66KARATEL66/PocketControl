from typing import Any, Literal

from pydantic import BaseModel, Field


class CommandDefinition(BaseModel):
    id: int
    command: str
    transport: Literal["http", "websocket"]
    isSolid: bool
    args: dict[str, Any] = Field(default_factory=dict)


class CommandRequest(BaseModel):
    command: str
    device_id: str
    args: dict[str, Any] = Field(default_factory=dict)
