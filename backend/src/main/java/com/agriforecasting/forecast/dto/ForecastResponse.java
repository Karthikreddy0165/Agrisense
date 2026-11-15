package com.agriforecasting.forecast.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record ForecastResponse(
    String mandiId,
    String mandiName,
    String commodityId,
    String commodityName,
    String varietyId,
    String varietyName,
    LocalDate referenceDate,
    LocalDate forecastStart,
    LocalDate forecastEnd,
    int horizon,
    double latestActualPrice,
    LocalDate latestActualDate,
    double expectedPrice7d,
    double expectedPrice14d,
    double percentageChange14d,
    String expectedDirection, // "Rising", "Falling", "Relatively Stable"
    double expectedMin,
    double expectedMax,
    String interpretation,
    String modelVersion,
    LocalDateTime generatedAt,
    boolean isFallback,
    List<ForecastPredictionDto> predictions
) {}
