package com.agriforecasting.ratelimit;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.List;

@Configuration
@ConfigurationProperties(prefix = "agri.rate-limit")
public class RateLimitProperties {

    private boolean enabled = true;
    private boolean redisEnabled = true;
    private long windowMs = 60000; // 1 minute sliding window
    private long defaultLimit = 60; // 60 req/min for general read APIs
    private long searchLimit = 30; // 30 req/min for nearby search
    private long forecastLimit = 15; // 15 req/min for ML forecast generation
    private long comparisonLimit = 20; // 20 req/min for comparisons
    private String trustedProxies = "127.0.0.1,::1,0:0:0:0:0:0:0:1";

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public boolean isRedisEnabled() { return redisEnabled; }
    public void setRedisEnabled(boolean redisEnabled) { this.redisEnabled = redisEnabled; }

    public long getWindowMs() { return windowMs; }
    public void setWindowMs(long windowMs) { this.windowMs = windowMs; }

    public long getDefaultLimit() { return defaultLimit; }
    public void setDefaultLimit(long defaultLimit) { this.defaultLimit = defaultLimit; }

    public long getSearchLimit() { return searchLimit; }
    public void setSearchLimit(long searchLimit) { this.searchLimit = searchLimit; }

    public long getForecastLimit() { return forecastLimit; }
    public void setForecastLimit(long forecastLimit) { this.forecastLimit = forecastLimit; }

    public long getComparisonLimit() { return comparisonLimit; }
    public void setComparisonLimit(long comparisonLimit) { this.comparisonLimit = comparisonLimit; }

    public String getTrustedProxies() { return trustedProxies; }
    public void setTrustedProxies(String trustedProxies) { this.trustedProxies = trustedProxies; }

    public List<String> getTrustedProxyList() {
        if (trustedProxies == null || trustedProxies.isBlank()) return List.of("127.0.0.1", "::1");
        return Arrays.stream(trustedProxies.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }
}
