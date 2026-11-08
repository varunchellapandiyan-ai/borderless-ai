import json
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.database import get_db_connection
from app.schemas import PayPalOrderCreateRequest, PayPalOrderCreateResponse, PayPalOrderCaptureRequest, PayPalOrderCaptureResponse
from app.services.paypal_service import paypal_service

router = APIRouter(prefix="/api/paypal", tags=["PayPal Trade Checkout"])

@router.post("/create-order", response_model=PayPalOrderCreateResponse)
def create_paypal_order(req: PayPalOrderCreateRequest):
    """
    Creates an export milestone payment order in PayPal Sandbox.
    Orders can only be created AFTER quotation is approved by the seller.
    """
    try:
        return paypal_service.create_order(req.quotation_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PayPal order creation failed: {str(e)}")

@router.post("/capture-order", response_model=PayPalOrderCaptureResponse)
def capture_paypal_order(req: PayPalOrderCaptureRequest):
    """
    Captures payment on the backend after buyer approval.
    Directly verifies payment capture with PayPal API before updating database state.
    """
    try:
        return paypal_service.capture_order(req.order_id, req.quotation_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PayPal capture failed: {str(e)}")

@router.get("/order/{order_id}")
def get_paypal_order(order_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM payment_orders WHERE paypal_order_id = ?", (order_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Order not found")

    return {
        "id": row["id"],
        "quotation_id": row["quotation_id"],
        "paypal_order_id": row["paypal_order_id"],
        "paypal_capture_id": row["paypal_capture_id"],
        "amount": row["amount"],
        "currency": row["currency"],
        "status": row["status"],
        "paypal_approval_url": row["paypal_approval_url"],
        "verified_by_paypal_api": bool(row["verified_by_paypal_api"]),
        "verification_timestamp": row["verification_timestamp"],
        "payer_email": row["payer_email"],
        "payer_name": row["payer_name"],
        "raw_response": json.loads(row["paypal_raw_response"]) if row["paypal_raw_response"] else None,
        "created_at": row["created_at"],
        "updated_at": row["updated_at"]
    }

@router.get("/history")
def list_payment_orders():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM payment_orders ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()

    result = []
    for r in rows:
        result.append({
            "id": r["id"],
            "quotation_id": r["quotation_id"],
            "paypal_order_id": r["paypal_order_id"],
            "paypal_capture_id": r["paypal_capture_id"],
            "amount": r["amount"],
            "currency": r["currency"],
            "status": r["status"],
            "paypal_approval_url": r["paypal_approval_url"],
            "verified_by_paypal_api": bool(r["verified_by_paypal_api"]),
            "verification_timestamp": r["verification_timestamp"],
            "payer_email": r["payer_email"],
            "payer_name": r["payer_name"],
            "created_at": r["created_at"]
        })
    return result
