package com.agriforecasting.comparison.dto;

import com.agriforecasting.forecast.dto.ForecastPredictionDto;
import java.time.LocalDate;
import java.util.List;

public record ComparisonResponse(
    String commodityId,
    String commodityName,
    String varietyId,
    String varietyName,
    LocalDate referenceDate,
    List<MandiComparisonItem> mandis
) {
    public record MandiComparisonItem(
        String mandiId,
        String mandiName,
        String districtName,
        String stateName,
        double currentModalPrice,
        LocalDate observationDate,
        double expectedPrice7d,
        double expectedPrice14d,
        double percentageChange14d,
        String trendDirection,
        Double priceDifferenceFromAvg,
        List<ForecastPredictionDto> predictions
    ) {}
}
