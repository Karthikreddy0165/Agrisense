package com.agriforecasting.comparison.service;

import com.agriforecasting.commodity.repository.CommodityRepository;
import com.agriforecasting.commodity.repository.VarietyRepository;
import com.agriforecasting.comparison.dto.ComparisonResponse;
import com.agriforecasting.config.ForecastConfig;
import com.agriforecasting.forecast.dto.ForecastResponse;
import com.agriforecasting.forecast.service.ForecastService;
import com.agriforecasting.market.domain.District;
import com.agriforecasting.market.domain.Mandi;
import com.agriforecasting.market.domain.State;
import com.agriforecasting.market.repository.DistrictRepository;
import com.agriforecasting.market.repository.MandiRepository;
import com.agriforecasting.market.repository.StateRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ComparisonService {

    private final ForecastService forecastService;
    private final MandiRepository mandiRepository;
    private final StateRepository stateRepository;
    private final DistrictRepository districtRepository;
    private final CommodityRepository commodityRepository;
    private final VarietyRepository varietyRepository;

    public ComparisonService(
            ForecastService forecastService,
            MandiRepository mandiRepository,
            StateRepository stateRepository,
            DistrictRepository districtRepository,
            CommodityRepository commodityRepository,
            VarietyRepository varietyRepository) {
        this.forecastService = forecastService;
        this.mandiRepository = mandiRepository;
        this.stateRepository = stateRepository;
        this.districtRepository = districtRepository;
        this.commodityRepository = commodityRepository;
        this.varietyRepository = varietyRepository;
    }

    public ComparisonResponse compareMarkets(List<String> mandiIds, String commodityId, String varietyId) {
        if (mandiIds == null || mandiIds.isEmpty()) {
            throw new IllegalArgumentException("At least one mandiId must be provided for comparison.");
        }
        if (mandiIds.size() > 5) {
            throw new IllegalArgumentException("Maximum of 5 mandis can be compared simultaneously.");
        }

        String commodityName = commodityRepository.findById(commodityId)
                .map(c -> c.getName()).orElse(commodityId);
        String varietyName = (varietyId != null)
                ? varietyRepository.findById(varietyId).map(v -> v.getName()).orElse(varietyId)
                : "Standard";

        List<ComparisonResponse.MandiComparisonItem> items = new ArrayList<>();
        double totalPrice = 0.0;

        for (String mId : mandiIds) {
            Mandi mandi = mandiRepository.findById(mId).orElse(null);
            String mName = mandi != null ? mandi.getName() : mId;
            String stateName = (mandi != null) ? stateRepository.findById(mandi.getStateId()).map(State::getName).orElse("") : "";
            String distName = (mandi != null) ? districtRepository.findById(mandi.getDistrictId()).map(District::getName).orElse("") : "";

            ForecastResponse fc = forecastService.generateForecast(mId, commodityId, varietyId);
            totalPrice += fc.latestActualPrice();

            items.add(new ComparisonResponse.MandiComparisonItem(
                    mId,
                    mName,
                    distName,
                    stateName,
                    fc.latestActualPrice(),
                    fc.latestActualDate(),
                    fc.expectedPrice7d(),
                    fc.expectedPrice14d(),
                    fc.percentageChange14d(),
                    fc.expectedDirection(),
                    0.0, // calculated below
                    fc.predictions()
            ));
        }

        double avgPrice = items.isEmpty() ? 0.0 : totalPrice / items.size();
        List<ComparisonResponse.MandiComparisonItem> finalItems = new ArrayList<>();
        for (ComparisonResponse.MandiComparisonItem item : items) {
            double diff = Math.round((item.currentModalPrice() - avgPrice) * 10.0) / 10.0;
            finalItems.add(new ComparisonResponse.MandiComparisonItem(
                    item.mandiId(),
                    item.mandiName(),
                    item.districtName(),
                    item.stateName(),
                    item.currentModalPrice(),
                    item.observationDate(),
                    item.expectedPrice7d(),
                    item.expectedPrice14d(),
                    item.percentageChange14d(),
                    item.trendDirection(),
                    diff,
                    item.predictions()
            ));
        }

        return new ComparisonResponse(
                commodityId,
                commodityName,
                varietyId,
                varietyName,
                ForecastConfig.REFERENCE_DATE,
                finalItems
        );
    }
}
