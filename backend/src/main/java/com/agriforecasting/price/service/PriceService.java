package com.agriforecasting.price.service;

import com.agriforecasting.config.ForecastConfig;
import com.agriforecasting.market.domain.Mandi;
import com.agriforecasting.market.dto.MandiCommodityDto;
import com.agriforecasting.market.repository.MandiRepository;
import com.agriforecasting.price.domain.PriceObservation;
import com.agriforecasting.price.dto.PriceHistoryResponse;
import com.agriforecasting.price.dto.PriceObservationDto;
import com.agriforecasting.price.repository.PriceObservationRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PriceService {

    private final PriceObservationRepository priceObservationRepository;
    private final MandiRepository mandiRepository;

    public PriceService(PriceObservationRepository priceObservationRepository,
                        MandiRepository mandiRepository) {
        this.priceObservationRepository = priceObservationRepository;
        this.mandiRepository = mandiRepository;
    }

    public String resolveCanonicalMandiId(String mandiId) {
        if (mandiId == null || mandiId.isBlank()) return mandiId;
        if (mandiRepository.existsById(mandiId)) return mandiId;
        List<Mandi> matches = mandiRepository.filterMandis(null, null, null, mandiId);
        if (!matches.isEmpty()) {
            return matches.get(0).getId();
        }
        return mandiId;
    }

    public Optional<PriceObservationDto> getLatestPrice(String mandiId, String commodityId) {
        String effectiveMandiId = resolveCanonicalMandiId(mandiId);
        return priceObservationRepository
                .findTopByMandiIdAndCommodityIdOrderByObservationDateDesc(effectiveMandiId, commodityId)
                .map(this::toDto);
    }

    public List<PriceObservationDto> getPriceHistory(String mandiId, String commodityId, Integer days) {
        return getPriceHistory(mandiId, commodityId, null, days);
    }

    public List<PriceObservationDto> getPriceHistory(String mandiId, String commodityId, String varietyId, Integer days) {
        String effectiveMandiId = resolveCanonicalMandiId(mandiId);
        int windowDays = (days != null && days > 0) ? days : 90;
        LocalDate endDate = ForecastConfig.REFERENCE_DATE;
        LocalDate startDate = endDate.minusDays(windowDays - 1L);

        List<PriceObservation> list;
        if (varietyId != null && !varietyId.isBlank() && !"standard".equalsIgnoreCase(varietyId)) {
            list = priceObservationRepository
                    .findByMandiIdAndCommodityIdAndVarietyIdAndObservationDateBetweenOrderByObservationDateAsc(
                            effectiveMandiId, commodityId, varietyId, startDate, endDate);
            if (list.isEmpty()) {
                list = priceObservationRepository
                        .findByMandiIdAndCommodityIdAndObservationDateBetweenOrderByObservationDateAsc(
                                effectiveMandiId, commodityId, startDate, endDate);
            }
        } else {
            list = priceObservationRepository
                    .findByMandiIdAndCommodityIdAndObservationDateBetweenOrderByObservationDateAsc(
                            effectiveMandiId, commodityId, startDate, endDate);
        }

        // If no records in fixed recent window, retrieve the latest available historical observations
        if (list.isEmpty()) {
            Pageable pageable = PageRequest.of(0, windowDays, Sort.by("observationDate").descending());
            if (varietyId != null && !varietyId.isBlank() && !"standard".equalsIgnoreCase(varietyId)) {
                list = priceObservationRepository.findByMandiIdAndCommodityIdAndVarietyIdOrderByObservationDateDesc(
                        effectiveMandiId, commodityId, varietyId, pageable);
                if (list.isEmpty()) {
                    list = priceObservationRepository.findByMandiIdAndCommodityIdOrderByObservationDateDesc(
                            effectiveMandiId, commodityId, pageable);
                }
            } else {
                list = priceObservationRepository.findByMandiIdAndCommodityIdOrderByObservationDateDesc(
                        effectiveMandiId, commodityId, pageable);
            }
            List<PriceObservation> chronological = new ArrayList<>(list);
            Collections.reverse(chronological);
            list = chronological;
        }

        return list.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public PriceHistoryResponse getPriceHistoryDetails(String mandiId, String commodityId, String varietyId, Integer days) {
        String effectiveMandiId = resolveCanonicalMandiId(mandiId);
        List<PriceObservationDto> dtos = getPriceHistory(effectiveMandiId, commodityId, varietyId, days);

        Double latestModal = null;
        Double previousModal = null;
        Double absChange = null;
        Double pctChange = null;
        LocalDate latestDate = null;
        String trend = "Stable";

        if (!dtos.isEmpty()) {
            PriceObservationDto latest = dtos.get(dtos.size() - 1);
            latestModal = latest.modalPrice();
            latestDate = latest.observationDate();

            if (dtos.size() >= 2) {
                PriceObservationDto prev = dtos.get(dtos.size() - 2);
                previousModal = prev.modalPrice();
                absChange = Math.round((latestModal - previousModal) * 100.0) / 100.0;
                if (previousModal > 0.0) {
                    pctChange = Math.round(((latestModal - previousModal) / previousModal) * 1000.0) / 10.0;
                } else {
                    pctChange = 0.0;
                }
                if (pctChange > 1.0) trend = "Rising";
                else if (pctChange < -1.0) trend = "Falling";
            }
        }

        return new PriceHistoryResponse(
                effectiveMandiId,
                commodityId,
                varietyId != null ? varietyId : "standard",
                latestModal,
                previousModal,
                absChange,
                pctChange,
                latestDate,
                trend,
                "₹/quintal",
                dtos.size(),
                dtos
        );
    }

    public List<Double> getRecentModalPrices(String mandiId, String commodityId, int count) {
        String effectiveMandiId = resolveCanonicalMandiId(mandiId);
        Pageable pageable = PageRequest.of(0, count, Sort.by("observationDate").descending());
        List<PriceObservation> obs = priceObservationRepository
                .findByMandiIdAndCommodityIdOrderByObservationDateDesc(effectiveMandiId, commodityId, pageable);
        return obs.stream()
                .map(PriceObservation::getModalPrice)
                .collect(Collectors.toList());
    }

    public List<MandiCommodityDto> getTradedCommoditiesForMandi(String mandiId) {
        String effectiveMandiId = resolveCanonicalMandiId(mandiId);
        List<Object[]> rows = priceObservationRepository.findTradedCommoditiesByMandiId(effectiveMandiId);
        List<MandiCommodityDto> result = new ArrayList<>();
        for (Object[] r : rows) {
            String commId = (String) r[0];
            String commName = (String) r[1];
            Long count = (r[2] instanceof Number) ? ((Number) r[2]).longValue() : 0L;
            LocalDate latestDate = null;
            if (r[3] instanceof java.sql.Date) {
                latestDate = ((java.sql.Date) r[3]).toLocalDate();
            } else if (r[3] instanceof LocalDate) {
                latestDate = (LocalDate) r[3];
            }
            Double latestModal = priceObservationRepository
                    .findTopByMandiIdAndCommodityIdOrderByObservationDateDesc(effectiveMandiId, commId)
                    .map(PriceObservation::getModalPrice)
                    .orElse(null);
            result.add(new MandiCommodityDto(
                    commId,
                    commName != null ? commName : commId,
                    count,
                    latestDate,
                    latestModal
            ));
        }
        return result;
    }

    private PriceObservationDto toDto(PriceObservation o) {
        return new PriceObservationDto(
                o.getId(),
                o.getMandiId(),
                o.getCommodityId(),
                o.getVarietyId(),
                o.getObservationDate(),
                o.getMinPrice(),
                o.getMaxPrice(),
                o.getModalPrice(),
                o.getArrivals()
        );
    }
}
