package com.agriforecasting.commodity.service;

import com.agriforecasting.commodity.domain.Commodity;
import com.agriforecasting.commodity.domain.Variety;
import com.agriforecasting.commodity.dto.CommodityDto;
import com.agriforecasting.commodity.dto.VarietyDto;
import com.agriforecasting.commodity.repository.CommodityRepository;
import com.agriforecasting.commodity.repository.VarietyRepository;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CommodityService {

    private final CommodityRepository commodityRepository;
    private final VarietyRepository varietyRepository;

    public CommodityService(CommodityRepository commodityRepository, VarietyRepository varietyRepository) {
        this.commodityRepository = commodityRepository;
        this.varietyRepository = varietyRepository;
    }

    public List<CommodityDto> getAllCommodities() {
        return commodityRepository.findAll().stream()
                .map(c -> new CommodityDto(c.getId(), c.getName(), c.getCategory(), c.getUnit(), c.getSlug()))
                .sorted(Comparator.comparing(CommodityDto::name))
                .collect(Collectors.toList());
    }

    public Optional<CommodityDto> getCommodityById(String id) {
        return commodityRepository.findById(id)
                .map(c -> new CommodityDto(c.getId(), c.getName(), c.getCategory(), c.getUnit(), c.getSlug()));
    }

    public List<VarietyDto> getVarietiesByCommodity(String commodityId) {
        return varietyRepository.findByCommodityId(commodityId).stream()
                .map(v -> new VarietyDto(v.getId(), v.getCommodityId(), v.getName()))
                .sorted(Comparator.comparing(VarietyDto::name))
                .collect(Collectors.toList());
    }
}
