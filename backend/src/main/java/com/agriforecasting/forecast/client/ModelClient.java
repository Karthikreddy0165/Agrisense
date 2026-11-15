package com.agriforecasting.forecast.client;

import com.agriforecasting.forecast.dto.ForecastRequest;

import java.util.List;
import java.util.Map;

public interface ModelClient {
    Map<String, Object> predict(ForecastRequest request);
}
