package com.agriforecasting.comparison.controller;

import com.agriforecasting.common.ApiResponse;
import com.agriforecasting.comparison.dto.ComparisonResponse;
import com.agriforecasting.comparison.service.ComparisonService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/comparisons", "/api/v1/comparison"})
public class ComparisonController {

    private final ComparisonService comparisonService;

    public ComparisonController(ComparisonService comparisonService) {
        this.comparisonService = comparisonService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<ComparisonResponse>> compare(
            @RequestParam List<String> mandiIds,
            @RequestParam String commodityId,
            @RequestParam(required = false) String varietyId) {
        ComparisonResponse response = comparisonService.compareMarkets(mandiIds, commodityId, varietyId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
