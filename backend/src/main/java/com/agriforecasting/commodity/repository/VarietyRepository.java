package com.agriforecasting.commodity.repository;

import com.agriforecasting.commodity.domain.Variety;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VarietyRepository extends JpaRepository<Variety, String> {
    List<Variety> findByCommodityId(String commodityId);
}
