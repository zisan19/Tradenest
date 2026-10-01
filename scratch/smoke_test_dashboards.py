"""Quick API smoke test for the supplier + admin dashboard endpoints.

Run against a throwaway server (scratch DB copy):
    python smoke_test_dashboards.py
Uses the demo credentials from sample_data.py.
"""
import json
import urllib.request
import urllib.error

BASE = "http://127.0.0.1:8124"

PASS = 0
FAIL = 0


def call(method, path, token=None, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode())
        except Exception:
            return e.code, {}


def check(name, condition, extra=""):
    global PASS, FAIL
    if condition:
        PASS += 1
        print(f"  [OK]   {name}")
    else:
        FAIL += 1
        print(f"  [FAIL] {name} {extra}")


print("== Auth ==")
_, admin_login = call("POST", "/api/auth/login", body={"email": "admin@tradenest.com", "password": "adminpass"})
admin = admin_login.get("access_token")
check("admin login", bool(admin))

_, sup_login = call("POST", "/api/auth/login", body={"email": "supplier@tradenest.com", "password": "supplierpass"})
supplier = sup_login.get("access_token")
check("supplier login", bool(supplier))

_, sup2_login = call("POST", "/api/auth/login", body={"email": "global@tradenest.com", "password": "globalpass"})
supplier2 = sup2_login.get("access_token")
check("second supplier login", bool(supplier2))

_, buyer_login = call("POST", "/api/auth/login", body={"email": "buyer@tradenest.com", "password": "buyerpass"})
buyer = buyer_login.get("access_token")
check("buyer login", bool(buyer))

_, pend_login = call("POST", "/api/auth/login", body={"email": "newcraft@tradenest.com", "password": "newcraftpass"})
pending_supplier = pend_login.get("access_token")
check("pending supplier login", bool(pending_supplier))

print("== Supplier dashboard ==")
code, stats = call("GET", "/api/supplier/dashboard/stats", supplier)
check("GET /api/supplier/dashboard/stats", code == 200, str(stats)[:120])
check("stats has revenue/orders/products", all(k in stats for k in ("total_revenue", "total_orders", "total_products", "revenue_trend")))
check("recent_orders present", isinstance(stats.get("recent_orders"), list) and len(stats["recent_orders"]) > 0)

code, body = call("GET", "/api/supplier/dashboard/stats", buyer)
check("buyer blocked from supplier stats (403)", code == 403, str(code))

code, products = call("GET", "/api/supplier/products?page=1&page_size=5", supplier)
check("GET /api/supplier/products paginated", code == 200 and products.get("total", 0) >= 1, str(products)[:120])

code, created = call("POST", "/api/supplier/products", supplier, {
    "name": "Smoke Test Widget", "description": "temp", "price": 5.0, "moq": 10, "stock": 100, "category_id": 1,
})
check("POST /api/supplier/products", code == 201 and created.get("id"), str(created)[:120])
new_pid = created.get("id")

code, body = call("PATCH", f"/api/supplier/products/{new_pid}", supplier, {"price": 6.5, "stock": 80})
check("PATCH own product", code == 200 and body.get("price") == 6.5, str(body)[:120])

code, body = call("PATCH", f"/api/supplier/products/{new_pid}", supplier2, {"price": 1.0})
check("other supplier PATCH own product -> 403", code == 403, str(code))

code, body = call("DELETE", f"/api/supplier/products/{new_pid}", supplier2)
check("other supplier DELETE -> 403", code == 403, str(code))

code, body = call("DELETE", f"/api/supplier/products/{new_pid}", supplier)
check("owner soft-delete", code == 200 and body.get("deleted") is True, str(body)[:120])

code, body = call("GET", "/api/supplier/products?status=inactive", supplier)
check("soft-deleted product in inactive list", code == 200 and any(i["id"] == new_pid for i in body.get("items", [])))

code, orders = call("GET", "/api/supplier/orders", supplier)
check("GET /api/supplier/orders", code == 200 and len(orders) >= 1, str(code))
if orders:
    target = orders[0]
    current_status = target["status"]
    pipeline = ["pending", "confirmed", "shipped", "delivered"]
    if current_status == "delivered":
        code, body = call("PATCH", f"/api/supplier/orders/{target['id']}/status", supplier, {"status": "confirmed"})
        check("backward transition rejected (400)", code == 400, str(code))
    else:
        nxt = pipeline[pipeline.index(current_status) + 1]
        code, body = call("PATCH", f"/api/supplier/orders/{target['id']}/status", supplier, {"status": nxt})
        check(f"forward transition {current_status}->{nxt}", code == 200 and body.get("status") == nxt, str(body)[:120])

