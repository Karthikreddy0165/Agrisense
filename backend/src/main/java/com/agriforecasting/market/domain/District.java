package com.agriforecasting.market.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

@Entity
@Table(name = "districts", indexes = {
    @Index(name = "idx_districts_state", columnList = "stateId"),
    @Index(name = "idx_districts_name", columnList = "name")
})
public class District {
    @Id
    private String id;
    private String stateId;
    private String name;

    public District() {}

    public District(String id, String stateId, String name) {
        this.id = id;
        this.stateId = stateId;
        this.name = name;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getStateId() { return stateId; }
    public void setStateId(String stateId) { this.stateId = stateId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
