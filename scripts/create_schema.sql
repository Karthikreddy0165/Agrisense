-- AgriForecasting PostgreSQL Schema

CREATE TABLE IF NOT EXISTS states (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS districts (
    id VARCHAR(255) PRIMARY KEY,
    state_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_districts_state ON districts(state_id);
CREATE INDEX IF NOT EXISTS idx_districts_name ON districts(name);

CREATE TABLE IF NOT EXISTS mandis (
    id VARCHAR(255) PRIMARY KEY,
    district_id VARCHAR(255) NOT NULL,
    state_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    coordinate_source VARCHAR(255),
    coordinate_status VARCHAR(255)
);
CREATE INDEX IF NOT EXISTS idx_mandis_state ON mandis(state_id);
CREATE INDEX IF NOT EXISTS idx_mandis_district ON mandis(district_id);
CREATE INDEX IF NOT EXISTS idx_mandis_name ON mandis(name);

CREATE TABLE IF NOT EXISTS commodities (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(255),
    unit VARCHAR(50),
    slug VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS varieties (
    id VARCHAR(255) PRIMARY KEY,
    commodity_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_varieties_commodity ON varieties(commodity_id);

CREATE TABLE IF NOT EXISTS price_observations (
    id BIGSERIAL PRIMARY KEY,
    mandi_id VARCHAR(255) NOT NULL,
    commodity_id VARCHAR(255) NOT NULL,
    variety_id VARCHAR(255) NOT NULL,
    observation_date DATE NOT NULL,
    min_price DOUBLE PRECISION NOT NULL,
    max_price DOUBLE PRECISION NOT NULL,
    modal_price DOUBLE PRECISION NOT NULL,
    arrivals DOUBLE PRECISION NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_obs_mandi_commodity ON price_observations(mandi_id, commodity_id, observation_date);
CREATE INDEX IF NOT EXISTS idx_obs_mandi_comm_var_date ON price_observations(mandi_id, commodity_id, variety_id, observation_date);

CREATE TABLE IF NOT EXISTS forecast_runs (
    id BIGSERIAL PRIMARY KEY,
    mandi_id VARCHAR(255) NOT NULL,
    mandi_name VARCHAR(255),
    commodity_id VARCHAR(255) NOT NULL,
    commodity_name VARCHAR(255),
    variety_id VARCHAR(255),
    variety_name VARCHAR(255),
    reference_date DATE NOT NULL,
    generated_at TIMESTAMP NOT NULL,
    forecast_horizon INT NOT NULL,
    forecast_start DATE,
    forecast_end DATE,
    model_version VARCHAR(255),
    status VARCHAR(255),
    latest_actual_price DOUBLE PRECISION NOT NULL,
    latest_actual_date DATE,
    expected_price7d DOUBLE PRECISION NOT NULL,
    expected_price14d DOUBLE PRECISION NOT NULL,
    percentage_change14d DOUBLE PRECISION NOT NULL,
    expected_direction VARCHAR(255),
    expected_min DOUBLE PRECISION NOT NULL,
    expected_max DOUBLE PRECISION NOT NULL,
    interpretation VARCHAR(1000),
    is_fallback BOOLEAN NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_forecast_mandi_comm_var ON forecast_runs(mandi_id, commodity_id, variety_id, reference_date);
CREATE INDEX IF NOT EXISTS idx_forecast_generated_at ON forecast_runs(generated_at);

CREATE TABLE IF NOT EXISTS forecast_run_items (
    id BIGSERIAL PRIMARY KEY,
    forecast_run_id BIGINT NOT NULL REFERENCES forecast_runs(id) ON DELETE CASCADE,
    day_index INT NOT NULL,
    target_date DATE NOT NULL,
    predicted_price DOUBLE PRECISION NOT NULL,
    min_price DOUBLE PRECISION NOT NULL,
    max_price DOUBLE PRECISION NOT NULL,
    percentage_change_from_reference DOUBLE PRECISION NOT NULL,
    actual_price DOUBLE PRECISION
);
CREATE INDEX IF NOT EXISTS idx_forecast_item_run_target ON forecast_run_items(forecast_run_id, target_date);
