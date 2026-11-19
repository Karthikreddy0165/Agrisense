# Sliding-Window Rate Limiting Architecture — Agri

## 1. Requirement & Owner Mandate `[DECIDED]`

To protect the platform from denial-of-service, runaway scraping, and inference exhaustion, all public API requests must be rate-limited by **client IP** using a precision **sliding-window** algorithm.

---

## 2. Policy Configuration & Quotas

Configured in `backend/src/main/resources/application.properties`:

| Policy Name | Endpoints Covered | Window (Seconds) | Limit (Requests) | Action on Breach |
|---|---|---|---|---|
| `read` | `/states`, `/districts`, `/commodities` | 60 | 60 | HTTP 429 Too Many Requests |
| `search` | `/mandis`, `/mandis/nearby` | 60 | 30 | HTTP 429 Too Many Requests |
| `forecast` | `/forecasts`, `/forecasts/generate` | 60 | 20 | HTTP 429 Too Many Requests |
| `compare` | `/comparisons` | 60 | 20 | HTTP 429 Too Many Requests |
| **Exempt** | `/health`, `/ready`, `/actuator/*` | - | **Unlimited** | Never throttled |

---

## 3. Sliding-Window Implementation

### 1. Redis Sorted Set Algorithm (Production Multi-Instance)
For distributed VPS deployments, rate limiting is executed via an atomic Redis Lua script:
```lua
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local clearBefore = now - window

-- Remove timestamps outside the sliding window
redis.call('ZREMRANGEBYSCORE', key, '-inf', clearBefore)

-- Count requests remaining in window
local currentRequests = redis.call('ZCARD', key)
if currentRequests < limit then
    redis.call('ZADD', key, now, now)
    redis.call('PEXPIRE', key, window)
    return {1, limit - currentRequests - 1, 0}
else
    local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
    local resetMs = (oldest[2] + window) - now
    return {0, 0, math.ceil(resetMs / 1000)}
end
```

### 2. In-Memory Concurrent Fallback (`InMemorySlidingWindowRateLimiter`)
For local development or when Redis is temporarily offline, an in-memory concurrent sliding window engine automatically activates:
- Maintains a `ConcurrentHashMap<String, Deque<Long>>` keyed by `ip:policy`.
- Synchronized locks per key prune timestamps older than `now - windowMs`.
- Verified across concurrent multi-threading tests (`RateLimiterTest.java`).

---

## 4. HTTP Headers & Error Payload

### Response Headers Returned on All Rate-Limited Requests:
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 54
X-RateLimit-Reset: 12
```

### Response Body on Quota Breach (HTTP 429 Too Many Requests):
```json
{
  "success": false,
  "message": "Rate limit exceeded for policy 'forecast'. Maximum 20 requests per 60 seconds allowed.",
  "data": {
    "policy": "forecast",
    "limit": 20,
    "remaining": 0,
    "retryAfterSeconds": 14
  },
  "timestamp": "2026-11-23T16:05:31.701234"
}
```

---

## 5. Trusted Proxy IP Extraction

To prevent spoofing via forged headers when behind Nginx or Cloudflare, `RateLimitFilter` checks headers in order of proxy trustworthiness:
1. `CF-Connecting-IP` (Cloudflare)
2. `X-Forwarded-For` (first non-internal IP)
3. `X-Real-IP`
4. Fallback: `request.getRemoteAddr()`
