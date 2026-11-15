package com.agriforecasting.forecast.domain;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "forecast_run_items", indexes = {
    @Index(name = "idx_forecast_item_run_target", columnList = "forecast_run_id, targetDate")
})
public class ForecastRunItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "forecast_run_id", nullable = false)
    @JsonBackReference
    private ForecastRun forecastRun;

    @Column(nullable = false)
    private int dayIndex;

    @Column(nullable = false)
    private LocalDate targetDate;

    @Column(nullable = false)
    private double predictedPrice;

    private double minPrice;
    private double maxPrice;
    private double percentageChangeFromReference;

    // Populated if actual market price observation becomes available for this date
    private Double actualPrice;

    public ForecastRunItem() {}

    public ForecastRunItem(int dayIndex, LocalDate targetDate, double predictedPrice,
                           double minPrice, double maxPrice, double percentageChangeFromReference,
                           Double actualPrice) {
        this.dayIndex = dayIndex;
        this.targetDate = targetDate;
        this.predictedPrice = predictedPrice;
        this.minPrice = minPrice;
        this.maxPrice = maxPrice;
        this.percentageChangeFromReference = percentageChangeFromReference;
        this.actualPrice = actualPrice;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ForecastRun getForecastRun() { return forecastRun; }
    public void setForecastRun(ForecastRun forecastRun) { this.forecastRun = forecastRun; }

    public int getDayIndex() { return dayIndex; }
    public void setDayIndex(int dayIndex) { this.dayIndex = dayIndex; }

    public LocalDate getTargetDate() { return targetDate; }
    public void setTargetDate(LocalDate targetDate) { this.targetDate = targetDate; }

    public double getPredictedPrice() { return predictedPrice; }
    public void setPredictedPrice(double predictedPrice) { this.predictedPrice = predictedPrice; }

    public double getMinPrice() { return minPrice; }
    public void setMinPrice(double minPrice) { this.minPrice = minPrice; }

    public double getMaxPrice() { return maxPrice; }
    public void setMaxPrice(double maxPrice) { this.maxPrice = maxPrice; }

    public double getPercentageChangeFromReference() { return percentageChangeFromReference; }
    public void setPercentageChangeFromReference(double percentageChangeFromReference) {
        this.percentageChangeFromReference = percentageChangeFromReference;
    }

    public Double getActualPrice() { return actualPrice; }
    public void setActualPrice(Double actualPrice) { this.actualPrice = actualPrice; }
}
