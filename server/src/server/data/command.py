from pydantic import BaseModel
from typing import Any

class Command(BaseModel):
    id: int
    device_id: str
    isSolid: bool
    command: str
    args: dict[str, Any] = {}