package com.agriforecasting.price.service;

import com.agriforecasting.config.ForecastConfig;
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

    public PriceService(PriceObservationRepository priceObservationRepository) {
        this.priceObservationRepository = priceObservationRepository;
    }

    public Optional<PriceObservationDto> getLatestPrice(String mandiId, String commodityId) {
        return priceObservationRepository
                .findTopByMandiIdAndCommodityIdOrderByObservationDateDesc(mandiId, commodityId)
                .map(this::toDto);
    }

    public List<PriceObservationDto> getPriceHistory(String mandiId, String commodityId, Integer days) {
        return getPriceHistory(mandiId, commodityId, null, days);
    }

    public List<PriceObservationDto> getPriceHistory(String mandiId, String commodityId, String varietyId, Integer days) {
        int windowDays = (days != null && days > 0) ? days : 90;
        LocalDate endDate = ForecastConfig.REFERENCE_DATE;
        LocalDate startDate = endDate.minusDays(windowDays - 1L);

        List<PriceObservation> list;
        if (varietyId != null && !varietyId.isBlank() && !"standard".equalsIgnoreCase(varietyId)) {
            list = priceObservationRepository
                    .findByMandiIdAndCommodityIdAndVarietyIdAndObservationDateBetweenOrderByObservationDateAsc(
                            mandiId, commodityId, varietyId, startDate, endDate);
            if (list.isEmpty()) {
                list = priceObservationRepository
                        .findByMandiIdAndCommodityIdAndObservationDateBetweenOrderByObservationDateAsc(
                                mandiId, commodityId, startDate, endDate);
            }
        } else {
            list = priceObservationRepository
                    .findByMandiIdAndCommodityIdAndObservationDateBetweenOrderByObservationDateAsc(
                            mandiId, commodityId, startDate, endDate);
        }

        // If no records in fixed recent window, retrieve the latest available historical observations
        if (list.isEmpty()) {
            Pageable pageable = PageRequest.of(0, windowDays, Sort.by("observationDate").descending());
            if (varietyId != null && !varietyId.isBlank() && !"standard".equalsIgnoreCase(varietyId)) {
                list = priceObservationRepository.findByMandiIdAndCommodityIdAndVarietyIdOrderByObservationDateDesc(
                        mandiId, commodityId, varietyId, pageable);
                if (list.isEmpty()) {
                    list = priceObservationRepository.findByMandiIdAndCommodityIdOrderByObservationDateDesc(
                            mandiId, commodityId, pageable);
                }
            } else {
                list = priceObservationRepository.findByMandiIdAndCommodityIdOrderByObservationDateDesc(
                        mandiId, commodityId, pageable);
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
        List<PriceObservationDto> dtos = getPriceHistory(mandiId, commodityId, varietyId, days);

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
                mandiId,
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
        Pageable pageable = PageRequest.of(0, count, Sort.by("observationDate").descending());
        List<PriceObservation> obs = priceObservationRepository
                .findByMandiIdAndCommodityIdOrderByObservationDateDesc(mandiId, commodityId, pageable);
        return obs.stream()
                .map(PriceObservation::getModalPrice)
                .collect(Collectors.toList());
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
