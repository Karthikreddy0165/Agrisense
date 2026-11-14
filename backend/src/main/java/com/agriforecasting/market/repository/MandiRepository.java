package com.agriforecasting.market.repository;

import com.agriforecasting.market.domain.Mandi;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MandiRepository extends JpaRepository<Mandi, String> {
    List<Mandi> findByDistrictId(String districtId);
    List<Mandi> findByStateId(String stateId);
    List<Mandi> findByStateIdAndDistrictId(String stateId, String districtId);
    List<Mandi> findByLatitudeIsNotNullAndLongitudeIsNotNull();

    @Query("SELECT m FROM Mandi m WHERE " +
           "(:stateId IS NULL OR :stateId = '' OR m.stateId = :stateId) AND " +
           "(:districtId IS NULL OR :districtId = '' OR m.districtId = :districtId) AND " +
           "(:hasCoords IS NULL OR (:hasCoords = true AND m.latitude IS NOT NULL) OR (:hasCoords = false AND m.latitude IS NULL)) AND " +
           "(:query IS NULL OR :query = '' OR LOWER(m.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(m.fullName) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(m.id) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Mandi> searchMandis(
            @Param("stateId") String stateId,
            @Param("districtId") String districtId,
            @Param("hasCoords") Boolean hasCoords,
            @Param("query") String query,
            Pageable pageable);

    @Query("SELECT m FROM Mandi m WHERE " +
           "(:stateId IS NULL OR :stateId = '' OR m.stateId = :stateId) AND " +
           "(:districtId IS NULL OR :districtId = '' OR m.districtId = :districtId) AND " +
           "(:hasCoords IS NULL OR (:hasCoords = true AND m.latitude IS NOT NULL) OR (:hasCoords = false AND m.latitude IS NULL)) AND " +
           "(:query IS NULL OR :query = '' OR LOWER(m.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(m.fullName) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(m.id) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Mandi> filterMandis(
            @Param("stateId") String stateId,
            @Param("districtId") String districtId,
            @Param("hasCoords") Boolean hasCoords,
            @Param("query") String query);
}
