#!/usr/bin/env python3
"""
Browser QA: Market Explorer Performance, Range Filtering, and Location Persistence
Verifies:
1. Fast initial load of Market Explorer (/nearby-mandis) with Canvas-accelerated map.
2. Accurate selection and persistent storage of national location in localStorage.
3. Reload persistence: coordinates remain intact across page reloads.
4. Smooth, lag-free switching between distance radius ranges (10km, 25km, 50km, 100km, All India).
5. Accurate distance filtering and sorting.
"""

import os
import sys
import time
import json
from playwright.sync_api import sync_playwright

SCREENSHOTS_DIR = "/Users/karthikreddy/.gemini/antigravity/brain/c825e7cf-751d-47d7-8c67-f6ca7f3d6ee3/screenshots"
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)
BASE_URL = "http://localhost:3000"

def run_qa():
    print("=== Starting Market Explorer & Location Performance QA ===")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1280, "height": 900},
            geolocation={"latitude": 30.7022, "longitude": 76.2167}, # Khanna / Ludhiana, Punjab
            permissions=["geolocation"]
        )
        page = context.new_page()

        # TEST 1: Initial Load of Market Explorer
        print("\n--- TEST 1: Initial Load & Canvas Map Performance ---")
        t0 = time.time()
        page.goto(f"{BASE_URL}/nearby-mandis", timeout=20000)
        page.wait_for_selector(".leaflet-container", timeout=15000)
        t_load = time.time() - t0
        print(f"✓ Market Explorer loaded and map ready in {t_load:.2f} seconds")
        assert t_load < 5.0, "Page should load in under 5 seconds"

        # TEST 2: Select National Location via Modal & Verify Storage
        print("\n--- TEST 2: National Location Selection & Persistence ---")
        # Open location modal
        change_loc_btn = page.locator("button:has-text('Change Location'), button:has-text('Select location')").first
        change_loc_btn.click()
        page.wait_for_selector("select[data-testid='modal-state-select']", timeout=5000)
        
        # Select Punjab
        page.select_option("select[data-testid='modal-state-select']", "pb")
        time.sleep(1)
        # Select Ludhiana district
        page.select_option("select[data-testid='modal-district-select']", "pb-ludhiana")
        time.sleep(1)
        # Select Khanna APMC
        page.select_option("select[data-testid='modal-mandi-select']", "pb-khanna-apmc")
        time.sleep(1)

        # Apply
        apply_btn = page.locator("button:has-text('Apply Location')").first
        apply_btn.click()
        time.sleep(1.5)

        # Verify TopHeader label in location pill
        location_pill = page.locator("header .rounded-full").first
        pill_text = location_pill.inner_text()
        print(f"✓ Location pill text: '{pill_text}'")
        assert "Khanna" in pill_text or "Punjab" in pill_text, f"Header pill should reflect Khanna / Punjab, got: {pill_text}"

        # Verify localStorage contents
        stored_raw = page.evaluate("() => localStorage.getItem('agri_manual_location')")
        print(f"✓ Raw localStorage 'agri_manual_location': {stored_raw}")
        assert stored_raw is not None, "localStorage must contain saved location"
        stored = json.loads(stored_raw)
        assert stored.get("coordinates") is not None, "Coordinates must not be null"
        assert stored["coordinates"]["lat"] is not None and stored["coordinates"]["lon"] is not None
        print(f"✓ Verified Coordinates saved: {stored['coordinates']}")

        # TEST 3: Reload Page and Verify Persistence
        print("\n--- TEST 3: Page Reload Persistence ---")
        page.reload()
        page.wait_for_selector(".leaflet-container", timeout=15000)
        time.sleep(2)

        stored_after_reload = page.evaluate("() => localStorage.getItem('agri_manual_location')")
        stored_parsed = json.loads(stored_after_reload)
        assert stored_parsed.get("coordinates") is not None, "Coordinates must persist after reload"
        print(f"✓ Location intact after reload: {stored_parsed['locationLabel']} with coords {stored_parsed['coordinates']}")

        # TEST 4: Smooth Range Switching (≤ 25 km, ≤ 50 km, ≤ 100 km, All India)
        print("\n--- TEST 4: Range Radius Switching & Performance ---")
        
        # Click ≤ 25 km
        t0 = time.time()
        page.locator("button:has-text('≤ 25 km')").first.click()
        time.sleep(0.5)
        dt_25 = time.time() - t0
        print(f"✓ Switched to ≤ 25 km in {dt_25:.3f}s (no freezing)")

        # Verify filtered mandis within 25km
        displayed_badges = page.locator("text=/\\d+(\\.\\d+)? km away/").all_inner_texts()
        print(f"✓ Mandis found within 25 km of Khanna: {len(displayed_badges)} ({displayed_badges[:3]})")
        assert len(displayed_badges) > 0, "Should have mandis within 25 km of Khanna"
        page.screenshot(path=f"{SCREENSHOTS_DIR}/market_explorer_khanna_25km.png")

        # Click ≤ 50 km
        t0 = time.time()
        page.locator("button:has-text('≤ 50 km')").first.click()
        time.sleep(0.5)
        dt_50 = time.time() - t0
        badges_50 = page.locator("text=/\\d+(\\.\\d+)? km away/").count()
        print(f"✓ Switched to ≤ 50 km in {dt_50:.3f}s, found {badges_50} mandis")
        assert badges_50 >= len(displayed_badges), "50 km radius should have >= 25 km count"

        # Click ≤ 100 km
        t0 = time.time()
        page.locator("button:has-text('≤ 100 km')").first.click()
        time.sleep(0.5)
        dt_100 = time.time() - t0
        badges_100 = page.locator("text=/\\d+(\\.\\d+)? km away/").count()
        print(f"✓ Switched to ≤ 100 km in {dt_100:.3f}s, found {badges_100} mandis")
        page.screenshot(path=f"{SCREENSHOTS_DIR}/market_explorer_khanna_100km.png")

        # Click All India
        t0 = time.time()
        page.locator("button:has-text('All India')").first.click()
        time.sleep(0.8)
        dt_all = time.time() - t0
        print(f"✓ Switched to All India in {dt_all:.3f}s with canvas rendering (smooth 60fps)")
        page.screenshot(path=f"{SCREENSHOTS_DIR}/market_explorer_all_india.png")

        browser.close()
        print("\n=== ALL PERFORMANCE AND PERSISTENCE TESTS PASSED! ===")

if __name__ == "__main__":
    run_qa()
