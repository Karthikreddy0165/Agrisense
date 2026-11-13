package com.agriforecasting.commodity.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "commodities")
public class Commodity {
    @Id
    private String id;
    private String name;
    private String category;
    private String unit;
    private String slug;

    public Commodity() {}

    public Commodity(String id, String name, String category, String unit, String slug) {
        this.id = id;
        this.name = name;
        this.category = category;
        this.unit = unit;
        this.slug = slug;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
}
