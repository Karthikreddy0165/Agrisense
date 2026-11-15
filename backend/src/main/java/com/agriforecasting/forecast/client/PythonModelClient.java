package com.agriforecasting.forecast.client;

import com.agriforecasting.forecast.dto.ForecastRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.Map;

@Component
public class PythonModelClient implements ModelClient {

    private static final Logger log = LoggerFactory.getLogger(PythonModelClient.class);

    private final RestTemplate restTemplate;
    private final String modelServiceUrl;

    public PythonModelClient(
            RestTemplateBuilder restTemplateBuilder,
            @Value("${agri.model-service.url:http://localhost:8000}") String modelServiceUrl,
            @Value("${agri.model-service.timeout-ms:5000}") int timeoutMs) {
        this.modelServiceUrl = modelServiceUrl;
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofMillis(timeoutMs))
                .setReadTimeout(Duration.ofMillis(timeoutMs))
                .build();
    }

    @Override
    @SuppressWarnings("unchecked")
    public Map<String, Object> predict(ForecastRequest request) {
        String endpoint = modelServiceUrl + "/internal/predict";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<ForecastRequest> entity = new HttpEntity<>(request, headers);

        try {
            log.info("Calling Python inference service at {} for mandi={}, commodity={}",
                    endpoint, request.mandiId(), request.commodityId());
            ResponseEntity<Map> response = restTemplate.postForEntity(endpoint, entity, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return (Map<String, Object>) response.getBody();
            }
        } catch (Exception ex) {
            log.warn("Failed to get prediction from Python service: {}. Falling back to deterministic estimation.", ex.getMessage());
        }
        return null;
    }
}
