import sqlalchemy as sa
from sqlalchemy.orm import relationship
from app.database.session import Base


class OpportunityStage(Base):
    __tablename__ = "opportunity_stages"

    id = sa.Column(sa.Integer, primary_key=True, autoincrement=True)
    name = sa.Column(sa.String, nullable=False)
    slug = sa.Column(sa.String, nullable=False)
    order = sa.Column(sa.Integer, nullable=False)
    color = sa.Column(sa.String, nullable=False, default="#6B7280")
    is_won = sa.Column(sa.Boolean, default=False, nullable=False)
    is_lost = sa.Column(sa.Boolean, default=False, nullable=False)
    is_active = sa.Column(sa.Boolean, default=True, nullable=False)
    pipeline_id = sa.Column(
        sa.Integer,
        sa.ForeignKey("pipelines.id", ondelete="RESTRICT"),
        nullable=False,
    )

    __table_args__ = (
        sa.UniqueConstraint("pipeline_id", "slug", name="uq_opportunity_stages_pipeline_slug"),
        sa.Index("idx_opportunity_stages_pipeline_id", "pipeline_id"),
    )

    pipeline = relationship("Pipeline")
