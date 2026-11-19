package com.agriforecasting.forecast.service;

import com.agriforecasting.commodity.domain.Commodity;
import com.agriforecasting.commodity.repository.CommodityRepository;
import com.agriforecasting.commodity.repository.VarietyRepository;
import com.agriforecasting.config.ForecastConfig;
import com.agriforecasting.forecast.client.ModelClient;
import com.agriforecasting.forecast.dto.ForecastResponse;
import com.agriforecasting.forecast.repository.ForecastRunRepository;
import com.agriforecasting.market.domain.Mandi;
import com.agriforecasting.market.repository.MandiRepository;
import com.agriforecasting.price.domain.PriceObservation;
import com.agriforecasting.price.repository.PriceObservationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class ForecastServiceTest {

    private ModelClient modelClient;
    private MandiRepository mandiRepository;
    private CommodityRepository commodityRepository;
    private VarietyRepository varietyRepository;
    private PriceObservationRepository priceObservationRepository;
    private ForecastRunRepository forecastRunRepository;
    private ForecastService forecastService;

    @BeforeEach
    void setUp() {
        modelClient = Mockito.mock(ModelClient.class);
        mandiRepository = Mockito.mock(MandiRepository.class);
        commodityRepository = Mockito.mock(CommodityRepository.class);
        varietyRepository = Mockito.mock(VarietyRepository.class);
        priceObservationRepository = Mockito.mock(PriceObservationRepository.class);
        forecastRunRepository = Mockito.mock(ForecastRunRepository.class);

        forecastService = new DefaultForecastService(
                modelClient, mandiRepository, commodityRepository, varietyRepository, priceObservationRepository, forecastRunRepository);
    }

    @Test
    void testGenerateForecast_exact14DaysHorizon() {
        when(mandiRepository.findById("kolar-apmc"))
                .thenReturn(Optional.of(new Mandi("kolar-apmc", "ka-kolar", "ka", "Kolar APMC", "Kolar APMC", 13.1367, 78.1292)));
        when(commodityRepository.findById("tomato"))
                .thenReturn(Optional.of(new Commodity("tomato", "Tomato", "vegetable", "₹/quintal", "tomato")));
        when(priceObservationRepository.findByMandiIdAndCommodityIdOrderByObservationDateDesc("kolar-apmc", "tomato"))
                .thenReturn(List.of(new PriceObservation("kolar-apmc", "tomato", "standard",
                        ForecastConfig.REFERENCE_DATE, 1800, 2200, 2000, 100)));

        when(modelClient.predict(any())).thenReturn(null);

        ForecastResponse response = forecastService.generateForecast("kolar-apmc", "tomato", null);

        assertNotNull(response);
        assertEquals(ForecastConfig.REFERENCE_DATE, response.referenceDate());
        assertEquals(LocalDate.of(2026, 11, 23), response.referenceDate());
        assertEquals(LocalDate.of(2026, 11, 24), response.forecastStart());
        assertEquals(LocalDate.of(2026, 12, 7), response.forecastEnd());
        assertEquals(14, response.horizon());
        assertEquals(14, response.predictions().size(), "Must contain exactly 14 predictions");

        assertEquals(LocalDate.of(2026, 11, 24), response.predictions().get(0).date());
        assertEquals(LocalDate.of(2026, 12, 7), response.predictions().get(13).date());
    }
}
