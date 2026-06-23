from uuid import UUID
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class OpportunityAttachmentResponse(BaseModel):
    id:             UUID
    opportunity_id: UUID
    filename:       str
    file_key:       str
    file_url:       str
    content_type:   str
    file_size:      Optional[int] = None
    uploaded_by:    Optional[UUID] = None
    created_at:     datetime

    model_config = ConfigDict(from_attributes=True)
