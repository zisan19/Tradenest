"""Smoke test for the Add/Edit Product feature endpoints.

Run against a throwaway server on port 8124 with a seeded DB copy:
    python ../scratch/smoke_test_product_form.py
"""
import io
import json
import urllib.error
import urllib.request

BASE = "http://127.0.0.1:8124"
PASSED = 0
FAILED = []


def call(method, path, token=None, body=None, raw=None, content_type=None):
    data = None
    headers = {}
    if body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    elif raw is not None:
        data = raw
        headers["Content-Type"] = content_type
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(BASE + path, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req) as r:
            payload = r.read()
            return r.status, json.loads(payload) if payload else None
    except urllib.error.HTTPError as e:
        payload = e.read()
        try:
            return e.code, json.loads(payload)
        except Exception:
            return e.code, payload


def login(email, password):
    status, data = call("POST", "/api/auth/login", body={"email": email, "password": password})
    assert status == 200, f"login {email} failed: {status} {data}"
    return data["access_token"]


def check(name, cond, extra=""):
    global PASSED
    if cond:
        PASSED += 1
        print(f"  PASS {name}")
    else:
        FAILED.append(name)
        print(f"  FAIL {name} {extra}")


def multipart(files):
    """Minimal multipart/form-data body for one or more files."""
    boundary = "----trademestboundary42"
    out = b""
    for name, filename, content, ctype in files:
        out += f"--{boundary}\r\n".encode()
        out += f'Content-Disposition: form-data; name="{name}"; filename="{filename}"\r\n'.encode()
        out += f"Content-Type: {ctype}\r\n\r\n".encode()
        out += content + b"\r\n"
    out += f"--{boundary}--\r\n".encode()
    return out, f"multipart/form-data; boundary={boundary}"


supplier = login("supplier@tradenest.com", "supplierpass")
supplier2 = login("global@tradenest.com", "globalpass")
admin = login("admin@tradenest.com", "adminpass")

print("== validation ==")
long_desc = "Description long enough to satisfy the fifty character minimum quality bar."
bad_payloads = [
    ("short title", {"name": "ab", "description": long_desc, "price": 5, "moq": 1, "stock": 1}),
    ("short description", {"name": "Valid name", "description": "too short", "price": 5, "moq": 1, "stock": 1}),
    ("zero price", {"name": "Valid name", "description": long_desc, "price": 0, "moq": 1, "stock": 1}),
    ("zero moq", {"name": "Valid name", "description": long_desc, "price": 5, "moq": 0, "stock": 1}),
    ("negative stock", {"name": "Valid name", "description": long_desc, "price": 5, "moq": 1, "stock": -2}),
    ("bad unit", {"name": "Valid name", "description": long_desc, "price": 5, "moq": 1, "stock": 1, "unit": "tons"}),
    # (bad category checked separately below — it returns a clean 400, not 422)
    ("unused", {}),
]
for label, payload in bad_payloads[:-1]:
    status, data = call("POST", "/api/supplier/products", supplier, payload)
    check(f"rejects {label}", status == 422, f"got {status}")
status, data = call("POST", "/api/supplier/products", supplier, {"name": "Valid name", "description": long_desc, "price": 5, "moq": 1, "stock": 1, "category_id": 99999})
check("rejects bad category", status == 400, f"got {status}")

print("== create + draft flow ==")
# Drafts with partial data are allowed — only a title is required.
status, partial = call("POST", "/api/supplier/products", supplier, {"name": "Incomplete draft thing", "is_draft": True})
check("partial draft saves", status == 201 and partial["is_draft"] is True, f"{status} {partial}")
# Submissions still enforce the quality bars.
status, _ = call("POST", "/api/supplier/products", supplier, {"name": "Incomplete submission", "is_draft": False})
check("incomplete submission rejected", status == 422, f"got {status}")
# NOTE: this test re-runs against the same throwaway DB copy; approval queue
# checks below use per-run names (Smoke Test Widget) so stale rows don't matter.
payload = {
    "name": "Smoke Test Widget",
    "short_description": "A widget for the smoke test",
    "description": long_desc + " Extra detail to be realistic.",
    "price": 4.5, "moq": 10, "stock": 100, "unit": "box",
    "tags": "widget, smoke, test",
    "image_urls": ["/uploads/a.png", "/uploads/b.png"],
    "category_id": 1,
}
status, created = call("POST", "/api/supplier/products", supplier, payload)
check("create 201", status == 201, f"{status} {created}")
check("starts pending review", created and created["is_approved"] is False, str(created and created.get("is_approved")))
check("not draft", created and created["is_draft"] is False)
check("primary image synced", created and created["image_url"] == "/uploads/a.png", str(created and created.get("image_url")))
check("tags normalized", created and created["tags"] == ["widget", "smoke", "test"], str(created and created.get("tags")))
pid = created["id"]

status, draft = call("POST", "/api/supplier/products", supplier, {**payload, "name": "Smoke Draft Item", "is_draft": True})
check("draft created", status == 201 and draft["is_draft"] is True, f"{status}")
draft_id = draft["id"]

