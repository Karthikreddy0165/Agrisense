package com.agriforecasting.price.controller;

import com.agriforecasting.common.ApiResponse;
import com.agriforecasting.price.dto.PriceHistoryResponse;
import com.agriforecasting.price.dto.PriceObservationDto;
import com.agriforecasting.price.service.PriceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/prices")
public class PriceController {

    private final PriceService priceService;

    public PriceController(PriceService priceService) {
        this.priceService = priceService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PriceObservationDto>> getLatestPrice(
            @RequestParam String mandiId,
            @RequestParam String commodityId) {
        return priceService.getLatestPrice(mandiId, commodityId)
                .map(p -> ResponseEntity.ok(ApiResponse.ok(p)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{mandiId}/{commodityId}")
    public ResponseEntity<ApiResponse<Object>> getPriceOrHistory(
            @PathVariable String mandiId,
            @PathVariable String commodityId,
            @RequestParam(required = false) String varietyId,
            @RequestParam(required = false) Integer days) {
        if (days != null) {
            List<PriceObservationDto> history = priceService.getPriceHistory(mandiId, commodityId, varietyId, days);
            return ResponseEntity.ok(ApiResponse.ok(history));
        }
        return priceService.getLatestPrice(mandiId, commodityId)
                .map(p -> ResponseEntity.ok(ApiResponse.ok((Object) p)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{mandiId}/{commodityId}/latest")
    public ResponseEntity<ApiResponse<PriceObservationDto>> getLatestPricePath(
            @PathVariable String mandiId,
            @PathVariable String commodityId) {
        return priceService.getLatestPrice(mandiId, commodityId)
                .map(p -> ResponseEntity.ok(ApiResponse.ok(p)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<Object>> getHistory(
            @RequestParam String mandiId,
            @RequestParam String commodityId,
            @RequestParam(required = false) String varietyId,
            @RequestParam(required = false, defaultValue = "90") Integer days,
            @RequestParam(required = false, defaultValue = "false") Boolean detailed) {
        if (Boolean.TRUE.equals(detailed)) {
            PriceHistoryResponse response = priceService.getPriceHistoryDetails(mandiId, commodityId, varietyId, days);
            return ResponseEntity.ok(ApiResponse.ok(response));
        }
        List<PriceObservationDto> history = priceService.getPriceHistory(mandiId, commodityId, varietyId, days);
        return ResponseEntity.ok(ApiResponse.ok(history));
    }

    @GetMapping("/{mandiId}/{commodityId}/history")
    public ResponseEntity<ApiResponse<Object>> getHistoryPath(
            @PathVariable String mandiId,
            @PathVariable String commodityId,
            @RequestParam(required = false) String varietyId,
            @RequestParam(required = false, defaultValue = "90") Integer days,
            @RequestParam(required = false, defaultValue = "false") Boolean detailed) {
        return getHistory(mandiId, commodityId, varietyId, days, detailed);
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<PriceHistoryResponse>> getSummary(
            @RequestParam String mandiId,
            @RequestParam String commodityId,
            @RequestParam(required = false) String varietyId,
            @RequestParam(required = false, defaultValue = "90") Integer days) {
        PriceHistoryResponse response = priceService.getPriceHistoryDetails(mandiId, commodityId, varietyId, days);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{mandiId}/{commodityId}/summary")
    public ResponseEntity<ApiResponse<PriceHistoryResponse>> getSummaryPath(
            @PathVariable String mandiId,
            @PathVariable String commodityId,
            @RequestParam(required = false) String varietyId,
            @RequestParam(required = false, defaultValue = "90") Integer days) {
        return getSummary(mandiId, commodityId, varietyId, days);
    }

    @GetMapping("/{mandiId}/commodities")
    public ResponseEntity<ApiResponse<List<com.agriforecasting.market.dto.MandiCommodityDto>>> getMandiCommodities(
            @PathVariable String mandiId) {
        return ResponseEntity.ok(ApiResponse.ok(priceService.getTradedCommoditiesForMandi(mandiId)));
    }
}
