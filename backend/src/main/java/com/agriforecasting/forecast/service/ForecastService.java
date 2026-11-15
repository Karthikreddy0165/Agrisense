package com.agriforecasting.forecast.service;

import com.agriforecasting.forecast.dto.ForecastResponse;
import com.agriforecasting.forecast.dto.ForecastRunDetailDto;
import com.agriforecasting.forecast.dto.ForecastRunSummaryDto;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ForecastService {
    ForecastResponse generateForecast(String mandiId, String commodityId, String varietyId);

    List<ForecastRunSummaryDto> getForecastHistory(String mandiId, String commodityId, String varietyId,
                                                   LocalDate fromDate, LocalDate toDate);

    Optional<ForecastRunDetailDto> getForecastRunDetail(Long id);
}
