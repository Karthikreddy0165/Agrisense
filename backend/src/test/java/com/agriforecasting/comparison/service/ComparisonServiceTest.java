package com.agriforecasting.comparison.service;

import com.agriforecasting.commodity.domain.Commodity;
import com.agriforecasting.commodity.repository.CommodityRepository;
import com.agriforecasting.commodity.repository.VarietyRepository;
import com.agriforecasting.comparison.dto.ComparisonResponse;
import com.agriforecasting.config.ForecastConfig;
import com.agriforecasting.forecast.dto.ForecastPredictionDto;
import com.agriforecasting.forecast.dto.ForecastResponse;
import com.agriforecasting.forecast.service.ForecastService;
import com.agriforecasting.market.domain.District;
import com.agriforecasting.market.domain.Mandi;
import com.agriforecasting.market.domain.State;
import com.agriforecasting.market.repository.DistrictRepository;
import com.agriforecasting.market.repository.MandiRepository;
import com.agriforecasting.market.repository.StateRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

class ComparisonServiceTest {

    private ForecastService forecastService;
    private MandiRepository mandiRepository;
    private StateRepository stateRepository;
    private DistrictRepository districtRepository;
    private CommodityRepository commodityRepository;
    private VarietyRepository varietyRepository;
    private ComparisonService comparisonService;

    @BeforeEach
    void setUp() {
        forecastService = Mockito.mock(ForecastService.class);
        mandiRepository = Mockito.mock(MandiRepository.class);
        stateRepository = Mockito.mock(StateRepository.class);
        districtRepository = Mockito.mock(DistrictRepository.class);
        commodityRepository = Mockito.mock(CommodityRepository.class);
        varietyRepository = Mockito.mock(VarietyRepository.class);

        comparisonService = new ComparisonService(
                forecastService, mandiRepository, stateRepository, districtRepository, commodityRepository, varietyRepository);
    }

    @Test
    void testCompareMarkets_rejectsMoreThan5Mandis() {
        List<String> mandis = List.of("m1", "m2", "m3", "m4", "m5", "m6");
        assertThrows(IllegalArgumentException.class, () -> comparisonService.compareMarkets(mandis, "tomato", null));
    }

    @Test
    void testCompareMarkets_rejectsEmptyList() {
        assertThrows(IllegalArgumentException.class, () -> comparisonService.compareMarkets(List.of(), "tomato", null));
    }

    @Test
    void testCompareMarkets_validComparison() {
        when(commodityRepository.findById("tomato")).thenReturn(Optional.of(new Commodity("tomato", "Tomato", "veg", "₹/qtl", "tomato")));
        when(mandiRepository.findById("kolar-apmc")).thenReturn(Optional.of(new Mandi("kolar-apmc", "ka-kolar", "ka", "Kolar APMC", "Kolar APMC", 13.0, 78.0)));
        when(stateRepository.findById("ka")).thenReturn(Optional.of(new State("ka", "Karnataka", "KA")));
        when(districtRepository.findById("ka-kolar")).thenReturn(Optional.of(new District("ka-kolar", "ka", "Kolar")));

        ForecastResponse dummyFc = new ForecastResponse(
                "kolar-apmc", "Kolar APMC", "tomato", "Tomato", "standard", "Standard",
                ForecastConfig.REFERENCE_DATE, ForecastConfig.FORECAST_START, ForecastConfig.FORECAST_END,
                14, 2000.0, ForecastConfig.REFERENCE_DATE, 2100.0, 2200.0, 10.0, "Rising",
                1900.0, 2300.0, "Prices are expected to rise", "v1", LocalDateTime.now(), false, List.of()
        );
        when(forecastService.generateForecast("kolar-apmc", "tomato", null)).thenReturn(dummyFc);

        ComparisonResponse resp = comparisonService.compareMarkets(List.of("kolar-apmc"), "tomato", null);
        assertNotNull(resp);
        assertEquals("tomato", resp.commodityId());
        assertEquals(1, resp.mandis().size());
        assertEquals("Kolar APMC", resp.mandis().get(0).mandiName());
    }
}
