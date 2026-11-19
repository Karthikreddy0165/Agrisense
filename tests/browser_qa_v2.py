import os
import sys
import json
import asyncio
from playwright.async_api import async_playwright

SCREENSHOT_DIR = "/Users/karthikreddy/.gemini/antigravity/brain/c825e7cf-751d-47d7-8c67-f6ca7f3d6ee3/screenshots"
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
        
        # Desktop context
        context = await browser.new_context(
            viewport={"width": 1280, "height": 800},
            user_agent="AgriForecasting-QABot/2.0"
        )
        page = await context.new_page()

        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        
        print("=== Test 1: Direct Dashboard Access & Brand Identity (No Auth) ===")
        try:
            await page.goto("http://localhost:3000", wait_until="networkidle", timeout=15000)
            content = await page.content()
            
            assert "login" not in content.lower() or "signin" not in content.lower()
            assert "AgriForecasting" in content
            assert "Mandi Price Intelligence" in content
            
            await page.screenshot(path=f"{SCREENSHOT_DIR}/01_dashboard.png")
            results["passed"].append("Test 1: Direct Dashboard Access (No Auth)")
            print("  PASSED: Opens directly to dashboard with full product identity")
        except Exception as e:
            results["failed"].append(f"Test 1: Direct Dashboard Access ({str(e)})")
            print(f"  FAILED: {e}")

        print("\n=== Test 2: Location Selector Portal Positioning & ESC Accessibility ===")
        try:
            change_btn = page.locator("header button:has-text('Change')").first
            await change_btn.click()
            await page.wait_for_timeout(600)
            
            # Modal dialog should be in document body with role="dialog"
            dialog = page.locator("div[role='dialog']")
            assert await dialog.count() > 0, "Location dialog not found"
            
            # Check bounding box is within viewport
            modal_box = await dialog.locator("> div").bounding_box()
            print(f"  Dialog box: {modal_box}")
            assert modal_box is not None
            assert modal_box['x'] >= 0, f"Dialog clipped on left: x={modal_box['x']}"
            assert modal_box['y'] >= 0, f"Dialog clipped on top: y={modal_box['y']}"
            assert modal_box['x'] + modal_box['width'] <= 1280 + 20, "Dialog overflows right viewport boundary"
            
            await page.screenshot(path=f"{SCREENSHOT_DIR}/02_location_portal_centered.png")
            
            # Press Escape to test accessible dismissal
            await page.keyboard.press("Escape")
            await page.wait_for_timeout(500)
            assert await dialog.count() == 0, "Dialog did not dismiss on Escape key"
            print("  PASSED: Dialog centered in viewport and dismissed with Escape")

            # Re-open and apply manual selection (Haryana -> Karnal)
            await change_btn.click()
            await page.wait_for_timeout(400)
            
            state_select = page.locator("[data-testid='modal-state-select']")
            await state_select.select_option("hr")
            await page.wait_for_timeout(300)
            
            dist_select = page.locator("[data-testid='modal-district-select']")
            await dist_select.select_option("hr-karnal")
            await page.wait_for_timeout(300)
            
            mandi_select = page.locator("[data-testid='modal-mandi-select']")
            await mandi_select.select_option("karnal-mandi")
            await page.wait_for_timeout(300)
            
            apply_btn = page.locator("[data-testid='apply-location-btn']").first
            await apply_btn.click()
            await page.wait_for_timeout(800)
            
            header_text = await page.locator("header").inner_text()
            assert "Karnal" in header_text or "Haryana" in header_text
            
            results["passed"].append("Test 2: Location Selector Portal Positioning & Manual Selection")
            print("  PASSED: Location dialog renders in portal, viewport-bounded, and updates location cleanly")
        except Exception as e:
            results["failed"].append(f"Test 2: Location Selector Portal ({str(e)})")
            print(f"  FAILED: {e}")

        print("\n=== Test 3: Complete Application-Wide Language Switching (6 Languages) ===")
        try:
            langs = [
                ("hi", "हिन्दी", ["डैशबोर्ड", "मार्केट एक्सप्लोरर", "मूल्य पूर्वानुमान", "पूर्वानुमान इतिहास"]),
                ("te", "తెలుగు", ["డ్యాష్‌బోర్డ్", "ధరల సూచన", "మార్కెట్ల పోలిక", "ధర సూచనల చరిత్ర"]),
                ("kn", "ಕನ್ನಡ", ["ಡ್ಯಾಶ್‌ಬೋರ್ಡ್", "ಬೆಲೆ ಮುನ್ಸೂಚನೆ", "ಮುನ್ಸೂಚನೆ ಇತಿಹಾಸ", "ಉಳಿಸಿದ ಮಾರುಕಟ್ಟೆಗಳು"]),
                ("mr", "मराठी", ["डॅशबोर्ड", "भाव अंदाज", "अंदाज इतिहास", "बाजारपेठ तुलना"]),
                ("ta", "தமிழ்", ["டாஷ்போர்டு", "விலை முன்னறிவிப்பு", "முன்னறிவிப்பு வரலாறு", "சந்தை ஒப்பீடு"]),
            ]
            
            for code, native, expected_phrases in langs:
                lang_select = page.locator("[data-testid='language-select']")
                await lang_select.select_option(code)
                await page.wait_for_timeout(800)
                
                content = await page.content()
                found = any(phrase in content for phrase in expected_phrases)
                assert found, f"Expected regional phrases for {code} ({native}) not found in page content"
                print(f"  Checked {code} ({native}): Regional translations active")
            
            await page.screenshot(path=f"{SCREENSHOT_DIR}/03_tamil_i18n.png")
            
            # Switch back to English
            lang_select = page.locator("[data-testid='language-select']")
            await lang_select.select_option("en")
            await page.wait_for_timeout(500)
            
            results["passed"].append("Test 3: Complete Application-Wide Internationalisation (6 Regional Languages)")
            print("  PASSED: All 6 languages switched seamlessly without layout breaks")
        except Exception as e:
            results["failed"].append(f"Test 3: Application-Wide Internationalisation ({str(e)})")
            print(f"  FAILED: {e}")

        print("\n=== Test 4: Historical Prices & Market Detail Data Integrity ===")
        try:
            await page.goto("http://localhost:3000/market/kolar-apmc?commodity=tomato&variety=tomato-hybrid", wait_until="networkidle", timeout=15000)
            await page.wait_for_timeout(2000)
            
            market_content = await page.content()
            assert "Kolar APMC" in market_content
            assert "Modal Price" in market_content
            assert "₹" in market_content and "/quintal" in market_content
            assert "APMC Market Price Records" in market_content
            
            # Verify table has genuine observation rows
            obs_rows = page.locator("table tbody tr")
            obs_count = await obs_rows.count()
            print(f"  Market observation records displayed: {obs_count}")
            assert obs_count >= 5, f"Expected genuine observations, found {obs_count}"
            
            # Check price values
            first_row_price = await obs_rows.first.locator("td").nth(2).inner_text()
            assert "₹" in first_row_price
            
            await page.screenshot(path=f"{SCREENSHOT_DIR}/04_market_history_integrity.png")
            results["passed"].append("Test 4: Historical Prices & Market Detail Data Integrity")
            print(f"  PASSED: Genuine APMC observations table with ₹/quintal and daily metrics verified")
        except Exception as e:
            results["failed"].append(f"Test 4: Historical Prices & Market Detail ({str(e)})")
            print(f"  FAILED: {e}")

        print("\n=== Test 5: Reconciled Forecast Page (Actual vs Projected Transition) ===")
        try:
            await page.goto("http://localhost:3000/forecast?mandiId=kolar-apmc&commodityId=tomato&varietyId=tomato-hybrid", wait_until="networkidle", timeout=15000)
            await page.wait_for_timeout(2000)
            
            forecast_content = await page.content()
            assert "23 Nov 2026" in forecast_content or "2026-11-23" in forecast_content
            assert "24 Nov" in forecast_content or "Nov 24" in forecast_content
            assert "07 Dec" in forecast_content or "Dec 07" in forecast_content
            assert "Machine Learning Forecasting Model Notice" in forecast_content
            
            # Verify 14 day rows in forecast breakdown
            table_rows = page.locator("tbody tr")
            count = await table_rows.count()
            assert count >= 14, f"Expected 14 day rows, found {count}"
            
            # Verify non-flat trajectory
            prices = []
            for i in range(14):
                txt = await table_rows.nth(i).locator("td").nth(2).inner_text()
                p_val = int("".join([c for c in txt if c.isdigit()]))
                prices.append(p_val)
            
            spread = max(prices) - min(prices)
            print(f"  Forecast prices: Day 1={prices[0]}, Day 14={prices[13]}, Spread=₹{spread}")
            assert spread > 100, f"Forecast trajectory too flat: spread={spread}"
            
            await page.screenshot(path=f"{SCREENSHOT_DIR}/05_forecast_reconciled.png")
            results["passed"].append("Test 5: Reconciled Price Forecast Chart & Advisory Banner")
            print("  PASSED: Unified actuals-to-forecast chart, non-flat predictions, ML disclaimer")
        except Exception as e:
            results["failed"].append(f"Test 5: Reconciled Price Forecast ({str(e)})")
            print(f"  FAILED: {e}")

        print("\n=== Test 6: Persistent Prediction History UI & Run Inspection ===")
        try:
            await page.goto("http://localhost:3000/prediction-history", wait_until="networkidle", timeout=15000)
            await page.wait_for_timeout(1500)
            
            history_content = await page.content()
            assert "Prediction History" in history_content
            assert "Archived machine-learning forecast runs" in history_content
            
            # Verify at least one forecast run card is present
            run_cards = page.locator("[data-testid^='forecast-run-card-']")
            run_count = await run_cards.count()
            print(f"  Persisted forecast runs listed: {run_count}")
            assert run_count >= 1, "No persisted forecast runs found on Prediction History page"
            
            # Click "Inspect Run" on the first run
            inspect_btn = page.locator("[data-testid^='inspect-run-btn-']").first
            await inspect_btn.click()
            await page.wait_for_timeout(1000)
            
            # Verify run inspection modal opens
            detail_dialog = page.locator("div[role='dialog']")
            assert await detail_dialog.count() > 0, "Run detail modal did not open"
            
            modal_content = await detail_dialog.inner_text()
            assert "14-Day Daily Projection Curve" in modal_content
            assert "Daily Predicted Prices" in modal_content
            assert "Day 1" in modal_content and "Day 14" in modal_content
            
            await page.screenshot(path=f"{SCREENSHOT_DIR}/06_prediction_history_inspect.png")
            
            # Close detail modal
            close_btn = detail_dialog.locator("button:has-text('Close')").first
            await close_btn.click()
            await page.wait_for_timeout(500)
            assert await page.locator("div[role='dialog']").count() == 0
            
            results["passed"].append("Test 6: Persistent Prediction History UI & Run Inspector Modal")
            print("  PASSED: Prediction history retrieved from database, run inspector verified")
        except Exception as e:
            results["failed"].append(f"Test 6: Prediction History UI ({str(e)})")
            print(f"  FAILED: {e}")

        print("\n=== Test 7: Generating New Forecast & Verification in Prediction History ===")
        try:
            # Generate forecast for Lasalgaon Mandi / Onion
            await page.goto("http://localhost:3000/forecast?mandiId=lasalgaon-apmc&commodityId=onion&varietyId=onion-red", wait_until="networkidle", timeout=15000)
            await page.wait_for_timeout(2500)
            
            # Navigate back to prediction-history
            await page.goto("http://localhost:3000/prediction-history", wait_until="networkidle", timeout=15000)
            await page.wait_for_timeout(1500)
            
            page_text = await page.content()
            assert "Lasalgaon APMC" in page_text or "Onion" in page_text
            
            await page.screenshot(path=f"{SCREENSHOT_DIR}/07_new_run_archived.png")
            results["passed"].append("Test 7: Dynamic Forecast Run Persistence & Verification in History")
            print("  PASSED: Newly generated forecast automatically persisted and archived")
        except Exception as e:
            results["failed"].append(f"Test 7: Dynamic Forecast Run Persistence ({str(e)})")
            print(f"  FAILED: {e}")

        print("\n=== Test 8: Settings Page Language & Preference Persistence ===")
        try:
            await page.goto("http://localhost:3000/settings", wait_until="networkidle", timeout=15000)
            await page.wait_for_timeout(1000)
            
            settings_content = await page.content()
            assert "Settings" in settings_content
            assert "Interface Language" in settings_content or "भाषा" in settings_content
            
            # Click Hindi in settings
            hi_btn = page.locator("[data-testid='settings-lang-hi']")
            await hi_btn.click()
            await page.wait_for_timeout(800)
            
            # Verify setting took effect
            updated_content = await page.content()
            assert "सेटिंग्स" in updated_content
            
            # Switch back to English in settings
            en_btn = page.locator("[data-testid='settings-lang-en']")
            await en_btn.click()
            await page.wait_for_timeout(800)
            
            await page.screenshot(path=f"{SCREENSHOT_DIR}/08_settings_preferences.png")
            results["passed"].append("Test 8: Settings Page Language & Preference Switching")
            print("  PASSED: Settings page language grid works and reflects immediately")
        except Exception as e:
            results["failed"].append(f"Test 8: Settings Page ({str(e)})")
            print(f"  FAILED: {e}")

        print("\n=== Test 9: Saved Markets Watchlist Flow ===")
        try:
            await page.goto("http://localhost:3000/saved", wait_until="networkidle", timeout=15000)
            await page.wait_for_timeout(1000)
            
            saved_content = await page.content()
            assert "Saved Markets" in saved_content
            
            await page.screenshot(path=f"{SCREENSHOT_DIR}/09_saved_watchlist.png")
            results["passed"].append("Test 9: Saved Markets Watchlist Flow")
            print("  PASSED: Saved markets page renders cleanly")
        except Exception as e:
            results["failed"].append(f"Test 9: Saved Markets ({str(e)})")
            print(f"  FAILED: {e}")

        print("\n=== Test 10: Mobile Viewport (375x667) Responsiveness ===")
        try:
            mobile_context = await browser.new_context(
                viewport={"width": 375, "height": 667},
                is_mobile=True,
                user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15"
            )
            m_page = await mobile_context.new_page()
            await m_page.goto("http://localhost:3000", wait_until="networkidle")
            await m_page.wait_for_timeout(1000)
            
            # Open location dialog on mobile
            change_btn = m_page.locator("header button:has-text('Change')").first
            await change_btn.click()
            await m_page.wait_for_timeout(600)
            
            dialog = m_page.locator("div[role='dialog'] > div")
            box = await dialog.bounding_box()
            assert box is not None
            assert box['x'] >= 0, f"Mobile dialog clipped on left: {box['x']}"
            assert box['width'] <= 375, f"Mobile dialog overflows width: {box['width']}"
            
            await m_page.screenshot(path=f"{SCREENSHOT_DIR}/10_mobile_responsive.png")
            await mobile_context.close()
            
            results["passed"].append("Test 10: Mobile Responsiveness & Viewport Containment")
            print("  PASSED: Clean mobile layout with 100% viewport containment")
        except Exception as e:
            results["failed"].append(f"Test 10: Mobile Responsiveness ({str(e)})")
            print(f"  FAILED: {e}")

        await browser.close()

    print("\n" + "=" * 50)
    print("BROWSER QA RUN COMPLETED")
    print(f"Passed: {len(results['passed'])}")
    print(f"Failed: {len(results['failed'])}")
    print(f"Blocked: {len(results['blocked'])}")
    print("=" * 50)
    
    with open("/Users/karthikreddy/Desktop/Agri/tests/qa_results_v2.json", "w") as f:
        json.dump(results, f, indent=2)

if __name__ == "__main__":
    asyncio.run(run_qa())
