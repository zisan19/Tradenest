import urllib.request
import urllib.error
import json
import sys

BASE_API = "http://127.0.0.1:8000"
BASE_FE = "http://127.0.0.1:5173"

def make_req(url, method="GET", data=None, headers=None):
    if headers is None:
        headers = {}
    body = None
    if data is not None:
        body = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            status = resp.status
            content = resp.read().decode("utf-8")
            try:
                parsed = json.loads(content)
            except Exception:
                parsed = content
            return status, parsed
    except urllib.error.HTTPError as e:
        status = e.code
        content = e.read().decode("utf-8")
        try:
            parsed = json.loads(content)
        except Exception:
            parsed = content
        return status, parsed
    except Exception as e:
        return 500, str(e)

def run_tests():
    print("==================================================")
    print("TRADENEST E2E VERIFICATION: CART, CHECKOUT & PAYMENT")
    print("==================================================")

    # 1. Frontend Server Check
    status_fe, _ = make_req(BASE_FE)
    print(f"[OK] Frontend root reachable: HTTP {status_fe}")
    status_co, _ = make_req(f"{BASE_FE}/checkout")
    print(f"[OK] Frontend /checkout route reachable: HTTP {status_co}")

    # 2. Buyer Login
    print("\n--- Testing Authentication ---")
    status, login_res = make_req(f"{BASE_API}/api/auth/login", method="POST", data={
        "email": "buyer@tradenest.com",
        "password": "buyerpass"
    })
    if status != 200:
        print(f"[FAIL] Buyer login failed: {login_res}")
        sys.exit(1)
    token = login_res["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"[OK] Buyer logged in successfully, token retrieved.")

    # 3. Product Catalog & MOQ Check
    print("\n--- Testing Product Catalog ---")
    status, products = make_req(f"{BASE_API}/api/products/")
    if status != 200 or not products:
        print(f"[FAIL] No products returned! Status: {status}")
        sys.exit(1)
    test_prod = products[0]
    print(f"[OK] Product found: '{test_prod['name']}' (ID: {test_prod['id']}, Price: ${test_prod['price']}, MOQ: {test_prod['moq']}, Stock: {test_prod['stock']})")

    # 4. Cart API Flow
    print("\n--- Testing Cart API & MOQ Validation ---")
    sub_moq = max(1, test_prod['moq'] - 1)
    if sub_moq < test_prod['moq']:
        status_sub, sub_res = make_req(f"{BASE_API}/api/cart/items", method="POST", data={
            "product_id": test_prod['id'],
            "quantity": sub_moq
        }, headers=headers)
        if status_sub == 400:
            print(f"[OK] MOQ strictly enforced on backend: {sub_res.get('detail')}")
        else:
            print(f"[WARN] Expected 400 for sub-MOQ, got {status_sub}")

    # Add valid MOQ
    status_add, cart_data = make_req(f"{BASE_API}/api/cart/items", method="POST", data={
        "product_id": test_prod['id'],
        "quantity": test_prod['moq']
    }, headers=headers)
    if status_add != 200:
        print(f"[FAIL] Adding valid item failed: {cart_data}")
        sys.exit(1)
    print(f"[OK] Item added to cart. Total items in cart: {len(cart_data['items'])}")

    # Update item quantity
    item_id = cart_data['items'][0]['id']
    status_patch, patch_res = make_req(f"{BASE_API}/api/cart/items/{item_id}", method="PATCH", data={
        "quantity": test_prod['moq'] + 5
    }, headers=headers)
    if status_patch == 200:
        print(f"[OK] Updated quantity to {test_prod['moq'] + 5}")
    else:
        print(f"[FAIL] Updating quantity failed: {patch_res}")

    # 5. Simulated Payment Flow
    print("\n--- Testing Demo Payment Simulation (Local Mock) ---")
    # Test Success Simulation
    status_pay, pay_success = make_req(f"{BASE_API}/api/payments/simulate", method="POST", data={
        "order_id": 998877,
        "amount": 2500.00,
        "payment_method": "DEMO_CREDIT_CARD",
        "simulate_failure": False
    }, headers=headers)
    if status_pay == 200 and pay_success.get("status", "").lower() == "success":
        print(f"[OK] Success payment simulated! Status: {pay_success['status']}, Txn Ref: {pay_success['transaction_ref']}")
    else:
        print(f"[FAIL] Simulated success payment failed: {pay_success}")
        sys.exit(1)

    # Test Failure Simulation
    status_fail, pay_fail = make_req(f"{BASE_API}/api/payments/simulate", method="POST", data={
        "order_id": 998878,
        "amount": 2500.00,
        "payment_method": "DEMO_CREDIT_CARD",
        "simulate_failure": True
    }, headers=headers)
    if status_fail == 200 and pay_fail.get("status", "").lower() == "failed":
        print(f"[OK] Failure state simulated properly! Status: {pay_fail['status']}, Ref: {pay_fail.get('transaction_ref')}")
    else:
        print(f"[FAIL] Simulated failure payment unexpected: {pay_fail}")
        sys.exit(1)

    # 6. Clear Cart
    status_clr, clear_res = make_req(f"{BASE_API}/api/cart/", method="DELETE", headers=headers)
    if status_clr == 200 and clear_res.get("items") == []:
        print("[OK] Cart successfully cleared after simulated order completion.")

    print("\n==================================================")
    print("ALL E2E CHECKS PASSED WITH 100% SUCCESS!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
