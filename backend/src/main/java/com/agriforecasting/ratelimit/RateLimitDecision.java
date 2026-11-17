package com.agriforecasting.ratelimit;

public record RateLimitDecision(
        boolean allowed,
        long limit,
        long remaining,
        long resetSeconds
) {}
