package com.agriforecasting.common;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class GeoUtilsTest {

    @Test
    void testCalculateDistanceKm_samePointIsZero() {
        double d = GeoUtils.calculateDistanceKm(13.1367, 78.1292, 13.1367, 78.1292);
        assertEquals(0.0, d, 0.01);
    }

    @Test
    void testCalculateDistanceKm_kolarToBangalore() {
        // Kolar (13.1367, 78.1292) to Bangalore (13.0185, 77.5458) is approx ~65-70 km
        double d = GeoUtils.calculateDistanceKm(13.1367, 78.1292, 13.0185, 77.5458);
        assertTrue(d > 60.0 && d < 75.0, "Expected distance between Kolar and Bangalore to be ~65-70km, got " + d);
    }
}
