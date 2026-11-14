package com.agriforecasting.commodity.controller;

import com.agriforecasting.commodity.dto.CommodityDto;
import com.agriforecasting.commodity.dto.VarietyDto;
import com.agriforecasting.commodity.service.CommodityService;
import com.agriforecasting.common.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/commodities")
public class CommodityController {

    private final CommodityService commodityService;

    public CommodityController(CommodityService commodityService) {
        this.commodityService = commodityService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CommodityDto>>> getCommodities() {
        return ResponseEntity.ok(ApiResponse.ok(commodityService.getAllCommodities()));
    }

    @GetMapping("/{commodityId}")
    public ResponseEntity<ApiResponse<CommodityDto>> getCommodity(@PathVariable String commodityId) {
        return commodityService.getCommodityById(commodityId)
                .map(c -> ResponseEntity.ok(ApiResponse.ok(c)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{commodityId}/varieties")
    public ResponseEntity<ApiResponse<List<VarietyDto>>> getVarieties(@PathVariable String commodityId) {
        return ResponseEntity.ok(ApiResponse.ok(commodityService.getVarietiesByCommodity(commodityId)));
    }
}
