package com.agriforecasting.config;

import java.time.LocalDate;

/**
 * Centrally configured fixed reference date and horizon for AgriForecasting.
 * The Java backend is the authoritative source for these parameters.
 */
public final class ForecastConfig {

    private ForecastConfig() {}

    /**
     * Centrally configured reference date: 23 November 2026.
     */
    public static final LocalDate REFERENCE_DATE = LocalDate.of(2026, 11, 23);

    /**
     * Forecast horizon: exactly 14 calendar days (Nov 24 to Dec 7, 2026).
     */
    public static final int FORECAST_HORIZON = 14;

    /**
     * Forecast start date: 24 November 2026.
     */
    public static final LocalDate FORECAST_START = REFERENCE_DATE.plusDays(1);

    /**
     * Forecast end date: 7 December 2026.
     */
    public static final LocalDate FORECAST_END = REFERENCE_DATE.plusDays(FORECAST_HORIZON);
}