# Ownership: supplier2 must not be able to move Acme's order
if orders:
    code, body = call("PATCH", f"/api/supplier/orders/{orders[0]['id']}/status", supplier2, {"status": "confirmed"})
    check("non-owning supplier status change -> 404/403", code in (403, 404), str(code))

code, body = call("GET", "/api/supplier/analytics?days=30", supplier)
check("GET /api/supplier/analytics", code == 200 and "best_selling" in body and "orders_by_status" in body, str(body)[:120])

code, prof = call("GET", "/api/supplier/profile", supplier)
check("GET /api/supplier/profile", code == 200 and prof.get("id") and "is_verified" in prof, str(prof)[:120])

code, prof = call("PATCH", "/api/supplier/profile", supplier, {"contact_phone": "+1-555-9999"})
check("PATCH /api/supplier/profile", code == 200 and prof.get("contact_phone") == "+1-555-9999", str(prof)[:80])

code, prof = call("GET", "/api/supplier/profile", buyer)
check("buyer blocked from supplier profile (403)", code == 403, str(code))

print("== Admin dashboard ==")
code, astats = call("GET", "/api/admin/dashboard/stats", admin)
check("GET /api/admin/dashboard/stats", code == 200 and "total_users" in astats, str(astats)[:120])

code, body = call("GET", "/api/admin/dashboard/stats", supplier)
check("supplier blocked from admin stats (403)", code == 403, str(code))

code, users = call("GET", "/api/admin/users?role=supplier", admin)
check("GET /api/admin/users filtered by role", code == 200 and len(users) >= 2, str(code))

code, pend = call("GET", "/api/admin/suppliers/pending", admin)
check("GET /api/admin/suppliers/pending has demo queue", code == 200 and len(pend) >= 1, str(code))
pending_id = pend[0]["id"] if pend else None

if pending_id:
    code, body = call("PATCH", f"/api/admin/suppliers/{pending_id}/approve", supplier)
    check("supplier cannot approve supplier (403)", code == 403, str(code))
    code, body = call("PATCH", f"/api/admin/suppliers/{pending_id}/approve", admin)
    check("admin approves supplier", code == 200 and body.get("is_approved") is True, str(body)[:120])
    code, body = call("PATCH", f"/api/admin/suppliers/{pending_id}/reject", admin, {"reason": "demo rejection"})
    check("admin rejects supplier with reason", code == 200 and body.get("is_approved") is False, str(body)[:120])
    # restore pending state for demo
    call("PATCH", f"/api/admin/users/{pending_id}/role", admin, {"role": "supplier"})

code, ppend = call("GET", "/api/admin/products/pending", admin)
check("GET /api/admin/products/pending", code == 200 and len(ppend) >= 1, str(code))
if ppend:
    pid = ppend[0]["id"]
    code, body = call("PATCH", f"/api/admin/products/{pid}/approve", admin)
    check("admin approves product", code == 200 and body.get("is_approved") is True, str(body)[:120])
    code, body = call("PATCH", f"/api/admin/products/{pid}/reject", admin, {"reason": "demo"})
    check("admin rejects product with reason", code == 200 and body.get("is_approved") is False, str(body)[:120])

code, cats = call("GET", "/api/categories")
check("public categories list", code == 200 and len(cats) >= 1)
code, cat = call("POST", "/api/admin/categories", admin, {"name": "Smoke Cat", "icon": "x", "color_tag": "#123456"})
check("admin create category", code == 201 and cat.get("color_tag") == "#123456", str(cat)[:120])
if cat.get("id"):
    code, body = call("PATCH", f"/api/admin/categories/{cat['id']}", admin, {"name": "Smoke Cat 2", "color_tag": "#654321"})
    check("admin update category", code == 200 and body.get("name") == "Smoke Cat 2", str(body)[:120])
    code, body = call("DELETE", f"/api/admin/categories/{cat['id']}", admin)
    check("admin delete category", code == 200, str(code))

code, aorders = call("GET", "/api/admin/orders?status=pending", admin)
check("GET /api/admin/orders filtered", code == 200 and all(o["status"] == "pending" for o in aorders), str(code))

code, body = call("GET", "/api/admin/analytics?days=30", admin)
check("GET /api/admin/analytics", code == 200 and "top_suppliers" in body, str(body)[:120])

code, logs = call("GET", "/api/admin/audit-logs", admin)
check("GET /api/admin/audit-logs has entries", code == 200 and len(logs) >= 3, str(len(logs)))

code, body = call("GET", "/api/admin/audit-logs", supplier)
check("supplier blocked from audit logs (403)", code == 403, str(code))

print(f"\nRESULT: {PASS} passed, {FAIL} failed")
raise SystemExit(1 if FAIL else 0)
