package com.agriforecasting.market.controller;

import com.agriforecasting.common.ApiResponse;
import com.agriforecasting.market.dto.DistrictDto;
import com.agriforecasting.market.dto.MandiDto;
import com.agriforecasting.market.dto.StateDto;
import com.agriforecasting.market.service.MarketService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class MarketController {

    private final MarketService marketService;

    public MarketController(MarketService marketService) {
        this.marketService = marketService;
    }

    @GetMapping("/states")
    public ResponseEntity<ApiResponse<List<StateDto>>> getStates() {
        return ResponseEntity.ok(ApiResponse.ok(marketService.getAllStates()));
    }

    @GetMapping("/districts")
    public ResponseEntity<ApiResponse<List<DistrictDto>>> getDistricts(
            @RequestParam(required = false) String stateId) {
        return ResponseEntity.ok(ApiResponse.ok(marketService.getDistricts(stateId)));
    }

    @GetMapping("/mandis")
    public ResponseEntity<ApiResponse<List<MandiDto>>> getMandis(
            @RequestParam(required = false) String commodityId,
            @RequestParam(required = false) String stateId,
            @RequestParam(required = false) String districtId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Boolean hasCoordinates,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        String effectiveQuery = (search != null && !search.isBlank()) ? search : q;
        return ResponseEntity.ok(ApiResponse.ok(
                marketService.getMandis(stateId, districtId, effectiveQuery, hasCoordinates, page, size, commodityId)
        ));
    }

    @GetMapping("/mandis/{mandiId}")
    public ResponseEntity<ApiResponse<MandiDto>> getMandi(
            @PathVariable String mandiId,
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double longitude,
            @RequestParam(required = false) Double lon,
            @RequestParam(required = false) String commodityId) {
        Double effectiveLat = latitude != null ? latitude : lat;
        Double effectiveLon = longitude != null ? longitude : lon;
        return marketService.getMandiById(mandiId, effectiveLat, effectiveLon, commodityId)
                .map(m -> ResponseEntity.ok(ApiResponse.ok(m)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/mandis/nearby")
    public ResponseEntity<ApiResponse<List<MandiDto>>> getNearbyMandis(
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double longitude,
            @RequestParam(required = false) Double lon,
            @RequestParam(required = false) Double radiusKm,
            @RequestParam(required = false) String commodityId) {
        Double effectiveLat = latitude != null ? latitude : lat;
        Double effectiveLon = longitude != null ? longitude : lon;
        List<MandiDto> nearby = marketService.getNearbyMandis(effectiveLat, effectiveLon, radiusKm, commodityId);
        return ResponseEntity.ok(ApiResponse.ok(nearby));
    }
}
