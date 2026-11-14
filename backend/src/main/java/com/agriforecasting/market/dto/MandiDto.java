package com.agriforecasting.market.dto;

public record MandiDto(
    String id,
    String districtId,
    String stateId,
    String name,
    String fullName,
    Double latitude,
    Double longitude,
    String coordinateSource,
    String coordinateStatus,
    Double distanceKm,
    Double latestModalPrice,
    Double minPrice,
    Double maxPrice,
    Double arrivals,
    String observationDate,
    String trendDirection
) {}
