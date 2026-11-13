package com.agriforecasting.commodity.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "varieties")
public class Variety {
    @Id
    private String id;
    private String commodityId;
    private String name;

    public Variety() {}

    public Variety(String id, String commodityId, String name) {
        this.id = id;
        this.commodityId = commodityId;
        this.name = name;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCommodityId() { return commodityId; }
    public void setCommodityId(String commodityId) { this.commodityId = commodityId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
