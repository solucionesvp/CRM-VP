from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.pipeline import Pipeline
from app.models.opportunity import Opportunity
from app.models.enums import OpportunityStatus
from app.schemas.opportunity import PipelineCreate, PipelineUpdate, PipelineResponse

router = APIRouter(prefix="/pipelines", tags=["pipelines"])


@router.get("/", response_model=List[PipelineResponse], status_code=status.HTTP_200_OK)
def list_pipelines(db: Session = Depends(get_db)):
    return (
        db.query(Pipeline)
        .filter(Pipeline.is_active.is_(True))
        .order_by(Pipeline.order)
        .all()
    )


@router.post("/", response_model=PipelineResponse, status_code=status.HTTP_201_CREATED)
def create_pipeline(data: PipelineCreate, db: Session = Depends(get_db)):
    # Validate uniqueness of name and slug
    existing_name = db.query(Pipeline).filter(Pipeline.name == data.name).first()
    if existing_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe un pipeline con el nombre '{data.name}'",
        )
    existing_slug = db.query(Pipeline).filter(Pipeline.slug == data.slug).first()
    if existing_slug:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe un pipeline con el slug '{data.slug}'",
        )

    pipeline = Pipeline(
        name=data.name,
        slug=data.slug,
        description=data.description,
        order=data.order,
        is_active=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(pipeline)
    db.commit()
    db.refresh(pipeline)
    return pipeline


@router.patch("/{pipeline_id}", response_model=PipelineResponse, status_code=status.HTTP_200_OK)
def update_pipeline(pipeline_id: int, data: PipelineUpdate, db: Session = Depends(get_db)):
    pipeline = db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
    if not pipeline:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pipeline no encontrado",
        )

    updates = data.model_dump(exclude_unset=True)

    # Uniqueness check only for supplied fields
    if "name" in updates:
        dup = (
            db.query(Pipeline)
            .filter(Pipeline.name == updates["name"], Pipeline.id != pipeline_id)
            .first()
        )
        if dup:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ya existe un pipeline con el nombre '{updates['name']}'",
            )
    if "slug" in updates:
        dup = (
            db.query(Pipeline)
            .filter(Pipeline.slug == updates["slug"], Pipeline.id != pipeline_id)
            .first()
        )
        if dup:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ya existe un pipeline con el slug '{updates['slug']}'",
            )

    for field, value in updates.items():
        setattr(pipeline, field, value)
    pipeline.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(pipeline)
    return pipeline


@router.delete("/{pipeline_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pipeline(pipeline_id: int, db: Session = Depends(get_db)):
    pipeline = db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
    if not pipeline:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pipeline no encontrado",
        )

    # Block deactivation if there are active opportunities in this pipeline
    active_opps = (
        db.query(Opportunity)
        .filter(
            Opportunity.pipeline_id == pipeline_id,
            Opportunity.status == OpportunityStatus.active,
            Opportunity.deleted_at.is_(None),
        )
        .count()
    )
    if active_opps > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede desactivar un pipeline con oportunidades activas",
        )

    pipeline.is_active = False
    pipeline.updated_at = datetime.utcnow()
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
