package com.agriforecasting.market.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

@Entity
@Table(name = "mandis", indexes = {
    @Index(name = "idx_mandis_state", columnList = "stateId"),
    @Index(name = "idx_mandis_district", columnList = "districtId"),
    @Index(name = "idx_mandis_name", columnList = "name")
})
public class Mandi {
    @Id
    private String id;
    private String districtId;
    private String stateId;
    private String name;
    private String fullName;
    private Double latitude;
    private Double longitude;
    private String coordinateSource;
    private String coordinateStatus;

    public Mandi() {}

    public Mandi(String id, String districtId, String stateId, String name, String fullName, Double latitude, Double longitude) {
        this(id, districtId, stateId, name, fullName, latitude, longitude,
                (latitude != null && longitude != null) ? "GEOCODED" : "UNRESOLVED",
                (latitude != null && longitude != null) ? "VERIFIED" : "UNRESOLVED");
    }

    public Mandi(String id, String districtId, String stateId, String name, String fullName,
                 Double latitude, Double longitude, String coordinateSource, String coordinateStatus) {
        this.id = id;
        this.districtId = districtId;
        this.stateId = stateId;
        this.name = name;
        this.fullName = fullName;
        this.latitude = latitude;
        this.longitude = longitude;
        this.coordinateSource = coordinateSource;
        this.coordinateStatus = coordinateStatus;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getDistrictId() { return districtId; }
    public void setDistrictId(String districtId) { this.districtId = districtId; }
    public String getStateId() { return stateId; }
    public void setStateId(String stateId) { this.stateId = stateId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public String getCoordinateSource() { return coordinateSource; }
    public void setCoordinateSource(String coordinateSource) { this.coordinateSource = coordinateSource; }
    public String getCoordinateStatus() { return coordinateStatus; }
    public void setCoordinateStatus(String coordinateStatus) { this.coordinateStatus = coordinateStatus; }
}
