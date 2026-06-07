package com.HeartFeel.web.manager;

import cn.hutool.core.util.StrUtil;
import com.HeartFeel.web.common.ErrorCode;
import com.HeartFeel.web.config.QwertyTtsConfig;
import com.HeartFeel.web.exception.BusinessException;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import javax.annotation.Resource;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * HTTP client for VOICEVOX Engine.
 */
@Component
public class VoiceVoxClient {

    @Resource
    private QwertyTtsConfig qwertyTtsConfig;

    public String synthesize(String text, double rate) {
        QwertyTtsConfig.VoiceVoxConfig voiceVoxConfig = qwertyTtsConfig.getVoicevox();
        int speakerId = voiceVoxConfig.getSpeakerId();
        RestTemplate restTemplate = createRestTemplate();
        String audioQuery;
        try {
            String queryUrl = UriComponentsBuilder
                    .fromHttpUrl(buildUrl(voiceVoxConfig.getBaseUrl(), "/audio_query"))
                    .queryParam("text", text)
                    .queryParam("speaker", speakerId)
                    .build()
                    .encode(StandardCharsets.UTF_8)
                    .toUriString();
            ResponseEntity<String> queryResponse = restTemplate.postForEntity(queryUrl, HttpEntity.EMPTY,
                    String.class);
            audioQuery = queryResponse.getBody();
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "VOICEVOX audio query failed", e);
        }
        if (StrUtil.isBlank(audioQuery)) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "VOICEVOX audio query returned empty response");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> entity = new HttpEntity<>(applyRate(audioQuery, rate), headers);
        try {
            String synthesisUrl = UriComponentsBuilder
                    .fromHttpUrl(buildUrl(voiceVoxConfig.getBaseUrl(), "/synthesis"))
                    .queryParam("speaker", speakerId)
                    .build()
                    .encode(StandardCharsets.UTF_8)
                    .toUriString();
            ResponseEntity<byte[]> synthesisResponse = restTemplate.postForEntity(synthesisUrl, entity, byte[].class);
            byte[] audioBytes = synthesisResponse.getBody();
            if (!synthesisResponse.getStatusCode().is2xxSuccessful() || audioBytes == null || audioBytes.length == 0) {
                throw new BusinessException(ErrorCode.OPERATION_ERROR, "VOICEVOX synthesis returned empty audio");
            }
            return Base64.getEncoder().encodeToString(audioBytes);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "VOICEVOX synthesis request failed", e);
        }
    }

    private String applyRate(String audioQuery, double rate) {
        return audioQuery.replaceFirst("\"speedScale\"\\s*:\\s*[0-9.]+", "\"speedScale\":" + rate);
    }

    private RestTemplate createRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(qwertyTtsConfig.getTimeoutMs());
        factory.setReadTimeout(qwertyTtsConfig.getTimeoutMs());
        return new RestTemplate(factory);
    }

    private String buildUrl(String baseUrl, String path) {
        return StrUtil.removeSuffix(baseUrl, "/") + path;
    }
}
