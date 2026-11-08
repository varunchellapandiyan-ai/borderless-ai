from fastapi import APIRouter
from app.schemas import ExportReadinessOut
from app.services.export_readiness import export_readiness_service

router = APIRouter(prefix="/api/readiness", tags=["Export Readiness Checklist"])

@router.get("", response_model=ExportReadinessOut)
def get_export_readiness(seller_id: str = "sel_kaveri_01"):
    """
    Returns statutory and operational export readiness parameters (IEC, GSTIN, AD Code,
    EU REX origin rules, REACH guidelines) with official government portal references.
    """
    return export_readiness_service.get_readiness_checklist(seller_id)
