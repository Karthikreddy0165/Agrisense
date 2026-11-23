package com.agriforecasting.price.repository;

import com.agriforecasting.price.domain.PriceObservation;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PriceObservationRepository extends JpaRepository<PriceObservation, Long> {

    List<PriceObservation> findByMandiIdAndCommodityIdOrderByObservationDateDesc(String mandiId, String commodityId);

    List<PriceObservation> findByMandiIdAndCommodityIdOrderByObservationDateDesc(String mandiId, String commodityId, Pageable pageable);

    List<PriceObservation> findByMandiIdAndCommodityIdAndVarietyIdOrderByObservationDateDesc(String mandiId, String commodityId, String varietyId, Pageable pageable);

    List<PriceObservation> findByMandiIdAndCommodityIdAndObservationDateBetweenOrderByObservationDateAsc(
            String mandiId, String commodityId, LocalDate startDate, LocalDate endDate);

    List<PriceObservation> findByMandiIdAndCommodityIdAndVarietyIdAndObservationDateBetweenOrderByObservationDateAsc(
            String mandiId, String commodityId, String varietyId, LocalDate startDate, LocalDate endDate);

    Optional<PriceObservation> findTopByMandiIdAndCommodityIdOrderByObservationDateDesc(String mandiId, String commodityId);

    Optional<PriceObservation> findByMandiIdAndCommodityIdAndObservationDate(String mandiId, String commodityId, LocalDate observationDate);

    @org.springframework.data.jpa.repository.Query(value =
            "SELECT po.commodity_id, c.name, COUNT(po.id) as obs_count, MAX(po.observation_date) as max_date " +
            "FROM price_observations po " +
            "LEFT JOIN commodities c ON c.id = po.commodity_id " +
            "WHERE po.mandi_id = :mandiId " +
            "GROUP BY po.commodity_id, c.name " +
            "ORDER BY obs_count DESC", nativeQuery = true)
    List<Object[]> findTradedCommoditiesByMandiId(@org.springframework.data.repository.query.Param("mandiId") String mandiId);
}
