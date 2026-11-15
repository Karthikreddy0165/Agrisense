package com.agriforecasting.forecast.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record ForecastRequest(
    @NotBlank(message = "mandiId is required")
    String mandiId,

    @NotBlank(message = "commodityId is required")
    String commodityId,

    String varietyId,
    String referenceDate,
    Integer horizon,
    List<Double> recentPrices
) {}
