package com.agriforecasting.forecast.domain;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "forecast_runs", indexes = {
    @Index(name = "idx_forecast_mandi_comm_var", columnList = "mandiId, commodityId, varietyId, referenceDate"),
    @Index(name = "idx_forecast_generated_at", columnList = "generatedAt")
})
public class ForecastRun {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String mandiId;

    private String mandiName;

    @Column(nullable = false)
    private String commodityId;

    private String commodityName;

    private String varietyId;

    private String varietyName;

    @Column(nullable = false)
    private LocalDate referenceDate;

    @Column(nullable = false)
    private LocalDateTime generatedAt;

    private int forecastHorizon;
    private LocalDate forecastStart;
    private LocalDate forecastEnd;
    private String modelVersion;
    private String status;
    private double latestActualPrice;
    private LocalDate latestActualDate;
    private double expectedPrice7d;
    private double expectedPrice14d;
    private double percentageChange14d;
    private String expectedDirection;
    private double expectedMin;
    private double expectedMax;

    @Column(length = 1000)
    private String interpretation;

    private boolean isFallback;

    @OneToMany(mappedBy = "forecastRun", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("dayIndex ASC")
    @JsonManagedReference
    private List<ForecastRunItem> items = new ArrayList<>();

    public ForecastRun() {}

    public ForecastRun(String mandiId, String mandiName, String commodityId, String commodityName,
                       String varietyId, String varietyName, LocalDate referenceDate, LocalDateTime generatedAt,
                       int forecastHorizon, LocalDate forecastStart, LocalDate forecastEnd, String modelVersion,
                       String status, double latestActualPrice, LocalDate latestActualDate, double expectedPrice7d,
                       double expectedPrice14d, double percentageChange14d, String expectedDirection,
                       double expectedMin, double expectedMax, String interpretation, boolean isFallback) {
        this.mandiId = mandiId;
        this.mandiName = mandiName;
        this.commodityId = commodityId;
        this.commodityName = commodityName;
        this.varietyId = varietyId;
        this.varietyName = varietyName;
        this.referenceDate = referenceDate;
        this.generatedAt = generatedAt;
        this.forecastHorizon = forecastHorizon;
        this.forecastStart = forecastStart;
        this.forecastEnd = forecastEnd;
        this.modelVersion = modelVersion;
        this.status = status;
        this.latestActualPrice = latestActualPrice;
        this.latestActualDate = latestActualDate;
        this.expectedPrice7d = expectedPrice7d;
        this.expectedPrice14d = expectedPrice14d;
        this.percentageChange14d = percentageChange14d;
        this.expectedDirection = expectedDirection;
        this.expectedMin = expectedMin;
        this.expectedMax = expectedMax;
        this.interpretation = interpretation;
        this.isFallback = isFallback;
    }

    public void addItem(ForecastRunItem item) {
        items.add(item);
        item.setForecastRun(this);
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getMandiId() { return mandiId; }
    public void setMandiId(String mandiId) { this.mandiId = mandiId; }

    public String getMandiName() { return mandiName; }
    public void setMandiName(String mandiName) { this.mandiName = mandiName; }

    public String getCommodityId() { return commodityId; }
    public void setCommodityId(String commodityId) { this.commodityId = commodityId; }

    public String getCommodityName() { return commodityName; }
    public void setCommodityName(String commodityName) { this.commodityName = commodityName; }

    public String getVarietyId() { return varietyId; }
    public void setVarietyId(String varietyId) { this.varietyId = varietyId; }

    public String getVarietyName() { return varietyName; }
    public void setVarietyName(String varietyName) { this.varietyName = varietyName; }

    public LocalDate getReferenceDate() { return referenceDate; }
    public void setReferenceDate(LocalDate referenceDate) { this.referenceDate = referenceDate; }

    public LocalDateTime getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(LocalDateTime generatedAt) { this.generatedAt = generatedAt; }

    public int getForecastHorizon() { return forecastHorizon; }
    public void setForecastHorizon(int forecastHorizon) { this.forecastHorizon = forecastHorizon; }

    public LocalDate getForecastStart() { return forecastStart; }
    public void setForecastStart(LocalDate forecastStart) { this.forecastStart = forecastStart; }

    public LocalDate getForecastEnd() { return forecastEnd; }
    public void setForecastEnd(LocalDate forecastEnd) { this.forecastEnd = forecastEnd; }

    public String getModelVersion() { return modelVersion; }
    public void setModelVersion(String modelVersion) { this.modelVersion = modelVersion; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public double getLatestActualPrice() { return latestActualPrice; }
    public void setLatestActualPrice(double latestActualPrice) { this.latestActualPrice = latestActualPrice; }

    public LocalDate getLatestActualDate() { return latestActualDate; }
    public void setLatestActualDate(LocalDate latestActualDate) { this.latestActualDate = latestActualDate; }

    public double getExpectedPrice7d() { return expectedPrice7d; }
    public void setExpectedPrice7d(double expectedPrice7d) { this.expectedPrice7d = expectedPrice7d; }

    public double getExpectedPrice14d() { return expectedPrice14d; }
    public void setExpectedPrice14d(double expectedPrice14d) { this.expectedPrice14d = expectedPrice14d; }

    public double getPercentageChange14d() { return percentageChange14d; }
    public void setPercentageChange14d(double percentageChange14d) { this.percentageChange14d = percentageChange14d; }

    public String getExpectedDirection() { return expectedDirection; }
    public void setExpectedDirection(String expectedDirection) { this.expectedDirection = expectedDirection; }

    public double getExpectedMin() { return expectedMin; }
    public void setExpectedMin(double expectedMin) { this.expectedMin = expectedMin; }

    public double getExpectedMax() { return expectedMax; }
    public void setExpectedMax(double expectedMax) { this.expectedMax = expectedMax; }

    public String getInterpretation() { return interpretation; }
    public void setInterpretation(String interpretation) { this.interpretation = interpretation; }

    public boolean isFallback() { return isFallback; }
    public void setFallback(boolean fallback) { isFallback = fallback; }

    public List<ForecastRunItem> getItems() { return items; }
    public void setItems(List<ForecastRunItem> items) { this.items = items; }
}
