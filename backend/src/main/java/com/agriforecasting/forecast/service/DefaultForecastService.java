package com.agriforecasting.forecast.service;

import com.agriforecasting.commodity.repository.CommodityRepository;
import com.agriforecasting.commodity.repository.VarietyRepository;
import com.agriforecasting.config.ForecastConfig;
import com.agriforecasting.forecast.client.ModelClient;
import com.agriforecasting.forecast.domain.ForecastRun;
import com.agriforecasting.forecast.domain.ForecastRunItem;
import com.agriforecasting.forecast.dto.*;
import com.agriforecasting.forecast.repository.ForecastRunRepository;
import com.agriforecasting.market.repository.MandiRepository;
import com.agriforecasting.price.domain.PriceObservation;
import com.agriforecasting.price.repository.PriceObservationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DefaultForecastService implements ForecastService {

    private final ModelClient modelClient;
    private final MandiRepository mandiRepository;
    private final CommodityRepository commodityRepository;
    private final VarietyRepository varietyRepository;
    private final PriceObservationRepository priceObservationRepository;
    private final ForecastRunRepository forecastRunRepository;

    public DefaultForecastService(
            ModelClient modelClient,
            MandiRepository mandiRepository,
            CommodityRepository commodityRepository,
            VarietyRepository varietyRepository,
            PriceObservationRepository priceObservationRepository,
            ForecastRunRepository forecastRunRepository) {
        this.modelClient = modelClient;
        this.mandiRepository = mandiRepository;
        this.commodityRepository = commodityRepository;
        this.varietyRepository = varietyRepository;
        this.priceObservationRepository = priceObservationRepository;
        this.forecastRunRepository = forecastRunRepository;
    }

    @Override
    @Transactional
    public ForecastResponse generateForecast(String mandiId, String commodityId, String varietyId) {
        String effectiveVariety = (varietyId != null && !varietyId.isBlank()) ? varietyId : "standard";

        // Deduplication: check if already generated recently (last 15 mins) for same reference date
        Optional<ForecastRun> recentRun = forecastRunRepository
                .findFirstByMandiIdAndCommodityIdAndVarietyIdAndReferenceDateOrderByGeneratedAtDesc(
                        mandiId, commodityId, effectiveVariety, ForecastConfig.REFERENCE_DATE);

        if (recentRun.isPresent()) {
            ForecastRun existing = recentRun.get();
            if (existing.getGeneratedAt().isAfter(LocalDateTime.now().minusMinutes(15))) {
                return toForecastResponse(existing);
            }
        }

        // 1. Fetch metadata
        String mandiName = mandiRepository.findById(mandiId)
                .map(m -> m.getName())
                .orElse(mandiId);
        String commodityName = commodityRepository.findById(commodityId)
                .map(c -> c.getName())
                .orElse(commodityId);
        String varietyName = (!"standard".equals(effectiveVariety))
                ? varietyRepository.findById(effectiveVariety).map(v -> v.getName()).orElse(effectiveVariety)
                : "Standard";

        // 2. Fetch latest actual price
        List<PriceObservation> history = priceObservationRepository
                .findByMandiIdAndCommodityIdOrderByObservationDateDesc(mandiId, commodityId);

        double latestActualPrice = 2000.0;
        LocalDate latestActualDate = ForecastConfig.REFERENCE_DATE;
        List<Double> recentPrices = new ArrayList<>();

        if (!history.isEmpty()) {
            PriceObservation latest = history.get(0);
            latestActualPrice = latest.getModalPrice();
            latestActualDate = latest.getObservationDate();
            recentPrices = history.stream()
                    .limit(30)
                    .map(PriceObservation::getModalPrice)
                    .collect(Collectors.toList());
            Collections.reverse(recentPrices);
        }

        // 3. Prepare forecast request with fixed reference date
        ForecastRequest req = new ForecastRequest(
                mandiId,
                commodityId,
                effectiveVariety,
                ForecastConfig.REFERENCE_DATE.toString(),
                ForecastConfig.FORECAST_HORIZON,
                recentPrices
        );

        // 4. Call Python model client
        Map<String, Object> rawModelResponse = modelClient.predict(req);

        List<ForecastPredictionDto> predictions = new ArrayList<>();
        boolean isFallback = false;
        String modelVersion = "LightGBM-AgriPrice-v1";

        if (rawModelResponse != null && rawModelResponse.containsKey("predictions")) {
            List<Map<String, Object>> predList = (List<Map<String, Object>>) rawModelResponse.get("predictions");
            for (Map<String, Object> p : predList) {
                LocalDate dt = LocalDate.parse(p.get("date").toString());
                double modal = ((Number) p.get("modalPrice")).doubleValue();
                double minP = ((Number) p.get("minPrice")).doubleValue();
                double maxP = ((Number) p.get("maxPrice")).doubleValue();
                double pct = Math.round(((modal - latestActualPrice) / latestActualPrice) * 1000.0) / 10.0;
                predictions.add(new ForecastPredictionDto(dt, modal, minP, maxP, pct));
            }
            if (rawModelResponse.containsKey("modelVersion")) {
                modelVersion = rawModelResponse.get("modelVersion").toString();
            }
        }

        // 5. If model service was unavailable, fallback to deterministic autoregressive estimation
        if (predictions.size() != ForecastConfig.FORECAST_HORIZON) {
            isFallback = true;
            modelVersion = "Fallback-Deterministic-v1";
            predictions = generateDeterministicFallback(latestActualPrice, mandiId, commodityId);
        }

        // 6. Summary metrics
        double p7 = predictions.get(6).modalPrice();
        double p14 = predictions.get(13).modalPrice();
        double pct14 = Math.round(((p14 - latestActualPrice) / latestActualPrice) * 1000.0) / 10.0;

        String direction = "Relatively Stable";
        if (pct14 > 2.0) direction = "Rising";
        else if (pct14 < -2.0) direction = "Falling";

        double expectedMin = predictions.stream().mapToDouble(ForecastPredictionDto::minPrice).min().orElse(latestActualPrice);
        double expectedMax = predictions.stream().mapToDouble(ForecastPredictionDto::maxPrice).max().orElse(latestActualPrice);

        String interpretation;
        if ("Rising".equals(direction)) {
            interpretation = "Prices are expected to increase over the next two weeks according to this forecast.";
        } else if ("Falling".equals(direction)) {
            interpretation = "Prices are expected to decline over the forecast period according to this forecast.";
        } else {
            interpretation = "Prices are expected to remain relatively stable within standard volatility bounds.";
        }

        LocalDateTime generatedTime = LocalDateTime.now();
        String status = isFallback ? "FALLBACK" : "SUCCESS";

        // 7. Persist forecast run and its daily prediction values
        ForecastRun run = new ForecastRun(
                mandiId,
                mandiName,
                commodityId,
                commodityName,
                effectiveVariety,
                varietyName,
                ForecastConfig.REFERENCE_DATE,
                generatedTime,
                ForecastConfig.FORECAST_HORIZON,
                ForecastConfig.FORECAST_START,
                ForecastConfig.FORECAST_END,
                modelVersion,
                status,
                latestActualPrice,
                latestActualDate,
                p7,
                p14,
                pct14,
                direction,
                expectedMin,
                expectedMax,
                interpretation,
                isFallback
        );

        for (int i = 0; i < predictions.size(); i++) {
            ForecastPredictionDto dto = predictions.get(i);
            // Check if actual observation subsequently exists for targetDate
            Double actual = priceObservationRepository
                    .findByMandiIdAndCommodityIdAndObservationDate(mandiId, commodityId, dto.date())
                    .map(PriceObservation::getModalPrice)
                    .orElse(null);

            ForecastRunItem item = new ForecastRunItem(
                    i + 1,
                    dto.date(),
                    dto.modalPrice(),
                    dto.minPrice(),
                    dto.maxPrice(),
                    dto.percentageChangeFromReference(),
                    actual
            );
            run.addItem(item);
        }

        forecastRunRepository.save(run);

        return new ForecastResponse(
                mandiId,
                mandiName,
                commodityId,
                commodityName,
                effectiveVariety,
                varietyName,
                ForecastConfig.REFERENCE_DATE,
                ForecastConfig.FORECAST_START,
                ForecastConfig.FORECAST_END,
                ForecastConfig.FORECAST_HORIZON,
                latestActualPrice,
                latestActualDate,
                p7,
                p14,
                pct14,
                direction,
                expectedMin,
                expectedMax,
                interpretation,
                modelVersion,
                generatedTime,
                isFallback,
                predictions
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<ForecastRunSummaryDto> getForecastHistory(String mandiId, String commodityId, String varietyId,
                                                          LocalDate fromDate, LocalDate toDate) {
        LocalDateTime fromTime = (fromDate != null) ? fromDate.atStartOfDay() : LocalDateTime.of(1970, 1, 1, 0, 0, 0);
        LocalDateTime toTime = (toDate != null) ? toDate.atTime(23, 59, 59) : LocalDateTime.of(2099, 12, 31, 23, 59, 59);

        List<ForecastRun> runs = forecastRunRepository.findFilteredRuns(
                (mandiId != null && !mandiId.isBlank()) ? mandiId : null,
                (commodityId != null && !commodityId.isBlank()) ? commodityId : null,
                (varietyId != null && !varietyId.isBlank()) ? varietyId : null,
                fromTime,
                toTime
        );

        return runs.stream().map(r -> new ForecastRunSummaryDto(
                r.getId(),
                r.getMandiId(),
                r.getMandiName(),
                r.getCommodityId(),
                r.getCommodityName(),
                r.getVarietyId(),
                r.getVarietyName(),
                r.getReferenceDate(),
                r.getGeneratedAt(),
                r.getForecastHorizon(),
                r.getModelVersion(),
                r.getStatus(),
                r.getLatestActualPrice(),
                r.getExpectedPrice7d(),
                r.getExpectedPrice14d(),
                r.getPercentageChange14d(),
                r.getExpectedDirection(),
                r.getItems().size()
        )).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ForecastRunDetailDto> getForecastRunDetail(Long id) {
        return forecastRunRepository.findById(id).map(r -> {
            List<ForecastRunDetailDto.ForecastPredictionItemDto> items = r.getItems().stream()
                    .map(it -> {
                        // Check if actual observation became available for targetDate
                        Double actual = it.getActualPrice();
                        if (actual == null) {
                            actual = priceObservationRepository
                                    .findByMandiIdAndCommodityIdAndObservationDate(r.getMandiId(), r.getCommodityId(), it.getTargetDate())
                                    .map(PriceObservation::getModalPrice)
                                    .orElse(null);
                        }
                        return new ForecastRunDetailDto.ForecastPredictionItemDto(
                                it.getDayIndex(),
                                it.getTargetDate(),
                                it.getPredictedPrice(),
                                it.getMinPrice(),
                                it.getMaxPrice(),
                                it.getPercentageChangeFromReference(),
                                actual
                        );
                    }).collect(Collectors.toList());

            return new ForecastRunDetailDto(
                    r.getId(),
                    r.getMandiId(),
                    r.getMandiName(),
                    r.getCommodityId(),
                    r.getCommodityName(),
                    r.getVarietyId(),
                    r.getVarietyName(),
                    r.getReferenceDate(),
                    r.getGeneratedAt(),
                    r.getForecastHorizon(),
                    r.getForecastStart(),
                    r.getForecastEnd(),
                    r.getModelVersion(),
                    r.getStatus(),
                    r.getLatestActualPrice(),
                    r.getLatestActualDate(),
                    r.getExpectedPrice7d(),
                    r.getExpectedPrice14d(),
                    r.getPercentageChange14d(),
                    r.getExpectedDirection(),
                    r.getExpectedMin(),
                    r.getExpectedMax(),
                    r.getInterpretation(),
                    r.isFallback(),
                    items
            );
        });
    }

    private ForecastResponse toForecastResponse(ForecastRun r) {
        List<ForecastPredictionDto> dtos = r.getItems().stream()
                .map(it -> new ForecastPredictionDto(
                        it.getTargetDate(),
                        it.getPredictedPrice(),
                        it.getMinPrice(),
                        it.getMaxPrice(),
                        it.getPercentageChangeFromReference()
                )).collect(Collectors.toList());

        return new ForecastResponse(
                r.getMandiId(),
                r.getMandiName(),
                r.getCommodityId(),
                r.getCommodityName(),
                r.getVarietyId(),
                r.getVarietyName(),
                r.getReferenceDate(),
                r.getForecastStart(),
                r.getForecastEnd(),
                r.getForecastHorizon(),
                r.getLatestActualPrice(),
                r.getLatestActualDate(),
                r.getExpectedPrice7d(),
                r.getExpectedPrice14d(),
                r.getPercentageChange14d(),
                r.getExpectedDirection(),
                r.getExpectedMin(),
                r.getExpectedMax(),
                r.getInterpretation(),
                r.getModelVersion(),
                r.getGeneratedAt(),
                r.isFallback(),
                dtos
        );
    }

    private List<ForecastPredictionDto> generateDeterministicFallback(double basePrice, String mandiId, String commodityId) {
        List<ForecastPredictionDto> list = new ArrayList<>();
        long seed = (long) Math.abs(Objects.hash(mandiId, commodityId));
        Random rand = new Random(seed);

        double currentPrice = basePrice;
        for (int i = 1; i <= ForecastConfig.FORECAST_HORIZON; i++) {
            LocalDate dt = ForecastConfig.REFERENCE_DATE.plusDays(i);
            double dailyDelta = (rand.nextDouble() - 0.48) * (basePrice * 0.02);
            currentPrice = Math.max(100.0, currentPrice + dailyDelta);
            double modal = Math.round(currentPrice * 100.0) / 100.0;
            double minP = Math.round(modal * 0.93 * 100.0) / 100.0;
            double maxP = Math.round(modal * 1.07 * 100.0) / 100.0;
            double pct = Math.round(((modal - basePrice) / basePrice) * 1000.0) / 10.0;
            list.add(new ForecastPredictionDto(dt, modal, minP, maxP, pct));
        }
        return list;
    }
}
