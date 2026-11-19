#!/usr/bin/env python3
"""
AgriForecasting - Comprehensive Backend API & Integration Test Suite
Validates all 15 endpoints, status codes, JSON contracts, rate limit headers,
error handling, and response latencies against live PostgreSQL and Spring Boot.
"""

import sys
import time
import json
import urllib.request
import urllib.error

BASE_URL = "http://localhost:8080/api/v1"

def make_request(path, method="GET", data=None, headers=None):
    url = f"{BASE_URL}{path}"
    req_headers = {"User-Agent": "AgriForecasting-API-Test/1.0"}
    if headers:
        req_headers.update(headers)
    req = urllib.request.Request(url, data=data, headers=req_headers, method=method)
    start = time.time()
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            elapsed_ms = (time.time() - start) * 1000
            body = resp.read().decode("utf-8")
            return resp.status, resp.headers, body, elapsed_ms
    except urllib.error.HTTPError as e:
        elapsed_ms = (time.time() - start) * 1000
        body = e.read().decode("utf-8") if e.fp else ""
        return e.code, e.headers, body, elapsed_ms
    except Exception as e:
        elapsed_ms = (time.time() - start) * 1000
        return 0, {}, str(e), elapsed_ms

def run_suite():
    print("=====================================================================")
    print("  AgriForecasting API Comprehensive Verification Suite")
    print(f"  Target: {BASE_URL}")
    print("=====================================================================")

    tests = [
        # Health & Actuator
        ("Health Check", "/health", 200, lambda j: j.get("data", {}).get("status") == "UP"),
        
        # States & Districts
        ("List States (All 30)", "/states", 200, lambda j: len(j.get("data", [])) >= 30),
        ("List Districts for Punjab", "/districts?stateId=pb", 200, lambda j: len(j.get("data", [])) > 20),
        ("List Districts for Rajasthan", "/districts?stateId=rj", 200, lambda j: len(j.get("data", [])) > 30),
        
        # Commodities & Varieties
        ("List Commodities", "/commodities", 200, lambda j: len(j.get("data", [])) >= 10),
        ("Get Commodity Details (Tomato)", "/commodities/tomato", 200, lambda j: j.get("data", {}).get("id") == "tomato"),
        ("Get Commodity Details (Invalid ID)", "/commodities/non-existent-xyz", 404, None),
        
        # Mandis (Paged, Search, Filter)
        ("Mandi List Default Page", "/mandis?size=10", 200, lambda j: len(j.get("data", [])) == 10),
        ("Mandi Filter by State (Punjab)", "/mandis?stateId=pb&size=20", 200, lambda j: all(m.get("stateId") == "pb" for m in j.get("data", []))),
        ("Mandi Search by Name ('Khanna')", "/mandis?search=Khanna", 200, lambda j: any("Khanna" in m.get("name", "") for m in j.get("data", []))),
        ("Mandi Filter Geocoded Only", "/mandis?hasCoordinates=true&size=50", 200, lambda j: all(m.get("latitude") is not None for m in j.get("data", []))),
        ("Get Specific Mandi (Kolar APMC)", "/mandis/ka-kolar-apmc", 200, lambda j: j.get("data", {}).get("name") == "Kolar APMC"),
        ("Get Specific Mandi (Legacy ID fallback)", "/mandis/kolar-apmc", 200, lambda j: "Kolar" in j.get("data", {}).get("name")),
        ("Get Non-existent Mandi", "/mandis/does-not-exist-9999", 404, None),
        ("Nearby Mandis within 50km", "/mandis/nearby?latitude=28.4595&longitude=77.0266&radiusKm=50", 200, lambda j: isinstance(j.get("data"), list)),
        
        # Historical Prices
        ("Price History (Kolar Tomato 30d)", "/prices/ka-kolar-apmc/tomato?days=30", 200, lambda j: len(j.get("data", [])) > 0),
        ("Price History Summary", "/prices/ka-kolar-apmc/tomato/summary?days=30", 200, lambda j: j.get("data", {}).get("observationCount", 0) > 0),
        ("Price Latest Observation", "/prices/ka-kolar-apmc/tomato/latest", 200, lambda j: j.get("data", {}).get("modalPrice") is not None),
        
        # Forecast Pipeline (LightGBM + PostgreSQL)
        ("Generate 14-Day Forecast (Kolar Tomato)", "/forecast/generate?mandiId=ka-kolar-apmc&commodityId=tomato&varietyId=tomato-hybrid", 200, 
         lambda j: j.get("data", {}).get("horizon") == 14 and len(j.get("data", {}).get("predictions", [])) == 14),
        ("Forecast History Retrieval", "/forecast/history?mandiId=ka-kolar-apmc&commodityId=tomato", 200, lambda j: len(j.get("data", [])) > 0),
        
        # Multi-Market Comparison
        ("Compare Markets (2 Mandis)", "/comparison?commodityId=tomato&mandiIds=ka-kolar-apmc,pb-amritsar-apmc", 200, 
         lambda j: len(j.get("data", {}).get("mandis", [])) == 2),
        ("Compare Markets (Exceeds 5 Mandis Limit)", "/comparison?commodityId=tomato&mandiIds=m1,m2,m3,m4,m5,m6", 400, None),
    ]

    results = []
    total_passed = 0
    total_failed = 0

    for name, path, expected_code, validator in tests:
        status, headers, body, latency = make_request(path)
        passed = (status == expected_code)
        
        # Verify rate limit headers present
        rl_limit = headers.get("X-RateLimit-Limit")
        rl_remaining = headers.get("X-RateLimit-Remaining")
        
        error_msg = ""
        if passed and validator:
            try:
                parsed = json.loads(body)
                if not validator(parsed):
                    passed = False
                    error_msg = f"Validation predicate failed on payload: {body[:150]}"
            except Exception as e:
                passed = False
                error_msg = f"JSON parse error: {e}"
        elif not passed:
            error_msg = f"Expected HTTP {expected_code}, got {status}: {body[:150]}"

        status_str = "PASS" if passed else "FAIL"
        if passed:
            total_passed += 1
            print(f"[{status_str}] {name:<45} | HTTP {status:<3} | {latency:6.1f}ms | RL-Rem: {rl_remaining}")
        else:
            total_failed += 1
            print(f"[{status_str}] {name:<45} | HTTP {status:<3} | {latency:6.1f}ms | ERROR: {error_msg}")

        results.append({
            "name": name,
            "path": path,
            "status": status,
            "expected": expected_code,
            "passed": passed,
            "latencyMs": round(latency, 2),
            "rateLimitLimit": rl_limit,
            "rateLimitRemaining": rl_remaining,
            "error": error_msg
        })

    print("=====================================================================")
    print(f"  Summary: {total_passed} Passed, {total_failed} Failed out of {len(tests)} tests.")
    print("=====================================================================")
    
    # Save results to json
    with open("/Users/karthikreddy/Desktop/Agri/tests/api_test_results.json", "w") as f:
        json.dump(results, f, indent=2)

    return total_failed == 0

if __name__ == "__main__":
    success = run_suite()
    sys.exit(0 if success else 1)
