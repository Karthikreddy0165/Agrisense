package com.agriforecasting.forecast.controller;

import com.agriforecasting.common.ApiResponse;
import com.agriforecasting.forecast.dto.ForecastRequest;
import com.agriforecasting.forecast.dto.ForecastResponse;
import com.agriforecasting.forecast.dto.ForecastRunDetailDto;
import com.agriforecasting.forecast.dto.ForecastRunSummaryDto;
import com.agriforecasting.forecast.service.ForecastService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping({"/api/v1/forecasts", "/api/v1/forecast"})
public class ForecastController {

    private final ForecastService forecastService;

    public ForecastController(ForecastService forecastService) {
        this.forecastService = forecastService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<ForecastResponse>> getForecast(
            @RequestParam String mandiId,
            @RequestParam String commodityId,
            @RequestParam(required = false) String varietyId) {
        ForecastResponse forecast = forecastService.generateForecast(mandiId, commodityId, varietyId);
        return ResponseEntity.ok(ApiResponse.ok(forecast));
    }

    @GetMapping("/generate")
    public ResponseEntity<ApiResponse<ForecastResponse>> getForecastGenerate(
            @RequestParam String mandiId,
            @RequestParam String commodityId,
            @RequestParam(required = false) String varietyId) {
        return getForecast(mandiId, commodityId, varietyId);
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ForecastResponse>> postForecast(
            @Valid @RequestBody ForecastRequest request) {
        ForecastResponse forecast = forecastService.generateForecast(
                request.mandiId(), request.commodityId(), request.varietyId());
        return ResponseEntity.ok(ApiResponse.ok(forecast));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<ForecastRunSummaryDto>>> getForecastHistory(
            @RequestParam(required = false) String mandiId,
            @RequestParam(required = false) String commodityId,
            @RequestParam(required = false) String varietyId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        List<ForecastRunSummaryDto> history = forecastService.getForecastHistory(
                mandiId, commodityId, varietyId, fromDate, toDate);
        return ResponseEntity.ok(ApiResponse.ok(history));
    }

    @GetMapping("/history/{id}")
    public ResponseEntity<ApiResponse<ForecastRunDetailDto>> getForecastRunDetail(
            @PathVariable Long id) {
        return forecastService.getForecastRunDetail(id)
                .map(detail -> ResponseEntity.ok(ApiResponse.ok(detail)))
                .orElse(ResponseEntity.notFound().build());
    }
}
