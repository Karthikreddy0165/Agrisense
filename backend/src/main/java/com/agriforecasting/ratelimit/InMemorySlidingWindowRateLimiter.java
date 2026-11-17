package com.agriforecasting.ratelimit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Thread-safe single-instance sliding-window rate limiter.
 * Used as local in-memory development fallback when Redis is disabled or unreachable.
 * Clearly identified as SINGLE-INSTANCE ONLY.
 */
@Service
public class InMemorySlidingWindowRateLimiter implements RateLimiterService {

    private static final Logger log = LoggerFactory.getLogger(InMemorySlidingWindowRateLimiter.class);

    // Key format: policy:clientIp -> Deque of request epoch timestamps
    private final Map<String, Deque<Long>> windowMap = new ConcurrentHashMap<>();

    @Override
    public RateLimitDecision checkRateLimit(String clientIp, String policy, long limit, long windowMs) {
        String key = policy + ":" + clientIp;
        long now = System.currentTimeMillis();
        long clearBefore = now - windowMs;

        Deque<Long> timestamps = windowMap.computeIfAbsent(key, k -> new ArrayDeque<>());

        synchronized (timestamps) {
            // 1. Remove expired timestamps outside the sliding window
            while (!timestamps.isEmpty() && timestamps.peekFirst() <= clearBefore) {
                timestamps.pollFirst();
            }

            int currentCount = timestamps.size();

            // 2. Check capacity
            if (currentCount < limit) {
                timestamps.addLast(now);
                long remaining = limit - currentCount - 1;
                return new RateLimitDecision(true, limit, remaining, 0);
            } else {
                long oldest = timestamps.peekFirst() != null ? timestamps.peekFirst() : now;
                long resetSeconds = Math.max(1, (oldest + windowMs - now + 999) / 1000);
                return new RateLimitDecision(false, limit, 0, resetSeconds);
            }
        }
    }

    @Override
    public boolean isDistributed() {
        return false;
    }

    // Helper for testing
    public void reset() {
        windowMap.clear();
    }
}
