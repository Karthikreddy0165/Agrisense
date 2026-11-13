package com.agriforecasting.price.domain;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "price_observations", indexes = {
    @Index(name = "idx_obs_mandi_commodity", columnList = "mandiId, commodityId, observationDate")
})
public class PriceObservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String mandiId;
    private String commodityId;
    private String varietyId;
    private LocalDate observationDate;
    private double minPrice;
    private double maxPrice;
    private double modalPrice;
    private double arrivals;

    public PriceObservation() {}

    public PriceObservation(String mandiId, String commodityId, String varietyId, LocalDate observationDate,
                            double minPrice, double maxPrice, double modalPrice, double arrivals) {
        this.mandiId = mandiId;
        this.commodityId = commodityId;
        this.varietyId = varietyId;
        this.observationDate = observationDate;
        this.minPrice = minPrice;
        this.maxPrice = maxPrice;
        this.modalPrice = modalPrice;
        this.arrivals = arrivals;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getMandiId() { return mandiId; }
    public void setMandiId(String mandiId) { this.mandiId = mandiId; }
    public String getCommodityId() { return commodityId; }
    public void setCommodityId(String commodityId) { this.commodityId = commodityId; }
    public String getVarietyId() { return varietyId; }
    public void setVarietyId(String varietyId) { this.varietyId = varietyId; }
    public LocalDate getObservationDate() { return observationDate; }
    public void setObservationDate(LocalDate observationDate) { this.observationDate = observationDate; }
    public double getMinPrice() { return minPrice; }
    public void setMinPrice(double minPrice) { this.minPrice = minPrice; }
    public double getMaxPrice() { return maxPrice; }
    public void setMaxPrice(double maxPrice) { this.maxPrice = maxPrice; }
    public double getModalPrice() { return modalPrice; }
    public void setModalPrice(double modalPrice) { this.modalPrice = modalPrice; }
    public double getArrivals() { return arrivals; }
    public void setArrivals(double arrivals) { this.arrivals = arrivals; }
}
