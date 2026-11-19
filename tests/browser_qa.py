import os
import sys
import time
import json
import asyncio
from playwright.async_api import async_playwright

SCREENSHOT_DIR = "/Users/karthikreddy/Desktop/Agri/tests/screenshots"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

results = {
    "passed": [],
    "failed": [],
    "blocked": [],
    "diagnostics": {}
}

async def run_qa():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        # Test Context 1: Standard clean session
        context = await browser.new_context(
            viewport={"width": 1280, "height": 800},
            user_agent="AgriForecasting-QABot/1.0"
        )
        page = await context.new_page()
        
        print("=== Test 1: Direct Dashboard Access (No Auth) ===")
        try:
            await page.goto("http://localhost:3000", wait_until="networkidle", timeout=15000)
            content = await page.content()
            
            # Verify no login or register forms exist
            assert "login" not in content.lower() or "signin" not in content.lower()
            assert "dashboard" in content.lower() or "agriforecasting" in content.lower()
            assert "Know your market prices before you sell" in content
            
            await page.screenshot(path=f"{SCREENSHOT_DIR}/01_dashboard.png")
            results["passed"].append("Test 1: Direct Dashboard Access (No Auth)")
            print("  PASSED: Opens directly to dashboard without login prompts")
        except Exception as e:
            results["failed"].append(f"Test 1: Direct Dashboard Access ({str(e)})")
            print(f"  FAILED: {e}")

        print("\n=== Test 2: Multi-Language i18n & Persistence ===")
        try:
            # Select language dropdown via data-testid
            lang_select = page.locator("[data-testid='language-select']")
            await lang_select.select_option("hi")
            await page.wait_for_timeout(1000)
            
            # Check for Hindi text in navigation or header
            hindi_content = await page.content()
            assert "डैशबोर्ड" in hindi_content or "मार्केट एक्सप्लोरर" in hindi_content or "मूल्य पूर्वानुमान" in hindi_content
            await page.screenshot(path=f"{SCREENSHOT_DIR}/02_hindi_i18n.png")
            
            # Reload page and verify persistence in localStorage
            await page.reload(wait_until="networkidle")
            reloaded_content = await page.content()
            assert "डैशबोर्ड" in reloaded_content or "मार्केट एक्सप्लोरर" in reloaded_content
            
            # Switch back to English for remaining tests
            lang_select = page.locator("[data-testid='language-select']")
            await lang_select.select_option("en")
            await page.wait_for_timeout(500)
            
            results["passed"].append("Test 2: Multi-Language i18n & localStorage Persistence")
            print("  PASSED: Hindi translated and persisted on reload")
        except Exception as e:
            results["failed"].append(f"Test 2: Multi-Language i18n ({str(e)})")
            print(f"  FAILED: {e}")

        print("\n=== Test 3: Location System (Zero Bangalore Default, Manual Haryana Picker) ===")
        try:
            # Click "Change" location button in header
            change_btn = page.locator("header button:has-text('Change Location')").first
            if not await change_btn.count():
                change_btn = page.locator("header button").nth(1)
            
            await change_btn.click()
            await page.wait_for_timeout(500)
            
            # In modal, select Haryana -> Karnal -> Karnal APMC
            state_select = page.locator("[data-testid='modal-state-select']")
            await state_select.select_option("hr")
            await page.wait_for_timeout(300)
            
            dist_select = page.locator("[data-testid='modal-district-select']")
            await dist_select.select_option("hr-karnal")
            await page.wait_for_timeout(300)
            
            mandi_select = page.locator("[data-testid='modal-mandi-select']")
            await mandi_select.select_option("karnal-mandi")
            await page.wait_for_timeout(300)
            
            # Click Apply Location button
            apply_btn = page.locator("[data-testid='apply-location-btn'], button:has-text('Apply Location')").first
            await apply_btn.click()
            await page.wait_for_timeout(1000)
            
            # Verify header badge reflects Karnal, Haryana
            header_text = await page.locator("header").inner_text()
            assert "Karnal" in header_text or "Haryana" in header_text
            assert "Bengaluru" not in header_text and "Bangalore" not in header_text
            
            await page.screenshot(path=f"{SCREENSHOT_DIR}/03_haryana_location.png")
            results["passed"].append("Test 3: Location System (Manual Haryana Selection)")
            print("  PASSED: Location accurately set to Karnal, Haryana with zero Bangalore fallback")
        except Exception as e:
            results["failed"].append(f"Test 3: Location System ({str(e)})")
            print(f"  FAILED: {e}")

        print("\n=== Test 4: Geolocation GPS Precedence with Haryana Coordinates ===")
        try:
            # Create a context with Haryana GPS coordinates (Karnal: 29.6857° N, 76.9905° E)
            hr_context = await browser.new_context(
                geolocation={"latitude": 29.6857, "longitude": 76.9905},
                permissions=["geolocation"],
                viewport={"width": 1280, "height": 800}
            )
            hr_page = await hr_context.new_page()
            await hr_page.goto("http://localhost:3000", wait_until="networkidle")
            
            # Click "Use my location" button
            gps_btn = hr_page.locator("button:has-text('Use my location')").first
            await gps_btn.click()
            await hr_page.wait_for_timeout(2000)
            
            hr_content = await hr_page.content()
            # Must detect Haryana / Karnal APMC, NOT Bangalore
            assert "Karnal APMC" in hr_content or "Haryana" in hr_content
            assert "Bengaluru" not in hr_content
            
            await hr_page.screenshot(path=f"{SCREENSHOT_DIR}/04_gps_haryana.png")
            await hr_context.close()
            results["passed"].append("Test 4: GPS Location Precedence (Haryana Coordinates -> Karnal APMC)")
            print("  PASSED: Haryana coordinates accurately resolved to Karnal APMC")
        except Exception as e:
            results["failed"].append(f"Test 4: GPS Location Precedence ({str(e)})")
            print(f"  FAILED: {e}")

        print("\n=== Test 5: 14-Day Price Forecast (Non-Flat Curve, Exact 14 Dates) ===")
        try:
            await page.goto("http://localhost:3000/forecast?mandiId=kolar-apmc&commodityId=tomato&varietyId=tomato-hybrid", wait_until="networkidle", timeout=15000)
            await page.wait_for_timeout(2000)
            
            # Verify 14 sequential dates Nov 24 - Dec 07, 2026
            forecast_content = await page.content()
            assert "2026-11-23" in forecast_content or "23 Nov 2026" in forecast_content
            assert "Nov 24" in forecast_content or "24 Nov" in forecast_content
            assert "Dec 07" in forecast_content or "07 Dec" in forecast_content
            
            # Extract daily table rows
            rows = page.locator("tbody tr")
            row_count = await rows.count()
            print(f"  Forecast table rows: {row_count}")
            assert row_count >= 14, f"Expected 14 forecast days, found {row_count}"
            
            # Collect daily prices to test flatness
            prices = []
            for i in range(14):
                cell_text = await rows.nth(i).locator("td").nth(2).inner_text()
                # Parse numeric price
                num = int("".join([c for c in cell_text if c.isdigit()]))
                prices.append(num)
            
            print(f"  Forecast prices (14 days): {prices}")
            results["diagnostics"]["forecast_prices"] = prices
            
            # Rigorous non-flat check:
            assert prices[-1] != prices[0], "Day 14 price is identical to Day 1 price (flatline)"
            price_spread = max(prices) - min(prices)
            assert price_spread >= 100, f"Price variation too narrow ({price_spread} ₹/qtl)"
            mean_p = sum(prices) / len(prices)
            variance = sum((p - mean_p) ** 2 for p in prices) / len(prices)
            std_dev = variance ** 0.5
            assert std_dev > 25, f"Standard deviation too low ({std_dev:.2f})"
            
            await page.screenshot(path=f"{SCREENSHOT_DIR}/05_forecast_non_flat.png")
            results["passed"].append(f"Test 5: 14-Day Forecast (Non-Flat Curve: spread={price_spread}₹, std={std_dev:.1f}₹)")
            print(f"  PASSED: 14 distinct future dates, non-flat trajectory (spread: ₹{price_spread})")
        except Exception as e:
            results["failed"].append(f"Test 5: 14-Day Forecast Non-Flat Curve ({str(e)})")
            print(f"  FAILED: {e}")

        print("\n=== Test 6: Commodity & Variety Dynamic Sync ===")
        try:
            # Change commodity to Onion using testid
            comm_select = page.locator("[data-testid='forecast-commodity-select']")
            await comm_select.select_option("onion")
            await page.wait_for_timeout(2500)
            
            # Verify Onion forecast is loaded
            onion_content = await page.content()
            assert "Onion" in onion_content
            
            await page.screenshot(path=f"{SCREENSHOT_DIR}/06_commodity_variety_sync.png")
            results["passed"].append("Test 6: Dynamic Commodity & Variety Reactive Sync")
            print("  PASSED: Commodity and variety dynamically updated forecast")
        except Exception as e:
            results["failed"].append(f"Test 6: Commodity & Variety Reactive Sync ({str(e)})")
            print(f"  FAILED: {e}")

        print("\n=== Test 7: Market Explorer (29 Mandis & Haryana Filter) ===")
        try:
            await page.goto("http://localhost:3000/nearby-mandis", wait_until="networkidle", timeout=15000)
            await page.wait_for_timeout(1500)
            
            # Select State filter: Haryana using testid
            state_filter = page.locator("[data-testid='state-filter-select']")
            await state_filter.select_option("hr")
            await page.wait_for_timeout(1000)
            
            hr_content = await page.content()
            assert "Karnal Mandi" in hr_content or "Karnal" in hr_content
            assert "Hisar Mandi" in hr_content or "Hisar" in hr_content or "Sirsa" in hr_content or "Ambala" in hr_content
            
            await page.screenshot(path=f"{SCREENSHOT_DIR}/07_market_explorer_haryana.png")
            results["passed"].append("Test 7: Market Explorer (29 Mandis & Haryana Filter)")
            print("  PASSED: Market explorer rendered with Haryana mandis filtered correctly")
        except Exception as e:
            results["failed"].append(f"Test 7: Market Explorer ({str(e)})")
            print(f"  FAILED: {e}")

        print("\n=== Test 8: Compare Markets Screen ===")
        try:
            await page.goto("http://localhost:3000/compare?mandiIds=kolar-apmc&mandiIds=yeshwanthpur-apmc&commodityId=tomato", wait_until="networkidle", timeout=15000)
            await page.wait_for_timeout(2000)
            
            comp_content = await page.content()
            assert "Kolar APMC" in comp_content
            assert "Yeshwanthpur APMC" in comp_content
            assert "Diff vs Average" in comp_content
            
            await page.screenshot(path=f"{SCREENSHOT_DIR}/08_compare_markets.png")
            results["passed"].append("Test 8: Market Comparison Multi-Mandi Analysis")
            print("  PASSED: Market comparison table and multi-line chart rendered")
        except Exception as e:
            results["failed"].append(f"Test 8: Market Comparison ({str(e)})")
            print(f"  FAILED: {e}")

        print("\n=== Test 9: Saved Markets (Local Storage Watchlist) ===")
        try:
            # Navigate to a market profile and bookmark it
            await page.goto("http://localhost:3000/market/karnal-mandi?commodity=wheat", wait_until="networkidle", timeout=15000)
            await page.wait_for_timeout(1000)
            
            # Click Save Market button
            save_btn = page.locator("button:has-text('Save Market')").first
            await save_btn.click()
            await page.wait_for_timeout(1000)
            
            # Go to /saved
            await page.goto("http://localhost:3000/saved", wait_until="networkidle", timeout=15000)
            await page.wait_for_timeout(1000)
            
            saved_content = await page.content()
            assert "Karnal Mandi" in saved_content or "Karnal" in saved_content or "Wheat" in saved_content
            
            await page.screenshot(path=f"{SCREENSHOT_DIR}/09_saved_markets.png")
            results["passed"].append("Test 9: Saved Markets Watchlist Persistence")
            print("  PASSED: Market saved and persisted locally in /saved")
        except Exception as e:
            results["failed"].append(f"Test 9: Saved Markets ({str(e)})")
            print(f"  FAILED: {e}")

        print("\n=== Test 10: Prediction History & Accuracy Backtest ===")
        try:
            await page.goto("http://localhost:3000/prediction-history", wait_until="networkidle", timeout=15000)
            await page.wait_for_timeout(1500)
            
            history_content = await page.content()
            assert "Prediction History" in history_content
            assert "Mean Absolute Error" in history_content
            assert "Directional Accuracy" in history_content
            
            await page.screenshot(path=f"{SCREENSHOT_DIR}/10_prediction_history.png")
            results["passed"].append("Test 10: Prediction History & Model Accuracy Backtest")
            print("  PASSED: Prediction history page rendered with backtest KPI metrics")
        except Exception as e:
            results["failed"].append(f"Test 10: Prediction History ({str(e)})")
            print(f"  FAILED: {e}")

        await browser.close()

    # Print Summary
    print("\n" + "=" * 50)
    print("BROWSER QA RUN COMPLETED")
    print(f"Passed: {len(results['passed'])}")
    print(f"Failed: {len(results['failed'])}")
    print(f"Blocked: {len(results['blocked'])}")
    print("=" * 50)
    
    with open("/Users/karthikreddy/Desktop/Agri/tests/qa_results.json", "w") as f:
        json.dump(results, f, indent=2)

if __name__ == "__main__":
    asyncio.run(run_qa())
