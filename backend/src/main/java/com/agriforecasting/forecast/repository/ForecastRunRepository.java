package com.agriforecasting.forecast.repository;

import com.agriforecasting.forecast.domain.ForecastRun;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ForecastRunRepository extends JpaRepository<ForecastRun, Long> {

    Optional<ForecastRun> findFirstByMandiIdAndCommodityIdAndVarietyIdAndReferenceDateOrderByGeneratedAtDesc(
            String mandiId, String commodityId, String varietyId, LocalDate referenceDate);

    @Query("SELECT r FROM ForecastRun r WHERE " +
           "(:mandiId IS NULL OR :mandiId = '' OR r.mandiId = :mandiId) AND " +
           "(:commodityId IS NULL OR :commodityId = '' OR r.commodityId = :commodityId) AND " +
           "(:varietyId IS NULL OR :varietyId = '' OR r.varietyId = :varietyId) AND " +
           "r.generatedAt >= :fromDateTime AND r.generatedAt <= :toDateTime " +
           "ORDER BY r.generatedAt DESC")
    List<ForecastRun> findFilteredRuns(
            @Param("mandiId") String mandiId,
            @Param("commodityId") String commodityId,
            @Param("varietyId") String varietyId,
            @Param("fromDateTime") LocalDateTime fromDateTime,
            @Param("toDateTime") LocalDateTime toDateTime
    );
}
