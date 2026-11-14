package com.agriforecasting.market.service;

import com.agriforecasting.common.GeoUtils;
import com.agriforecasting.market.domain.District;
import com.agriforecasting.market.domain.Mandi;
import com.agriforecasting.market.dto.DistrictDto;
import com.agriforecasting.market.dto.MandiDto;
import com.agriforecasting.market.dto.StateDto;
import com.agriforecasting.market.repository.DistrictRepository;
import com.agriforecasting.market.repository.MandiRepository;
import com.agriforecasting.market.repository.StateRepository;
import com.agriforecasting.price.domain.PriceObservation;
import com.agriforecasting.price.repository.PriceObservationRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class MarketService {

    private final StateRepository stateRepository;
    private final DistrictRepository districtRepository;
    private final MandiRepository mandiRepository;
    private final PriceObservationRepository priceObservationRepository;

    public MarketService(StateRepository stateRepository,
                         DistrictRepository districtRepository,
                         MandiRepository mandiRepository,
                         PriceObservationRepository priceObservationRepository) {
        this.stateRepository = stateRepository;
        this.districtRepository = districtRepository;
        this.mandiRepository = mandiRepository;
        this.priceObservationRepository = priceObservationRepository;
    }

    public List<StateDto> getAllStates() {
        return stateRepository.findAll().stream()
                .map(s -> new StateDto(s.getId(), s.getName(), s.getCode()))
                .sorted(Comparator.comparing(StateDto::name))
                .collect(Collectors.toList());
    }

    public List<DistrictDto> getDistricts(String stateId) {
        List<District> list = (stateId != null && !stateId.isBlank())
                ? districtRepository.findByStateId(stateId)
                : districtRepository.findAll();
        return list.stream()
                .map(d -> new DistrictDto(d.getId(), d.getStateId(), d.getName()))
                .sorted(Comparator.comparing(DistrictDto::name))
                .collect(Collectors.toList());
    }

    public List<MandiDto> getAllMandis(String commodityId) {
        return getMandis(null, null, null, null, null, null, commodityId);
    }

    public List<MandiDto> getMandis(String stateId, String districtId, String search, Boolean hasCoordinates,
                                    Integer page, Integer size, String commodityId) {
        List<Mandi> mandis;
        if (size != null && size > 0) {
            int pageNum = (page != null && page >= 0) ? page : 0;
            Pageable pageable = PageRequest.of(pageNum, size, Sort.by("name").ascending());
            Page<Mandi> pagedResult = mandiRepository.searchMandis(stateId, districtId, hasCoordinates, search, pageable);
            mandis = pagedResult.getContent();
        } else {
            mandis = mandiRepository.filterMandis(stateId, districtId, hasCoordinates, search);
        }

        return mandis.stream()
                .map(m -> toDto(m, null, null, commodityId))
                .collect(Collectors.toList());
    }

    public Optional<MandiDto> getMandiById(String mandiId, Double userLat, Double userLon, String commodityId) {
        Optional<Mandi> mandi = mandiRepository.findById(mandiId);
        if (mandi.isEmpty()) {
            List<Mandi> matches = mandiRepository.filterMandis(null, null, null, mandiId);
            if (!matches.isEmpty()) {
                return Optional.of(toDto(matches.get(0), userLat, userLon, commodityId));
            }
        }
        return mandi.map(m -> toDto(m, userLat, userLon, commodityId));
    }

    public List<MandiDto> getNearbyMandis(Double userLat, Double userLon, Double radiusKm, String commodityId) {
        List<Mandi> all = mandiRepository.findAll();
        List<MandiDto> dtoList = new ArrayList<>();

        for (Mandi m : all) {
            Double distance = null;
            if (userLat != null && userLon != null) {
                if (m.getLatitude() == null || m.getLongitude() == null) {
                    continue; // exclude mandis without coordinates from distance-radius search
                }
                distance = GeoUtils.calculateDistanceKm(userLat, userLon, m.getLatitude(), m.getLongitude());
                if (distance != null && radiusKm != null && radiusKm > 0 && distance > radiusKm) {
                    continue; // Out of requested radius
                }
            }
            dtoList.add(toDto(m, userLat, userLon, commodityId));
        }

        if (userLat != null && userLon != null) {
            dtoList.sort(Comparator.comparing(m -> m.distanceKm() != null ? m.distanceKm() : Double.MAX_VALUE));
        } else {
            dtoList.sort(Comparator.comparing(MandiDto::name));
        }

        return dtoList;
    }

    private MandiDto toDto(Mandi m, Double userLat, Double userLon, String commodityId) {
        Double distance = null;
        if (userLat != null && userLon != null && m.getLatitude() != null && m.getLongitude() != null) {
            distance = GeoUtils.calculateDistanceKm(userLat, userLon, m.getLatitude(), m.getLongitude());
        }

        Double latestModal = null;
        Double minPrice = null;
        Double maxPrice = null;
        Double arrivals = null;
        String obsDate = null;
        String trend = "Stable";

        if (commodityId != null && !commodityId.isBlank()) {
            Pageable topTwo = PageRequest.of(0, 2, Sort.by("observationDate").descending());
            List<PriceObservation> obs = priceObservationRepository
                    .findByMandiIdAndCommodityIdOrderByObservationDateDesc(m.getId(), commodityId, topTwo);
            if (!obs.isEmpty()) {
                PriceObservation latest = obs.get(0);
                latestModal = latest.getModalPrice();
                minPrice = latest.getMinPrice();
                maxPrice = latest.getMaxPrice();
                arrivals = latest.getArrivals();
                obsDate = latest.getObservationDate().toString();

                if (obs.size() > 1) {
                    PriceObservation prev = obs.get(1);
                    double diff = latestModal - prev.getModalPrice();
                    if (diff > 5) trend = "Rising";
                    else if (diff < -5) trend = "Falling";
                    else trend = "Stable";
                }
            }
        }

        return new MandiDto(
                m.getId(),
                m.getDistrictId(),
                m.getStateId(),
                m.getName(),
                m.getFullName(),
                m.getLatitude(),
                m.getLongitude(),
                m.getCoordinateSource() != null ? m.getCoordinateSource() : "UNRESOLVED",
                m.getCoordinateStatus() != null ? m.getCoordinateStatus() : "UNRESOLVED",
                distance,
                latestModal,
                minPrice,
                maxPrice,
                arrivals,
                obsDate,
                trend
        );
    }
}
