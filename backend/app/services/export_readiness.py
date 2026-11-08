from typing import List, Dict, Any
from app.database import get_db_connection
from app.schemas import ExportReadinessOut, ExportReadinessItem

class ExportReadinessService:
    def get_readiness_checklist(self, seller_id: str) -> ExportReadinessOut:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM seller_profiles WHERE id = ?", (seller_id,))
        seller = cursor.fetchone()
        conn.close()

        has_iec = bool(seller and seller["iec_number"])
        has_gstin = bool(seller and seller["gstin"])
        has_pan = bool(seller and seller["pan"])
        has_ad_code = bool(seller and seller["ad_code"])

        items = [
            ExportReadinessItem(
                code="GOV-IEC",
                category="Statutory Registration",
                title="Importer-Exporter Code (IEC)",
                description=f"Mandatory 10-digit DGFT business identification number for international trade shipments. Status: {seller['iec_number'] if has_iec else 'Pending Application'}.",
                status="verified" if has_iec else "pending",
                source_reference="DGFT Policy Circular & Trade Notice (dgft.gov.in)",
                official_portal_url="https://dgft.gov.in/CP/",
                importance="Critical blocker for customs shipping bill generation"
            ),
            ExportReadinessItem(
                code="GOV-GSTIN",
                category="Taxation & Invoicing",
                title="GSTIN with LUT (Letter of Undertaking)",
                description=f"Permits zero-rated export of craft textiles without upfront IGST payment. Status: {seller['gstin'] if has_gstin else 'Pending LUT filing'}.",
                status="verified" if has_gstin else "pending",
                source_reference="CBIC GST Portal / Form GST RFD-11",
                official_portal_url="https://www.gst.gov.in/",
                importance="Eliminates 12% working capital lockup on export turnover"
            ),
            ExportReadinessItem(
                code="FIN-ADCODE",
                category="Foreign Exchange Settlement",
                title="Authorized Dealer (AD) Code Registration",
                description=f"Bank-issued 7-digit code registered at customs port of export (Chennai Port / Chennai Air Cargo) for EDPMS inward remittance monitoring. Status: {seller['ad_code'] if has_ad_code else 'Pending Port Registration'}.",
                status="verified" if has_ad_code else "pending",
                source_reference="ICEGATE Customs Single Window / RBI EDPMS Guidelines",
                official_portal_url="https://www.icegate.gov.in/",
                importance="Required for automatic issuance of Bank Realisation Certificates (e-BRC)"
            ),
            ExportReadinessItem(
                code="TRADE-HS",
                category="Product Classification",
                title="ITC-HS Tariff Classification: 6304.92.00",
                description="Export classification for cotton cushion covers and home furnishings. Eligible for RoDTEP export remission benefits (2.5% rebate on FOB value).",
                status="verified",
                source_reference="CBIC Customs Tariff Schedule & DGFT RoDTEP Appendix 4R",
                official_portal_url="https://www.cbic.gov.in/",
                importance="Prevents customs misclassification penalties and delays at port"
            ),
            ExportReadinessItem(
                code="COMP-REX",
                category="Origin & Trade Agreements",
                title="EU REX (Registered Exporter System) Self-Declaration",
                description="Allows the Indian artisan exporter to issue origin declarations directly on commercial invoices, saving the German buyer 3% - 6% in EU import tariffs.",
                status="pending",
                source_reference="DGFT Trade Notice on EU REX Implementation",
                official_portal_url="https://dgft.gov.in/CP/?opt=rex",
                importance="Crucial incentive for European boutique buyers"
            ),
            ExportReadinessItem(
                code="PAY-SANDBOX",
                category="Payment Processing",
                title="PayPal Orders API v2 Trade Rails (Sandbox Verified)",
                description="Secure automated foreign exchange settlement pipeline configured with milestone deposit captures and real-time transaction verification.",
                status="verified",
                source_reference="PayPal Developer Sandbox Integration Guide",
                official_portal_url="https://developer.paypal.com/",
                importance="Eliminates international wire transfer friction and chargeback risks"
            ),
            ExportReadinessItem(
                code="ENV-REACH",
                category="Destination Standards (Germany/EU)",
                title="EU REACH Chemical Compliance & Azo-Free Dye Declaration",
                description="European Union regulation EC 1907/2006 banning harmful aromatic amines in textiles. Requires self-certification of azo-free vegetable or certified dyes.",
                status="pending",
                source_reference="European Chemicals Agency (ECHA) REACH Guidance",
                official_portal_url="https://echa.europa.eu/regulations/reach/understanding-reach",
                importance="Retail requirement for German boutique brand compliance"
            )
        ]

        total = len(items)
        verified = sum(1 for itm in items if itm.status == "verified")
        pending = sum(1 for itm in items if itm.status == "pending")
        readiness_pct = int((verified / total) * 100)

        disclaimer = (
            "NOTICE: This checklist highlights statutory and trade parameters to investigate before export dispatch. "
            "It is an operational readiness indicator generated by BORDERLESS AI and does NOT constitute legal, customs, "
            "or chartered tax advice. Official guidelines should be verified on DGFT, ICEGATE, and CBIC portals."
        )

        return ExportReadinessOut(
            seller_id=seller_id,
            overall_readiness_pct=readiness_pct,
            total_items=total,
            verified_count=verified,
            pending_count=pending,
            disclaimer=disclaimer,
            items=items
        )

export_readiness_service = ExportReadinessService()
