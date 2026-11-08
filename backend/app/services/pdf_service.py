import os
from pathlib import Path
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether
from app.config import settings
from app.database import get_db_connection

class PDFQuotationService:
    def generate_quotation_pdf(self, quotation_id: str) -> str:
        """
        Generates a professional international trade export proforma quotation in PDF format.
        Returns the absolute filepath of the generated PDF.
        """
        conn = get_db_connection()
        cursor = conn.cursor()

        # Fetch quotation
        cursor.execute("SELECT * FROM quotations WHERE id = ?", (quotation_id,))
        quote = cursor.fetchone()
        if not quote:
            conn.close()
            raise ValueError(f"Quotation {quotation_id} not found.")

        # Fetch seller profile
        cursor.execute("SELECT * FROM seller_profiles WHERE id = ?", (quote["seller_id"],))
        seller = cursor.fetchone()

        # Fetch enquiry
        cursor.execute("SELECT * FROM enquiries WHERE id = ?", (quote["enquiry_id"],))
        enquiry = cursor.fetchone()

        # Fetch product
        cursor.execute("SELECT * FROM products WHERE id = ?", (quote["product_id"],))
        product = cursor.fetchone()

        # Fetch quotation items
        cursor.execute("SELECT * FROM quotation_items WHERE quotation_id = ?", (quotation_id,))
        items = cursor.fetchall()

        conn.close()

        # Output PDF path
        filename = f"Quotation_{quote['quote_number']}.pdf"
        file_path = settings.PDF_DIR / filename

        doc = SimpleDocTemplate(
            str(file_path),
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        
        # Custom styles
        primary_color = colors.HexColor("#0B192C") # Navy
        teal_color = colors.HexColor("#0D9488")    # Teal
        dark_slate = colors.HexColor("#1E293B")
        light_bg = colors.HexColor("#F8FAFC")
        border_color = colors.HexColor("#CBD5E1")

        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=18,
            leading=22,
            textColor=primary_color
        )
        subtitle_style = ParagraphStyle(
            'DocSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=10,
            leading=14,
            textColor=teal_color
        )
        normal_style = ParagraphStyle(
            'DocBody',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=13,
            textColor=dark_slate
        )
        bold_style = ParagraphStyle(
            'DocBodyBold',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=9,
            leading=13,
            textColor=primary_color
        )
        table_hdr_style = ParagraphStyle(
            'TableHdr',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=9,
            leading=11,
            textColor=colors.white
        )

        elements = []

        # Header Table: App Logo & Document Title
        header_data = [
            [
                Paragraph("<b>BORDERLESS AI</b><br/><font size=8 color='#0D9488'>AI Export Copilot for Indian Artisans</font>", title_style),
                Paragraph(f"<b>PROFORMA EXPORT QUOTATION</b><br/><font size=9 color='#64748B'>Quote Ref: {quote['quote_number']}<br/>Date: {quote['created_at'][:10]}</font>", ParagraphStyle('HdrRight', parent=normal_style, alignment=2))
            ]
        ]
        t_header = Table(header_data, colWidths=[270, 270])
        t_header.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ]))
        elements.append(t_header)
        elements.append(Spacer(1, 10))

        # Demo Banner in Document
        demo_banner = Table(
            [[Paragraph("<b>DEMONSTRATION DOCUMENT</b>: Structured export quotation generated with deterministic Indian craft cost models.", ParagraphStyle('D', parent=normal_style, fontSize=8, textColor=colors.HexColor("#92400E")))]],
            colWidths=[540]
        )
        demo_banner.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#FEF3C7")),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#F59E0B")),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
        ]))
        elements.append(demo_banner)
        elements.append(Spacer(1, 12))

        # Parties: Exporter & Importer
        seller_info = f"""
        <b>EXPORTER / ARTISAN PRODUCER:</b><br/>
        <b>{seller['business_name']}</b><br/>
        {seller['craft_type']}<br/>
        {seller['location']}, {seller['state']}, India<br/>
        IEC No: {seller['iec_number'] or 'Pending'} | GSTIN: {seller['gstin'] or 'Pending'}<br/>
        Bank: {seller['bank_name']} (A/C ending: {seller['account_last4']})
        """

        buyer_info = f"""
        <b>BUYER / IMPORTER:</b><br/>
        <b>{enquiry['buyer_company'] or enquiry['buyer_name']}</b><br/>
        Attn: {enquiry['buyer_name']}<br/>
        Destination: {enquiry['buyer_country']} ({enquiry['buyer_country_code']})<br/>
        Incoterms: <b>{quote['incoterms']}</b><br/>
        Payment Method: <b>{quote['payment_terms']}</b>
        """

        parties_data = [
            [Paragraph(seller_info, normal_style), Paragraph(buyer_info, normal_style)]
        ]
        t_parties = Table(parties_data, colWidths=[270, 270])
        t_parties.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), light_bg),
            ('BOX', (0,0), (-1,-1), 0.5, border_color),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('PADDING', (0,0), (-1,-1), 8),
        ]))
        elements.append(t_parties)
        elements.append(Spacer(1, 14))

        # Product & Tariff Identification
        prod_data = [
            [Paragraph("<b>Item Description / Product Specification</b>", normal_style), Paragraph(f"<b>{product['title']}</b>", bold_style)],
            [Paragraph("<b>HS Tariff Code</b>", normal_style), Paragraph(f"{product['hs_code']} (Standard Indian Export ITC-HS Classification)", normal_style)],
            [Paragraph("<b>Material & Weave Specification</b>", normal_style), Paragraph(f"{product['material']} | {product['dimensions']}", normal_style)],
            [Paragraph("<b>Export Packaging</b>", normal_style), Paragraph(f"{product['packaging_details'] or 'Standard export master carton'}", normal_style)],
        ]
        t_prod = Table(prod_data, colWidths=[180, 360])
        t_prod.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 0.5, border_color),
            ('BACKGROUND', (0,0), (0,-1), colors.HexColor("#F1F5F9")),
            ('PADDING', (0,0), (-1,-1), 5),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        elements.append(t_prod)
        elements.append(Spacer(1, 14))

        # Itemized Financial Breakdown Table
        headers = [
            Paragraph("Item Type", table_hdr_style),
            Paragraph("Detailed Cost Description", table_hdr_style),
            Paragraph("Type / Basis", table_hdr_style),
            Paragraph(f"Amount ({quote['currency']})", table_hdr_style)
        ]
        
        table_rows = [headers]
        for itm in items:
            type_label = "Estimate" if itm["is_estimate"] else "Verified"
            basis_text = f"<font size=7 color='#64748B'>{itm['estimate_basis'] or ''}</font>"
            table_rows.append([
                Paragraph(f"<b>{itm['item_type'].replace('_', ' ').title()}</b>", normal_style),
                Paragraph(f"{itm['description']}<br/>{basis_text}", normal_style),
                Paragraph(f"<font color='{'#D97706' if itm['is_estimate'] else '#0D9488'}'><b>{type_label}</b></font>", normal_style),
                Paragraph(f"<b>{quote['currency']} {itm['cost_foreign']:.2f}</b>", ParagraphStyle('Amt', parent=normal_style, alignment=2))
            ])

        # Summary rows
        table_rows.append([
            "",
            Paragraph("<b>Unit Price (FOB)</b>", bold_style),
            Paragraph(f"{quote['quantity']} Units", normal_style),
            Paragraph(f"<b>{quote['currency']} {quote['unit_price_fob_foreign']:.2f} / pc</b>", ParagraphStyle('Amt', parent=bold_style, alignment=2))
        ])

        table_rows.append([
            "",
            Paragraph("<b>TOTAL PAYABLE (COMMERCIAL VALUE)</b>", bold_style),
            Paragraph("<b>100% Advance</b>", bold_style),
            Paragraph(f"<b><font size=11 color='#0D9488'>{quote['currency']} {quote['total_payable_foreign']:.2f}</font></b>", ParagraphStyle('Amt', parent=bold_style, alignment=2))
        ])

        t_breakdown = Table(table_rows, colWidths=[90, 270, 90, 90])
        t_breakdown.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), primary_color),
            ('GRID', (0,0), (-1,-1), 0.5, border_color),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('PADDING', (0,0), (-1,-1), 5),
            ('BACKGROUND', (0,-2), (-1,-1), colors.HexColor("#F8FAFC")),
            ('LINEABOVE', (0,-2), (-1,-2), 1.5, primary_color),
        ]))
        elements.append(t_breakdown)
        elements.append(Spacer(1, 14))

        # Commercial Terms & Declarations
        terms = f"""
        <b>STANDARD EXPORT TERMS & COMPLIANCE CONDITIONS:</b><br/>
        1. <b>Incoterms 2020:</b> {quote['incoterms']}. Buyer nominates and coordinates international carriage.<br/>
        2. <b>Validity:</b> This quotation is valid for {quote['validity_days']} days from issue date.<br/>
        3. <b>Settlement Rails:</b> Secure PayPal Sandbox Trade Checkout. Order creation & status verified server-side.<br/>
        4. <b>Origin Statement:</b> Registered Exporter System (REX) self-certification statement will be endorsed on shipping bill.<br/>
        5. <b>Lead Time:</b> Dispatch ready at Chennai Port within 18 working days of payment settlement.
        """
        elements.append(Paragraph(terms, normal_style))
        elements.append(Spacer(1, 14))

        # Signatures
        sig_data = [
            [
                Paragraph("<b>Prepared by BORDERLESS AI:</b><br/>Deterministic Cost & Verification Engine<br/>Verified against Kaveri Looms Ledgers", normal_style),
                Paragraph("<b>Authorized Exporter Signatory:</b><br/>Ramesh Kumar, Managing Director<br/>Kaveri Looms Handloom Cluster, Tamil Nadu", normal_style)
            ]
        ]
        t_sig = Table(sig_data, colWidths=[270, 270])
        t_sig.setStyle(TableStyle([
            ('LINEABOVE', (0,0), (-1,-1), 1, border_color),
            ('PADDING', (0,0), (-1,-1), 8),
        ]))
        elements.append(t_sig)

        # Build document
        doc.build(elements)

        # Update quotation record with pdf path
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE quotations SET pdf_path = ? WHERE id = ?", (str(file_path), quotation_id))
        conn.commit()
        conn.close()

        return str(file_path)

pdf_service = PDFQuotationService()
