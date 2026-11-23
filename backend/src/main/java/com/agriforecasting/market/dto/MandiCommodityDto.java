package com.agriforecasting.market.dto;

import java.time.LocalDate;

public record MandiCommodityDto(
        String commodityId,
        String commodityName,
        Long observationCount,
        LocalDate latestDate,
        Double latestModalPrice
) {}
