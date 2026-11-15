package com.agriforecasting.forecast.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record ForecastRunSummaryDto(
        Long id,
        String mandiId,
        String mandiName,
        String commodityId,
        String commodityName,
        String varietyId,
        String varietyName,
        LocalDate referenceDate,
        LocalDateTime generatedAt,
        int forecastHorizon,
        String modelVersion,
        String status,
        double latestActualPrice,
        double expectedPrice7d,
        double expectedPrice14d,
        double percentageChange14d,
        String expectedDirection,
        int itemCount
) {}
