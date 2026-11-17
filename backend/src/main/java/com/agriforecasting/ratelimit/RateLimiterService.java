package com.agriforecasting.ratelimit;

public interface RateLimiterService {
    RateLimitDecision checkRateLimit(String clientIp, String policy, long limit, long windowMs);
    boolean isDistributed();
}
