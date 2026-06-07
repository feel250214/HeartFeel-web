package com.HeartFeel.web.manager;

import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
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

import javax.annotation.Resource;
import java.util.HashMap;
import java.util.Map;

/**
 * HTTP client for PaddleSpeech TTS server.
 */
@Component
public class PaddleSpeechClient {

    @Resource
    private QwertyTtsConfig qwertyTtsConfig;

    public String synthesize(String text, double rate) {
        QwertyTtsConfig.PaddleConfig paddleConfig = qwertyTtsConfig.getPaddle();
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("text", text);
        requestBody.put("spk_id", paddleConfig.getSpkId());
        requestBody.put("speed", rate);
        requestBody.put("volume", paddleConfig.getVolume());
        requestBody.put("sample_rate", paddleConfig.getSampleRate());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        ResponseEntity<String> response;
        try {
            response = createRestTemplate().postForEntity(buildUrl(paddleConfig.getBaseUrl(), "/paddlespeech/tts"),
                    entity, String.class);
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "PaddleSpeech synthesis request failed", e);
        }
        if (!response.getStatusCode().is2xxSuccessful() || StrUtil.isBlank(response.getBody())) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "PaddleSpeech synthesis returned empty audio");
        }
        JSONObject root = JSONUtil.parseObj(response.getBody());
        Boolean success = root.getBool("success");
        if (Boolean.FALSE.equals(success)) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "PaddleSpeech synthesis failed");
        }
        JSONObject result = root.getJSONObject("result");
        if (result == null || StrUtil.isBlank(result.getStr("audio"))) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "PaddleSpeech response missing audio");
        }
        return result.getStr("audio");
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
