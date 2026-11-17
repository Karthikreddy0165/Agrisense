package com.agriforecasting.ratelimit;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;

@Component
@Order(1)
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);

    private final RateLimitProperties properties;
    private final RedisSlidingWindowRateLimiter redisRateLimiter;
    private final InMemorySlidingWindowRateLimiter inMemoryRateLimiter;
    private final ObjectMapper objectMapper;

    public RateLimitFilter(
            RateLimitProperties properties,
            RedisSlidingWindowRateLimiter redisRateLimiter,
            InMemorySlidingWindowRateLimiter inMemoryRateLimiter,
            ObjectMapper objectMapper) {
        this.properties = properties;
        this.redisRateLimiter = redisRateLimiter;
        this.inMemoryRateLimiter = inMemoryRateLimiter;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String uri = request.getRequestURI();

        // 1. Bypass rate limiting for disabled state, non-API endpoints, health & actuator checks
        if (!properties.isEnabled()
                || !uri.startsWith("/api/v1/")
                || uri.startsWith("/api/v1/health")
                || uri.startsWith("/actuator")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 2. Resolve client IP securely respecting trusted reverse proxies
        String clientIp = resolveClientIp(request);

        // 3. Determine endpoint policy and limit
        String policy = "default";
        long limit = properties.getDefaultLimit();

        if (uri.startsWith("/api/v1/forecasts")) {
            policy = "forecast";
            limit = properties.getForecastLimit();
        } else if (uri.startsWith("/api/v1/mandis/nearby")) {
            policy = "search";
            limit = properties.getSearchLimit();
        } else if (uri.startsWith("/api/v1/comparisons")) {
            policy = "comparison";
            limit = properties.getComparisonLimit();
        }

        long windowMs = properties.getWindowMs();

        // 4. Execute sliding window check with Redis, falling back to In-Memory
        RateLimitDecision decision;
        try {
            if (properties.isRedisEnabled()) {
                decision = redisRateLimiter.checkRateLimit(clientIp, policy, limit, windowMs);
            } else {
                decision = inMemoryRateLimiter.checkRateLimit(clientIp, policy, limit, windowMs);
            }
        } catch (Exception e) {
            log.warn("Redis limiter unavailable, falling back to in-memory sliding window: {}", e.getMessage());
            decision = inMemoryRateLimiter.checkRateLimit(clientIp, policy, limit, windowMs);
        }

        // 5. Populate rate limit headers
        response.setHeader("X-RateLimit-Limit", String.valueOf(decision.limit()));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(decision.remaining()));

        // 6. Handle rate limit exceeded (HTTP 429)
        if (!decision.allowed()) {
            response.setStatus(429);
            response.setHeader("X-RateLimit-Reset", String.valueOf(decision.resetSeconds()));
            response.setHeader("Retry-After", String.valueOf(decision.resetSeconds()));
            response.setContentType("application/json");

            Map<String, Object> errorBody = new java.util.HashMap<>();
            errorBody.put("success", false);
            errorBody.put("message", "Too Many Requests: Rate limit exceeded. Try again in " + decision.resetSeconds() + " seconds.");
            errorBody.put("data", null);
            errorBody.put("timestamp", LocalDateTime.now().toString());

            response.getWriter().write(objectMapper.writeValueAsString(errorBody));
            return;
        }

        // 7. Proceed with request
        filterChain.doFilter(request, response);
    }

    private String resolveClientIp(HttpServletRequest request) {
        String remoteAddr = request.getRemoteAddr();

        // Only trust X-Forwarded-For if remote address is in trusted proxies
        if (properties.getTrustedProxyList().contains(remoteAddr)) {
            String forwarded = request.getHeader("X-Forwarded-For");
            if (forwarded != null && !forwarded.isBlank()) {
                // Client IP is the leftmost address
                return forwarded.split(",")[0].trim();
            }
        }

        return remoteAddr != null ? remoteAddr : "127.0.0.1";
    }
}
