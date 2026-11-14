package com.agriforecasting.price.dto;

import java.time.LocalDate;

public record PriceObservationDto(
    Long id,
    String mandiId,
    String commodityId,
    String varietyId,
    LocalDate observationDate,
    double minPrice,
    double maxPrice,
    double modalPrice,
    double arrivals
) {}
