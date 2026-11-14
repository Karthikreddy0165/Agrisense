package com.agriforecasting.price.dto;

import java.time.LocalDate;
import java.util.List;

public record PriceHistoryResponse(
        String mandiId,
        String commodityId,
        String varietyId,
        Double latestModalPrice,
        Double previousModalPrice,
        Double absolutePriceChange,
        Double percentagePriceChange,
        LocalDate latestObservationDate,
        String priceTrend,
        String priceUnit,
        int observationCount,
        List<PriceObservationDto> observations
) {}
