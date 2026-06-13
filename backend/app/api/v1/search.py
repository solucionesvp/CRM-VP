from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_

from app.database.session import get_db
from app.models.contact import Contact
from app.models.opportunity import Opportunity
from app.models.task import Task
from app.models.product_service import ProductService
from app.schemas.search import SearchResultResponse

router = APIRouter(prefix="/search", tags=["search"])

@router.get("/", response_model=SearchResultResponse)
def global_search(q: str = "", db: Session = Depends(get_db)):
    # Validate query query length
    if not q or len(q.strip()) < 2:
        return SearchResultResponse(contacts=[], opportunities=[], tasks=[], product_services=[])

    pattern = f"%{q.strip()}%"

    # 1. Search Contacts (by name, company_name, phone, whatsapp, email)
    contacts = (
        db.query(Contact)
        .filter(
            Contact.deleted_at.is_(None),
            or_(
                Contact.name.ilike(pattern),
                Contact.company_name.ilike(pattern),
                Contact.phone.ilike(pattern),
                Contact.whatsapp.ilike(pattern),
                Contact.email.ilike(pattern)
            )
        )
        .limit(10)
        .all()
    )

    # 2. Search Opportunities (by title, product_interest, contact name, contact company name, product_service name)
    opportunities = (
        db.query(Opportunity)
        .join(Contact, Opportunity.contact_id == Contact.id)
        .outerjoin(ProductService, Opportunity.product_service_id == ProductService.id)
        .options(joinedload(Opportunity.contact), joinedload(Opportunity.product_service))
        .filter(
            Opportunity.deleted_at.is_(None),
            or_(
                Opportunity.title.ilike(pattern),
                Opportunity.product_interest.ilike(pattern),
                Contact.name.ilike(pattern),
                Contact.company_name.ilike(pattern),
                ProductService.name.ilike(pattern)
            )
        )
        .limit(10)
        .all()
    )

    # 3. Search Tasks (by title, description, related contact name/company, related opportunity title)
    tasks = (
        db.query(Task)
        .outerjoin(Contact, Task.contact_id == Contact.id)
        .outerjoin(Opportunity, Task.opportunity_id == Opportunity.id)
        .options(
            joinedload(Task.contact),
            joinedload(Task.opportunity)
        )
        .filter(
            or_(
                Task.title.ilike(pattern),
                Task.description.ilike(pattern),
                Contact.name.ilike(pattern),
                Contact.company_name.ilike(pattern),
                Opportunity.title.ilike(pattern)
            )
        )
        .limit(10)
        .all()
    )

    # 4. Search Product Services (by name, sku, description)
    product_services = (
        db.query(ProductService)
        .filter(
            or_(
                ProductService.name.ilike(pattern),
                ProductService.sku.ilike(pattern),
                ProductService.description.ilike(pattern)
            )
        )
        .limit(10)
        .all()
    )

    # Transform results to schema structure
    contacts_res = []
    for c in contacts:
        contacts_res.append({
            "id": c.id,
            "name": c.name,
            "company_name": c.company_name,
            "type": c.type,
            "phone": c.phone,
            "whatsapp": c.whatsapp,
            "email": c.email,
            "tags": c.tags or []
        })

    opps_res = []
    for o in opportunities:
        opps_res.append({
            "id": o.id,
            "title": o.title,
            "product_interest": o.product_service.name if o.product_service else o.product_interest,
            "status": o.status,
            "contact_id": o.contact_id,
            "contact_name": o.contact.name if o.contact else "Sin contacto",
            "contact_company_name": o.contact.company_name if o.contact else None
        })

    tasks_res = []
    for t in tasks:
        tasks_res.append({
            "id": t.id,
            "title": t.title,
            "task_type": t.task_type,
            "status": t.status,
            "due_date": t.due_date,
            "contact_id": t.contact_id,
            "contact_name": t.contact.name if t.contact else None,
            "opportunity_id": t.opportunity_id,
            "opportunity_title": t.opportunity.title if t.opportunity else None
        })

    ps_res = []
    for ps in product_services:
        ps_res.append({
            "id": ps.id,
            "name": ps.name,
            "sku": ps.sku,
            "type": ps.type,
            "is_active": ps.is_active
        })

    return SearchResultResponse(
        contacts=contacts_res,
        opportunities=opps_res,
        tasks=tasks_res,
        product_services=ps_res
    )
