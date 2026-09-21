from pydantic import BaseModel
from typing import Any

class CommandReturn(BaseModel):
    id: int
    isSolid: bool
    command: str
    transport: str
    args: dict[str, Any] = {}

class Command(BaseModel):
    id: int
    command: str
    device_id: str
    args: dict[str, Any] = {}