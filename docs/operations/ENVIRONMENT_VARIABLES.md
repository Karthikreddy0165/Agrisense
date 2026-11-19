# Environment Variables & Configuration Reference — Agri

## 1. Root Configuration (`.env`)

Located at root: `/Users/karthikreddy/Desktop/Agri/.env`

```ini
# PostgreSQL Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=agriforecasting
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Spring Boot Backend
SERVER_PORT=8080
MODEL_SERVICE_URL=http://localhost:8000
SPRING_PROFILES_ACTIVE=dev

# Python Inference Service
PYTHON_HOST=0.0.0.0
PYTHON_PORT=8000
MODEL_PATH=/Users/karthikreddy/Desktop/Agri/model-service/model/price_lgbm_full_features.pkl

# Next.js Frontend
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
PORT=3000
```

---

## 2. Spring Boot Properties (`application.properties`)

Located at: `backend/src/main/resources/application.properties`

```properties
spring.application.name=agri-forecasting-backend
server.port=8080

# PostgreSQL DataSource
spring.datasource.url=jdbc:postgresql://${POSTGRES_HOST:localhost}:${POSTGRES_PORT:5432}/${POSTGRES_DB:agriforecasting}
spring.datasource.username=${POSTGRES_USER:postgres}
spring.datasource.password=${POSTGRES_PASSWORD:postgres}
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA / Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# Redis Configuration
spring.data.redis.host=${REDIS_HOST:localhost}
spring.data.redis.port=${REDIS_PORT:6379}
spring.data.redis.timeout=2000ms

# External Inference URL
model.service.url=${MODEL_SERVICE_URL:http://localhost:8000}
```
