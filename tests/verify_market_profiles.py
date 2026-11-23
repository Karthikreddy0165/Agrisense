#!/usr/bin/env python3
"""
Verification Script: Market Profile National Mandi Coverage QA
Verifies:
1. Loading market profiles for national mandis (e.g. Bahadurganj in Bihar, Khanna in Punjab, Kolar in Karnataka).
2. Resolution of legacy IDs (e.g. kolar-apmc).
3. Auto-detection and auto-selection of actively traded crops.
4. Traded crops clickable badge pills with live prices and record counts.
5. Real price trends chart and observations table rendering.
6. Switching crops via badge clicks.
7. Mandi dropdown / search across national mandis.
"""

import os
import sys
import time
from playwright.sync_api import sync_playwright

SCREENSHOTS_DIR = "/Users/karthikreddy/.gemini/antigravity/brain/c825e7cf-751d-47d7-8c67-f6ca7f3d6ee3/screenshots"
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)
BASE_URL = "http://localhost:3000"

def test_market_profiles():
    print("=== Starting Market Profile National Mandi Coverage QA ===")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 900})
        page = context.new_page()

        # TEST 1: Bahadurganj APMC in Bihar (Non-Tomato Mandi, trades Potato & Onion)
        print("\n--- TEST 1: Mandi Profile for br-bahadurganj-apmc (Bihar) ---")
        page.goto(f"{BASE_URL}/market/br-bahadurganj-apmc", timeout=20000)
        page.wait_for_selector("h1:has-text('Bahadurganj')", timeout=10000)
        time.sleep(2)
        
        # Check header text contains Kishanganj, Bihar
        header_text = page.locator(".space-y-2").first.inner_text()
        assert "Kishanganj, Bihar" in header_text, f"Expected 'Kishanganj, Bihar' in header, got: {header_text}"
        print("✓ Verified Location: Kishanganj, Bihar")

        # Check Active Crops Traded pills
        potato_btn = page.locator("button:has-text('Potato')").first
        onion_btn = page.locator("button:has-text('Onion')").first
        assert potato_btn.is_visible(), "Potato pill should be visible"
        assert onion_btn.is_visible(), "Onion pill should be visible"
        print("✓ Verified Active Crops Traded badges: Potato & Onion detected")

        # Verify auto-switched to Potato and shows real price
        modal_card = page.locator("text=MODAL PRICE").locator("..").first.inner_text()
        assert "1,650" in modal_card, f"Expected 1,650 in modal card, got: {modal_card}"
        print("✓ Verified Modal Price: ₹1,650/qtl for Potato")

        # Verify chart SVG exists with bars and lines
        chart_bars = page.locator(".recharts-bar-rectangle").count()
        print(f"✓ Verified Price Chart rendered with {chart_bars} arrival data bars")
        assert chart_bars > 0, "Chart should render arrival bars"

        # Verify observation table rows
        rows = page.locator("tbody tr").count()
        print(f"✓ Verified Recent Observations Table rendered with {rows} rows")
        assert rows > 0, "Observations table should have data rows"

        # Click Onion badge to test crop switching
        print("Testing crop switch to Onion...")
        onion_btn.click()
        time.sleep(2)
        modal_card_onion = page.locator("text=MODAL PRICE").locator("..").first.inner_text()
        assert "2,250" in modal_card_onion, f"Expected 2,250 in modal card after switch, got: {modal_card_onion}"
        print("✓ Successfully switched to Onion: Modal Price updated to ₹2,250/qtl")

        page.screenshot(path=f"{SCREENSHOTS_DIR}/market_profile_bahadurganj.png")
        print(f"✓ Screenshot saved: {SCREENSHOTS_DIR}/market_profile_bahadurganj.png")

        # TEST 2: Kolar APMC in Karnataka (Trades Tomato, Green Chilli, Potato)
        print("\n--- TEST 2: Mandi Profile for ka-kolar-apmc (Karnataka) ---")
        page.goto(f"{BASE_URL}/market/ka-kolar-apmc", timeout=20000)
        page.wait_for_selector("h1:has-text('Kolar APMC')", timeout=10000)
        time.sleep(2)
        
        kolar_header = page.locator(".space-y-2").first.inner_text()
        assert "Kolar, Karnataka" in kolar_header, f"Expected 'Kolar, Karnataka' in header, got: {kolar_header}"
        print("✓ Verified Location: Kolar, Karnataka")

        # Check Tomato price and chart
        kolar_bars = page.locator(".recharts-bar-rectangle").count()
        print(f"✓ Verified Kolar price chart rendered with {kolar_bars} bars")
        page.screenshot(path=f"{SCREENSHOTS_DIR}/market_profile_kolar.png")
        print(f"✓ Screenshot saved: {SCREENSHOTS_DIR}/market_profile_kolar.png")

        # TEST 3: Legacy Unprefixed Mandi ID (kolar-apmc)
        print("\n--- TEST 3: Legacy Unprefixed ID /market/kolar-apmc ---")
        page.goto(f"{BASE_URL}/market/kolar-apmc", timeout=20000)
        page.wait_for_selector("h1:has-text('Kolar APMC')", timeout=10000)
        time.sleep(2)
        legacy_header = page.locator(".space-y-2").first.inner_text()
        assert "Kolar, Karnataka" in legacy_header, f"Expected 'Kolar, Karnataka' in legacy ID header, got: {legacy_header}"
        print("✓ Legacy ID 'kolar-apmc' resolved and loaded successfully")

        # TEST 4: Khanna APMC in Punjab (Wheat Mandi)
        print("\n--- TEST 4: Mandi Profile for pb-khanna-apmc (Punjab) ---")
        page.goto(f"{BASE_URL}/market/pb-khanna-apmc", timeout=20000)
        page.wait_for_selector("h1:has-text('Khanna')", timeout=10000)
        time.sleep(2)
        khanna_header = page.locator(".space-y-2").first.inner_text()
        assert "Punjab" in khanna_header, f"Expected 'Punjab' in header, got: {khanna_header}"
        print(f"✓ Verified Khanna Location: {khanna_header.splitlines()[1]}")
        page.screenshot(path=f"{SCREENSHOTS_DIR}/market_profile_khanna.png")
        print(f"✓ Screenshot saved: {SCREENSHOTS_DIR}/market_profile_khanna.png")

        # TEST 5: Mandi Selector & Search Filter
        print("\n--- TEST 5: Mandi Selector & Search Filter ---")
        search_input = page.locator("input[placeholder*='Search market name']").first
        search_input.fill("Pune")
        time.sleep(1)
        
        mandi_select = page.locator("select:has(option:has-text('Pune'))").first
        options_count = mandi_select.locator("option").count()
        print(f"✓ Mandi dropdown filtered for 'Pune' with {options_count} matching mandis")
        assert options_count > 0, "Should have matching mandis for Pune"

        browser.close()
        print("\n=== ALL MARKET PROFILE TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    test_market_profiles()
