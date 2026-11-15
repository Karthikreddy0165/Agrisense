package com.agriforecasting.forecast.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record ForecastRunDetailDto(
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
        LocalDate forecastStart,
        LocalDate forecastEnd,
        String modelVersion,
        String status,
        double latestActualPrice,
        LocalDate latestActualDate,
        double expectedPrice7d,
        double expectedPrice14d,
        double percentageChange14d,
        String expectedDirection,
        double expectedMin,
        double expectedMax,
        String interpretation,
        boolean isFallback,
        List<ForecastPredictionItemDto> predictions
) {
    public record ForecastPredictionItemDto(
            int dayIndex,
            LocalDate targetDate,
            double predictedPrice,
            double minPrice,
            double maxPrice,
            double percentageChangeFromReference,
            Double actualPrice
    ) {}
}
