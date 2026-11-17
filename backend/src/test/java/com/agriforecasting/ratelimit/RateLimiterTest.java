package com.agriforecasting.ratelimit;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

class RateLimiterTest {

    private InMemorySlidingWindowRateLimiter rateLimiter;

    @BeforeEach
    void setUp() {
        rateLimiter = new InMemorySlidingWindowRateLimiter();
        rateLimiter.reset();
    }

    @Test
    void testRequestsBelowLimitSucceed() {
        String ip = "192.168.1.10";
        String policy = "forecast";
        long limit = 5;
        long windowMs = 10000;

        for (int i = 0; i < 5; i++) {
            RateLimitDecision decision = rateLimiter.checkRateLimit(ip, policy, limit, windowMs);
            assertTrue(decision.allowed(), "Request " + (i + 1) + " should be allowed");
            assertEquals(limit - i - 1, decision.remaining());
        }
    }

    @Test
    void testExceedingLimitRejectsWith429Decision() {
        String ip = "192.168.1.11";
        String policy = "forecast";
        long limit = 3;
        long windowMs = 5000;

        // Exhaust limit
        for (int i = 0; i < 3; i++) {
            assertTrue(rateLimiter.checkRateLimit(ip, policy, limit, windowMs).allowed());
        }

        // 4th request must be rejected
        RateLimitDecision rejected = rateLimiter.checkRateLimit(ip, policy, limit, windowMs);
        assertFalse(rejected.allowed());
        assertEquals(0, rejected.remaining());
        assertTrue(rejected.resetSeconds() > 0);
    }

    @Test
    void testDifferentIpsAreIsolated() {
        String ip1 = "10.0.0.1";
        String ip2 = "10.0.0.2";
        long limit = 2;
        long windowMs = 10000;

        // Exhaust ip1
        assertTrue(rateLimiter.checkRateLimit(ip1, "read", limit, windowMs).allowed());
        assertTrue(rateLimiter.checkRateLimit(ip1, "read", limit, windowMs).allowed());
        assertFalse(rateLimiter.checkRateLimit(ip1, "read", limit, windowMs).allowed());

        // ip2 should still be completely unthrottled
        RateLimitDecision ip2Decision = rateLimiter.checkRateLimit(ip2, "read", limit, windowMs);
        assertTrue(ip2Decision.allowed(), "ip2 should not be throttled by ip1");
        assertEquals(1, ip2Decision.remaining());
    }

    @Test
    void testSlidingWindowExpiration() throws InterruptedException {
        String ip = "192.168.1.50";
        long limit = 2;
        long windowMs = 100; // 100ms window

        assertTrue(rateLimiter.checkRateLimit(ip, "test", limit, windowMs).allowed());
        assertTrue(rateLimiter.checkRateLimit(ip, "test", limit, windowMs).allowed());
        assertFalse(rateLimiter.checkRateLimit(ip, "test", limit, windowMs).allowed());

        // Wait for sliding window to expire
        Thread.sleep(150);

        // Capacity should be restored
        RateLimitDecision decision = rateLimiter.checkRateLimit(ip, "test", limit, windowMs);
        assertTrue(decision.allowed(), "Request after window expiration should be allowed");
    }

    @Test
    void testConcurrencySafety() throws InterruptedException {
        String ip = "192.168.1.99";
        long limit = 10;
        long windowMs = 10000;
        int threads = 20;

        ExecutorService executor = Executors.newFixedThreadPool(threads);
        CountDownLatch latch = new CountDownLatch(threads);
        AtomicInteger allowedCount = new AtomicInteger(0);
        AtomicInteger rejectedCount = new AtomicInteger(0);

        for (int i = 0; i < threads; i++) {
            executor.submit(() -> {
                try {
                    RateLimitDecision decision = rateLimiter.checkRateLimit(ip, "concurrent", limit, windowMs);
                    if (decision.allowed()) {
                        allowedCount.incrementAndGet();
                    } else {
                        rejectedCount.incrementAndGet();
                    }
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await();
        executor.shutdown();

        assertEquals(10, allowedCount.get(), "Exactly limit (10) requests should be allowed");
        assertEquals(10, rejectedCount.get(), "Remaining 10 requests should be rejected");
    }
}
