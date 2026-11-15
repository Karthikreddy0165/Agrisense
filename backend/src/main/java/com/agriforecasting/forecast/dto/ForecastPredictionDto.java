package com.agriforecasting.forecast.dto;

import java.time.LocalDate;

public record ForecastPredictionDto(
    LocalDate date,
    double modalPrice,
    double minPrice,
    double maxPrice,
    Double percentageChangeFromReference
) {}
