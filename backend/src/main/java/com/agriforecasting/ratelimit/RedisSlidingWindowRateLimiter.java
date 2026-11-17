package com.agriforecasting.ratelimit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

/**
 * Distributed sliding-window rate limiter backed by Redis.
 * Uses sorted sets (ZSET) with an atomic Lua script to guarantee atomicity.
 */
@Service
public class RedisSlidingWindowRateLimiter implements RateLimiterService {

    private static final Logger log = LoggerFactory.getLogger(RedisSlidingWindowRateLimiter.class);

    private final StringRedisTemplate redisTemplate;
    private final DefaultRedisScript<List> luaScript;

    // Lua script executing sliding-window rate limit check atomically
    private static final String LUA_SLIDING_WINDOW =
            "local key = KEYS[1]\n" +
            "local now = tonumber(ARGV[1])\n" +
            "local window = tonumber(ARGV[2])\n" +
            "local limit = tonumber(ARGV[3])\n" +
            "local clearBefore = now - window\n" +
            "\n" +
            "redis.call('ZREMRANGEBYSCORE', key, 0, clearBefore)\n" +
            "local currentRequests = redis.call('ZCARD', key)\n" +
            "if currentRequests < limit then\n" +
            "    redis.call('ZADD', key, now, now)\n" +
            "    redis.call('EXPIRE', key, math.ceil(window / 1000) + 5)\n" +
            "    local remaining = limit - currentRequests - 1\n" +
            "    return {1, remaining, 0}\n" +
            "else\n" +
            "    local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')\n" +
            "    local oldestTime = tonumber(oldest[2]) or now\n" +
            "    local resetSeconds = math.ceil((oldestTime + window - now) / 1000)\n" +
            "    if resetSeconds < 1 then resetSeconds = 1 end\n" +
            "    return {0, 0, resetSeconds}\n" +
            "end";

    public RedisSlidingWindowRateLimiter(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
        this.luaScript = new DefaultRedisScript<>();
        this.luaScript.setScriptText(LUA_SLIDING_WINDOW);
        this.luaScript.setResultType(List.class);
    }

    @Override
    public RateLimitDecision checkRateLimit(String clientIp, String policy, long limit, long windowMs) {
        String key = "agri:rate:" + policy + ":" + clientIp;
        long now = System.currentTimeMillis();

        try {
            List<Object> result = redisTemplate.execute(
                    luaScript,
                    Collections.singletonList(key),
                    String.valueOf(now),
                    String.valueOf(windowMs),
                    String.valueOf(limit)
            );

            if (result != null && result.size() >= 3) {
                boolean allowed = ((Number) result.get(0)).longValue() == 1L;
                long remaining = ((Number) result.get(1)).longValue();
                long resetSeconds = ((Number) result.get(2)).longValue();
                return new RateLimitDecision(allowed, limit, remaining, resetSeconds);
            }
        } catch (Exception e) {
            log.warn("Redis rate-limiter execution failed, falling back: {}", e.getMessage());
            throw e;
        }

        return new RateLimitDecision(true, limit, limit - 1, 0);
    }

    @Override
    public boolean isDistributed() {
        return true;
    }
}
