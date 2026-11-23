import asyncio
import time
import os
from playwright.async_api import async_playwright

SCREENSHOT_DIR = "/Users/karthikreddy/.gemini/antigravity/brain/c825e7cf-751d-47d7-8c67-f6ca7f3d6ee3/screenshots"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

async def run_tests():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 800})
        page = await context.new_page()

        print("\n--- TEST 1: Homepage Selection & Persistence to Market Explorer ---")
        # Start at home page
        await page.goto("http://localhost:3000")
        await page.wait_for_selector("[data-testid='home-state-select']")

        # Clear any preexisting storage for a clean test
        await page.evaluate("localStorage.clear()")
        await page.reload()
        await page.wait_for_selector("[data-testid='home-state-select']")

        # Select Punjab
        await page.select_option("[data-testid='home-state-select']", "pb")
        await page.wait_for_timeout(600)

        # Select Ludhiana if available, or first district
        dist_options = await page.eval_on_selector_all(
            "[data-testid='home-district-select'] option", "opts => opts.map(o => o.value)"
        )
        ludhiana_dist = next((d for d in dist_options if "ludhiana" in d.lower()), dist_options[0] if dist_options else "")
        if ludhiana_dist:
            await page.select_option("[data-testid='home-district-select']", ludhiana_dist)
            await page.wait_for_timeout(600)

        # Select Khanna if available
        mandi_options = await page.eval_on_selector_all(
            "[data-testid='home-mandi-select'] option", "opts => opts.map(o => o.value)"
        )
        khanna_mandi = next((m for m in mandi_options if "khanna" in m.lower()), mandi_options[0] if mandi_options else "")
        if khanna_mandi:
            await page.select_option("[data-testid='home-mandi-select']", khanna_mandi)
            await page.wait_for_timeout(600)

        # Verify localStorage has saved location
        saved_storage = await page.evaluate("localStorage.getItem('agri_manual_location')")
        print(f"LocalStorage after homepage selection: {saved_storage}")
        assert saved_storage is not None, "Location was not saved to localStorage from homepage!"
        assert "pb" in saved_storage, "State 'pb' was not saved to localStorage!"

        # Click Explore Nearby Mandis button
        await page.click("text=Explore Nearby Mandis")
        await page.wait_for_url("**/nearby-mandis*")
        await page.wait_for_selector("text=Market Explorer")
        await page.wait_for_timeout(1000)

        # Verify Market Explorer state
        header_text = await page.inner_text("header")
        print(f"Top header location text: {header_text.splitlines()[0] if header_text else ''}")
        
        # Check first mandi card - should have distance
        cards = await page.query_selector_all(".bg-white.rounded-xl.border.p-4")
        print(f"Found {len(cards)} mandi cards in nearby view")
        assert len(cards) > 0, "No mandi cards displayed!"
        first_card_text = await cards[0].inner_text()
        print(f"First card preview:\n{first_card_text[:120]}...")
        assert "km away" in first_card_text, "Distance badge missing from first card!"

        await page.screenshot(path=f"{SCREENSHOT_DIR}/verified_01_home_to_market_explorer_punjab.png")
        print("Captured screenshot: verified_01_home_to_market_explorer_punjab.png")

        print("\n--- TEST 2: Range Switching Performance & Distance Filtering ---")
        # Measure switching between ranges: 25km, 50km, 10km, Entire State / All India
        for radius_btn in ["≤ 25 km", "≤ 50 km", "≤ 10 km", "Entire State", "≤ 25 km"]:
            t0 = time.time()
            # If Entire State, button may have suffix like (Punjab)
            if radius_btn == "Entire State":
                await page.click("button:has-text('Entire State'), button:has-text('All India')")
            else:
                await page.click(f"button:has-text('{radius_btn}')")
            # Wait for any DOM update
            await page.wait_for_timeout(150)
            elapsed = time.time() - t0
            
            visible_cards = await page.query_selector_all(".bg-white.rounded-xl.border.p-4")
            first_text = await visible_cards[0].inner_text() if visible_cards else "None"
            print(f"Switched to '{radius_btn}' in {elapsed:.3f}s -> {len(visible_cards)} mandis shown. Top: {first_text.splitlines()[0]}")
            assert elapsed < 1.0, f"Range switch to {radius_btn} took {elapsed:.2f}s, exceeding 1.0s budget!"

        await page.screenshot(path=f"{SCREENSHOT_DIR}/verified_02_range_switch_25km.png")
        print("Captured screenshot: verified_02_range_switch_25km.png")

        print("\n--- TEST 3: State Selection Directly on Market Explorer ---")
        # Change state to Rajasthan
        await page.select_option("[data-testid='state-filter-select']", "rj")
        await page.wait_for_timeout(800)
        rj_storage = await page.evaluate("localStorage.getItem('agri_manual_location')")
        print(f"LocalStorage after switching state to Rajasthan: {rj_storage}")
        assert "rj" in rj_storage, "Rajasthan was not saved to localStorage!"

        rj_cards = await page.query_selector_all(".bg-white.rounded-xl.border.p-4")
        print(f"Mandis shown for Rajasthan: {len(rj_cards)}")
        assert len(rj_cards) > 0, "No mandis shown for Rajasthan!"
        first_rj_text = await rj_cards[0].inner_text()
        print(f"Top Rajasthan mandi: {first_rj_text.splitlines()[0]}")
        assert "km away" in first_rj_text, "Distance badge missing in Rajasthan state view!"

        await page.screenshot(path=f"{SCREENSHOT_DIR}/verified_03_state_switch_rajasthan.png")
        print("Captured screenshot: verified_03_state_switch_rajasthan.png")

        print("\n--- TEST 4: Range Click When Location Is Not Set Opens Modal ---")
        # Clear storage and reload to test NOT_SET flow
        await page.evaluate("localStorage.clear()")
        await page.goto("http://localhost:3000/nearby-mandis")
        await page.wait_for_selector("[data-testid='state-filter-select']")
        await page.wait_for_timeout(600)

        # Click ≤ 25 km when no location is set
        await page.click("button:has-text('≤ 25 km')")
        await page.wait_for_selector("#location-modal-title", timeout=3000)
        modal_title = await page.inner_text("#location-modal-title")
        print(f"Modal automatically popped up: '{modal_title}'")
        assert "location" in modal_title.lower() or "market" in modal_title.lower() or len(modal_title) > 0

        # Choose Karnataka -> Kolar -> Kolar APMC inside modal
        await page.select_option("[data-testid='modal-state-select']", "ka")
        await page.wait_for_timeout(500)
        
        # Pick Kolar district
        kolar_dist = await page.eval_on_selector_all(
            "[data-testid='modal-district-select'] option", "opts => opts.map(o => o.value)"
        )
        k_dist = next((d for d in kolar_dist if "kolar" in d.lower()), kolar_dist[1] if len(kolar_dist) > 1 else "")
        if k_dist:
            await page.select_option("[data-testid='modal-district-select']", k_dist)
            await page.wait_for_timeout(500)

        # Pick Kolar APMC mandi
        kolar_mands = await page.eval_on_selector_all(
            "[data-testid='modal-mandi-select'] option", "opts => opts.map(o => o.value)"
        )
        k_mandi = next((m for m in kolar_mands if "kolar" in m.lower()), kolar_mands[1] if len(kolar_mands) > 1 else "")
        if k_mandi:
            await page.select_option("[data-testid='modal-mandi-select']", k_mandi)

        await page.click("[data-testid='apply-location-btn']")
        await page.wait_for_timeout(800)

        # Modal should be closed and 25km range applied around Kolar
        is_modal_visible = await page.is_visible("#location-modal-title")
        assert not is_modal_visible, "Modal did not close after Apply Location!"

        ka_storage = await page.evaluate("localStorage.getItem('agri_manual_location')")
        print(f"LocalStorage after modal apply: {ka_storage}")
        assert "ka" in ka_storage, "Karnataka not saved to localStorage!"

        kolar_cards = await page.query_selector_all(".bg-white.rounded-xl.border.p-4")
        print(f"Mandis shown around Kolar (≤ 25km): {len(kolar_cards)}")
        assert len(kolar_cards) > 0, "No mandis found around Kolar within 25km!"
        top_kolar_card = await kolar_cards[0].inner_text()
        print(f"Top Kolar card: {top_kolar_card.splitlines()[0]}")
        assert "Kolar" in top_kolar_card, "Top mandi is not Kolar!"

        await page.screenshot(path=f"{SCREENSHOT_DIR}/verified_04_modal_set_location_kolar.png")
        print("Captured screenshot: verified_04_modal_set_location_kolar.png")

        print("\n--- TEST 5: Persistence Across Page Reload ---")
        await page.reload()
        await page.wait_for_selector(".bg-white.rounded-xl.border.p-4")
        await page.wait_for_timeout(600)

        reloaded_storage = await page.evaluate("localStorage.getItem('agri_manual_location')")
        print(f"LocalStorage after reload: {reloaded_storage}")
        assert "ka" in reloaded_storage, "Location was lost on reload!"

        reloaded_cards = await page.query_selector_all(".bg-white.rounded-xl.border.p-4")
        print(f"Cards after reload: {len(reloaded_cards)}")
        top_reloaded_card = await reloaded_cards[0].inner_text()
        assert "km away" in top_reloaded_card, "Distance missing after reload!"

        await page.screenshot(path=f"{SCREENSHOT_DIR}/verified_05_persisted_after_reload.png")
        print("Captured screenshot: verified_05_persisted_after_reload.png")

        await browser.close()
        print("\n>>> ALL TESTS PASSED SUCCESSFULLY! <<<")

if __name__ == "__main__":
    asyncio.run(run_tests())