print("== fetch single + ownership ==")
status, single = call("GET", f"/api/supplier/products/{pid}", supplier)
check("GET own product 200", status == 200 and single["id"] == pid, f"{status}")
status, _ = call("GET", f"/api/supplier/products/{pid}", supplier2)
check("GET other's product 404", status == 404, f"got {status}")
status, _ = call("GET", f"/api/supplier/products/{pid}", admin)
check("admin GET returns 404 (not owner)", status == 404, f"got {status}")

print("== update semantics ==")
status, upd = call("PATCH", f"/api/supplier/products/{pid}", supplier, {"price": 5.25, "tags": "x"})
check("pending product update ok", status == 200 and upd["price"] == 5.25 and upd["tags"] == ["x"], f"{status}")
status, upd = call("PATCH", f"/api/supplier/products/{pid}", supplier2, {"price": 1})
check("foreign PATCH 403", status == 403, f"got {status}")
status, upd = call("PATCH", f"/api/supplier/products/{pid}", supplier, {})
check("empty PATCH 400", status == 400, f"got {status}")
# Submit a separate draft (draft_id must STAY a draft for the queue check below).
status, draft_submit = call("POST", "/api/supplier/products", supplier, {**payload, "name": "Smoke Draft Submit", "is_draft": True})
status, upd = call("PATCH", f"/api/supplier/products/{draft_submit['id']}", supplier, {"is_draft": False})
check("submit draft", status == 200 and upd["is_draft"] is False and upd["is_approved"] is False, f"{status}")

print("== images upload ==")
png = b"\x89PNG\r\n\x1a\n" + b"0" * 64
body, ctype = multipart([("files", "one.png", png, "image/png"), ("files", "two.png", png, "image/png")])
status, ups = call("POST", "/api/supplier/uploads", supplier, raw=body, content_type=ctype)
check("upload 2 images 200", status == 200 and len(ups) == 2 and ups[0]["url"].startswith("/uploads/"), f"{status} {ups}")
body, ctype = multipart([("files", "evil.gif", b"GIF89a", "image/gif")])
status, data = call("POST", "/api/supplier/uploads", supplier, raw=body, content_type=ctype)
check("rejects gif", status == 400, f"got {status}")
big = b"0" * (5 * 1024 * 1024 + 10)
body, ctype = multipart([("files", "big.png", big, "image/png")])
status, data = call("POST", "/api/supplier/uploads", supplier, raw=body, content_type=ctype)
check("rejects >5MB", status == 413, f"got {status}")
body, ctype = multipart([("files", "one.png", png, "image/png")])
status, ups = call("POST", f"/api/supplier/products/{pid}/images", supplier, raw=body, content_type=ctype)
check("attach to product 200", status == 200 and ups and ups[0]["url"].startswith("/uploads/"), f"{status}")
status, single = call("GET", f"/api/supplier/products/{pid}", supplier)
check("gallery appended", single and len(single["image_urls"]) == 3, str(single and single.get("image_urls")))
status, _ = call("POST", f"/api/supplier/products/{pid}/images", supplier2, raw=body, content_type=ctype)
check("foreign upload 404", status == 404, f"got {status}")

print("== admin queue ==")
status, pending = call("GET", "/api/admin/products/pending", admin)
ids = [p["id"] for p in (pending or [])]
check("new product in admin queue", pid in ids, str(ids[:8]))
check("draft NOT in admin queue", draft_id not in ids)
target = next((p for p in pending if p["id"] == pid), None)
if target:
    status, _ = call("PATCH", f"/api/admin/products/{pid}/approve", admin)
    check("admin approves", status == 200, f"{status}")
    status, single = call("GET", f"/api/supplier/products/{pid}", supplier)
    check("now approved", single and single["is_approved"] is True)
    # Editing an approved product must push it back into review.
    status, upd = call("PATCH", f"/api/supplier/products/{pid}", supplier, {"price": 6.5})
    check("approved edit re-flags review", status == 200 and upd["is_approved"] is False, f"{status} {upd and upd.get('is_approved')}")
    # A draft-save on a live product must NOT pull it back into review.
    status, approved2 = call("PATCH", f"/api/admin/products/{pid}/approve", admin)
    status, upd = call("PATCH", f"/api/supplier/products/{pid}", supplier, {"short_description": "tweak", "is_draft": True})
    check("draft-save keeps live product approved", status == 200 and upd["is_approved"] is True, f"{status} {upd and upd.get('is_approved')}")
else:
    check("admin approves", False, "product not found in queue")

# The earlier draft was submitted above; create a fresh one for the filter check.
status, draft2 = call("POST", "/api/supplier/products", supplier, {**payload, "name": "Smoke Draft Filter", "is_draft": True})
status, plist = call("GET", "/api/supplier/products?status=draft", supplier)
check("draft filter works", status == 200 and plist and any(p["id"] == draft2["id"] for p in plist["items"]), f"{status}")

print(f"\n{PASSED} passed, {len(FAILED)} failed")
if FAILED:
    print("FAILED:", FAILED)
    raise SystemExit(1)
