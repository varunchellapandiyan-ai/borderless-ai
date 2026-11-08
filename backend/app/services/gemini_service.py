import json
import logging
import base64
from typing import Optional, Dict, Any, Tuple
from app.config import settings
from app.schemas import ProductPassportExtraction, BuyerEnquiryExtraction

logger = logging.getLogger(__name__)

# System instructions prohibiting fabrication
EXTRACTION_SYSTEM_PROMPT = """You are BORDERLESS AI's high-precision Trade Intelligence Parser for Indian craft exporters.
RULES:
1. Extract ONLY facts explicitly stated in the input text or visible in the image.
2. DO NOT fabricate, guess, or invent unstated certifications, prices, legal requirements, or contact information.
3. When information is missing, explicitly list it under missing_details.
4. Formulate professional clarification questions for Indian exporters to ask international buyers.
5. All extracted information will be presented to the seller as AI-suggested and requires seller confirmation.
6. Output strictly valid JSON conforming to the requested schema.
"""

class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL
        self._client = None
        if settings.is_gemini_configured:
            try:
                from google import genai
                self._client = genai.Client(api_key=self.api_key)
                logger.info("Google GenAI client initialized successfully.")
            except Exception as e:
                logger.warning(f"Could not initialize GenAI client: {e}. Falling back to demo mode.")
                self._client = None

    @property
    def is_live(self) -> bool:
        return self._client is not None

    def extract_product_passport(self, description: str, image_bytes: Optional[bytes] = None, mime_type: str = "image/jpeg") -> Tuple[ProductPassportExtraction, bool]:
        """
        Extract structured Product Passport from text description and optional image.
        Returns (ProductPassportExtraction, is_demo_fallback)
        """
        if not self.is_live:
            return self._demo_product_passport(description), True

        try:
            prompt = f"""Analyze this Indian artisan handicraft/textile product for an export catalog:
Product Description: {description}

Extract:
- title: export-friendly product name
- material: precise material (e.g., 100% Cotton Handloom, Mulberry Silk)
- color: color palette and finish
- dimensions: metric and imperial sizes
- unit_weight_kg_estimate: approximate weight in kg
- suggested_hs_code: Indian export ITC-HS 8-digit code
- description: clear, professional export specification highlighting craftsmanship
- packaging_recommendation: protective export packaging
- craft_origin_details: regional heritage in India
- is_ai_suggested: true

DO NOT hallucinate certifications or laboratory standards not visible or stated.
"""
            contents = [prompt]
            if image_bytes:
                # Add image part
                contents.append({
                    "inline_data": {
                        "mime_type": mime_type,
                        "data": base64.b64encode(image_bytes).decode("utf-8")
                    }
                })

            response = self._client.models.generate_content(
                model=self.model_name,
                contents=contents,
                config={
                    "system_instruction": EXTRACTION_SYSTEM_PROMPT,
                    "response_mime_type": "application/json",
                    "response_schema": ProductPassportExtraction,
                    "temperature": 0.1,
                }
            )

            parsed_data = json.loads(response.text)
            extraction = ProductPassportExtraction.model_validate(parsed_data)
            extraction.is_ai_suggested = True
            return extraction, False

        except Exception as e:
            logger.error(f"Gemini API product extraction error: {e}. Using deterministic fallback.")
            return self._demo_product_passport(description), True

    def extract_buyer_enquiry(self, raw_text: str) -> Tuple[BuyerEnquiryExtraction, bool]:
        """
        Parse raw buyer enquiry into structured fields, missing parameters, and clarification questions.
        Returns (BuyerEnquiryExtraction, is_demo_fallback)
        """
        if not self.is_live:
            return self._demo_buyer_enquiry(raw_text), True

        try:
            prompt = f"""Carefully parse this international buyer enquiry:
\"\"\"
{raw_text}
\"\"\"

Extract:
- buyer_name: name of buyer contact
- buyer_company: company name or brand
- buyer_country: buyer country
- buyer_country_code: 2-letter ISO country code (e.g. DE, US, GB)
- requested_products: list of products or categories requested
- requested_quantity: quantity requested as integer
- target_unit_price: target price mentioned, or null if omitted
- target_currency: currency code (EUR, USD, GBP)
- delivery_timeline: timeline mentioned, or null
- requested_packaging: packaging preferences
- shipping_terms: FOB, CIF, or unstated
- missing_details: list of critical export parameters omitted (e.g. Incoterm port, port of destination, packaging specs, import tax codes)
- clarification_questions: 3 specific, professional questions the Indian exporter must ask the buyer

Remember: Never assume a pasted enquiry is a verified company or creditworthy buyer.
"""
            response = self._client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config={
                    "system_instruction": EXTRACTION_SYSTEM_PROMPT,
                    "response_mime_type": "application/json",
                    "response_schema": BuyerEnquiryExtraction,
                    "temperature": 0.1,
                }
            )

            parsed_data = json.loads(response.text)
            extraction = BuyerEnquiryExtraction.model_validate(parsed_data)
            return extraction, False

        except Exception as e:
            logger.error(f"Gemini API buyer enquiry parsing error: {e}. Using deterministic fallback.")
            return self._demo_buyer_enquiry(raw_text), True

    def analyze_negotiation_message(
        self,
        buyer_message: str,
        current_quote_eur: float,
        price_floor_eur: float,
        quantity: int,
        product_title: str
    ) -> Tuple[Dict[str, Any], bool]:
        """
        Translate buyer message (German/English), extract requested discount, calculate financial margin impact deterministically,
        and draft professional bilingual response.
        """
        if not self.is_live:
            return self._demo_negotiation_response(buyer_message, current_quote_eur, price_floor_eur, quantity, product_title), True

        try:
            prompt = f"""You are an international export negotiation copilot assisting an Indian artisan manufacturer.
Product: {product_title}
Order Quantity: {quantity} units
Current Approved Quotation: €{current_quote_eur:.2f} per unit FOB
Seller Minimum Safe Price Floor: €{price_floor_eur:.2f} per unit FOB (Do not suggest any price below this!)

Buyer Message (may be German or English):
\"\"\"
{buyer_message}
\"\"\"

Task:
1. Detect language (German or English).
2. Translate accurately to English (and if English, translate to German).
3. Identify requested unit price or discount percentage.
4. Assess if requested price is >= price floor (€{price_floor_eur:.2f}).
5. Formulate strategic advice: Explain how to protect artisan livelihood while keeping the international buyer engaged (e.g. volume lock, tiered pricing).
6. Draft a polite, highly professional reply in English and in German.

Format strictly as JSON with keys:
- detected_language: 'de' or 'en'
- translated_english: text
- translated_german: text
- requested_unit_price: number or null
- requested_discount_pct: number or null
- strategic_advice: string explaining rationale
- suggested_reply_english: string
- suggested_reply_german: string
"""
            response = self._client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config={
                    "system_instruction": EXTRACTION_SYSTEM_PROMPT,
                    "response_mime_type": "application/json",
                    "temperature": 0.2,
                }
            )

            data = json.loads(response.text)
            return data, False

        except Exception as e:
            logger.error(f"Gemini API negotiation analysis error: {e}. Using fallback.")
            return self._demo_negotiation_response(buyer_message, current_quote_eur, price_floor_eur, quantity, product_title), True

    # Deterministic Demo Mode fallbacks
    def _demo_product_passport(self, description: str) -> ProductPassportExtraction:
        return ProductPassportExtraction(
            title="Artisan Handloom Cotton Cushion Covers (45x45 cm)",
            material="100% Slub Yarn-Dyed Cotton (Pit Loom Weave)",
            color="Natural Oatmeal Ecru with Slate Charcoal Accents",
            dimensions="45 x 45 cm (17.7 x 17.7 inches)",
            unit_weight_kg_estimate=0.32,
            suggested_hs_code="6304.92.00",
            description="Hand-crafted in Erode, Tamil Nadu using traditional wooden shuttle looms. Features durable organic cotton slub texture, reinforced piped borders, and concealed bottom seam zipper closure.",
            packaging_recommendation="Individual biodegradable polybag with desiccant pouch, master carton of 50 units (7-ply corrugated export box).",
            craft_origin_details="Erode Handloom Cluster, Tamil Nadu, India — recognized for GI-protected traditional cotton weaving techniques.",
            is_ai_suggested=True
        )

    def _demo_buyer_enquiry(self, raw_text: str) -> BuyerEnquiryExtraction:
        # Check if text mentions numbers or keywords
        qty = 100
        if "50" in raw_text:
            qty = 50
        elif "200" in raw_text:
            qty = 200

        return BuyerEnquiryExtraction(
            buyer_name="Greta Lindemann",
            buyer_company="Hanseatische Wohnkultur GmbH",
            buyer_country="Germany",
            buyer_country_code="DE",
            requested_products=["Artisan Cotton Cushion Covers (45x45 cm)"],
            requested_quantity=qty,
            target_unit_price=5.40,
            target_currency="EUR",
            delivery_timeline="Within 35 days (Spring Showcase in Hamburg warehouse)",
            requested_packaging="Individual biodegradable sleeve with retail EAN barcode sticker",
            shipping_terms="FOB Chennai Sea Port",
            missing_details=[
                "Buyer EORI / VAT identification number for German import customs clearance",
                "Explicit preferred freight forwarder or shipping agent nomination for FOB pickup",
                "Confirmation whether EU REACH chemical certification report for dyes is requested for trial batch",
                "Exact barcode format (EAN-13 vs UPC-A)"
            ],
            clarification_questions=[
                "Could you please share your designated freight forwarder in Chennai or should we provide an ex-factory / CIF Hamburg quote?",
                "Do you require an official GSP / REX Statement of Origin issued by Indian DGFT to claim preferential customs tariff in Germany?",
                "Will your team supply printable vector artwork for barcode hangtags, or should we print standard GS1 EAN-13 stickers?"
            ],
            is_demo=True
        )

    def _demo_negotiation_response(
        self,
        buyer_message: str,
        current_quote_eur: float,
        price_floor_eur: float,
        quantity: int,
        product_title: str
    ) -> Dict[str, Any]:
        # Detect if German
        is_german = any(word in buyer_message.lower() for word in ["hallo", "danke", "angebot", "stück", "rabatt", "bestellen"])
        
        # Parse requested price if present
        req_price = 4.85
        if "4.50" in buyer_message:
            req_price = 4.50
        elif "5.00" in buyer_message:
            req_price = 5.00

        discount_pct = round(((current_quote_eur - req_price) / current_quote_eur) * 100, 2)
        is_safe = req_price >= price_floor_eur

        english_trans = buyer_message
        if is_german:
            english_trans = "Hello Ramesh, thank you for the quotation of €5.31 per piece. We find the quality outstanding. Since this is a test order, could you grant us a discount to €4.85 per piece for these 100 units? If sales go well, we will order 500 units in July."

        return {
            "detected_language": "de" if is_german else "en",
            "translated_english": english_trans,
            "translated_german": "Hallo Greta, vielen Dank für Ihre Rückmeldung. Wir freuen uns über Ihr Interesse an unseren handgewebten Kissenbezügen aus Erode...",
            "requested_unit_price": req_price,
            "requested_discount_pct": discount_pct,
            "strategic_advice": f"The buyer is asking for €{req_price:.2f} ({discount_pct}% discount). Since your minimum cost floor is €{price_floor_eur:.2f}, this leaves an acceptable net margin of ~24%. Counter with €4.95 for this 100-pc batch and agree to €4.75 conditionally upon their promised 500-unit reorder in July.",
            "suggested_reply_english": f"""Dear Greta,

Thank you for your constructive response and appreciation of our handcrafted textiles from Tamil Nadu.

We deeply value establishing a recurring partnership with Hanseatische Wohnkultur. While €{req_price:.2f} is near our artisan production floor for a 100-piece initial trial, we are pleased to meet you halfway at **€4.95 per piece FOB Chennai**.

Additionally, we formally commit that upon placing your planned 500-unit production order in July, we will lock in your preferred volume pricing of **€4.75 per piece**.

Please let us know if this arrangement works so we can update your formal quotation and issue your secure PayPal order link.

Warm regards,
Ramesh Kumar | Kaveri Looms""",
            "suggested_reply_german": f"""Sehr geehrte Frau Lindemann,

vielen Dank für Ihre konstruktive Rückmeldung und Ihr Interesse an unseren handgewebten Kissenbezügen aus Tamil Nadu.

Wir schätzen eine langfristige Partnerschaft mit Hanseatische Wohnkultur sehr. Während {req_price:.2f} € für einen ersten Kleinauftrag von 100 Stück nahe an unserer handwerklichen Selbstkostenbasis liegt, kommen wir Ihnen gerne auf **4,95 € pro Stück FOB Chennai** entgegen.

Darüber hinaus sichern wir Ihnen gerne verbindlich zu, dass wir bei Erteilung des geplanten 500-Stück-Auftrags im Juli den Vorzugspreis von **4,75 € pro Stück** anwenden werden.

Bitte geben Sie uns Bescheid, damit wir das Angebot anpassen und Ihnen den gesicherten PayPal-Zahlungslink übermitteln können.

Mit freundlichen Grüßen,
Ramesh Kumar | Kaveri Looms"""
        }

gemini_service = GeminiService()
