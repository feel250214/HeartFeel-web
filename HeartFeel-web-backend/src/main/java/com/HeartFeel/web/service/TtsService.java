package com.HeartFeel.web.service;

import cn.hutool.core.util.StrUtil;
import com.HeartFeel.web.common.ErrorCode;
import com.HeartFeel.web.config.QwertyTtsConfig;
import com.HeartFeel.web.exception.BusinessException;
import com.HeartFeel.web.manager.PaddleSpeechClient;
import com.HeartFeel.web.manager.TtsEngineManager;
import com.HeartFeel.web.manager.VoiceVoxClient;
import com.HeartFeel.web.model.dto.qwerty.TtsSynthesizeRequest;
import com.HeartFeel.web.model.vo.TtsSynthesizeVO;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.Locale;

/**
 * Unified Qwerty trainer TTS service.
 */
@Service
public class TtsService {

    private static final String MIME_WAV = "audio/wav";

    @Resource
    private QwertyTtsConfig qwertyTtsConfig;

    @Resource
    private TtsEngineManager ttsEngineManager;

    @Resource
    private PaddleSpeechClient paddleSpeechClient;

    @Resource
    private VoiceVoxClient voiceVoxClient;

    public TtsSynthesizeVO synthesize(TtsSynthesizeRequest request) {
        if (!qwertyTtsConfig.isEnabled()) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "TTS is disabled");
        }
        if (request == null || StrUtil.isBlank(request.getText())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "text is required");
        }
        String text = request.getText().trim();
        if (text.length() > qwertyTtsConfig.getMaxTextLength()) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "text is too long");
        }
        String language = normalizeLanguage(request.getLanguage());
        double rate = normalizeRate(request.getRate());
        String engine = selectEngine(language);
        ttsEngineManager.ensureReady(engine);

        String audioBase64 = TtsEngineManager.ENGINE_VOICEVOX.equals(engine)
                ? voiceVoxClient.synthesize(text, rate)
                : paddleSpeechClient.synthesize(text, rate);
        TtsSynthesizeVO vo = new TtsSynthesizeVO();
        vo.setEngine(engine);
        vo.setMimeType(MIME_WAV);
        vo.setAudioBase64(audioBase64);
        vo.setCacheKey(engine + ":" + language + ":" + rate + ":" + text);
        return vo;
    }

    private String selectEngine(String language) {
        if ("ja".equals(language) || "ja-jp".equals(language)) {
            return TtsEngineManager.ENGINE_VOICEVOX;
        }
        return TtsEngineManager.ENGINE_PADDLE;
    }

    private String normalizeLanguage(String language) {
        return StrUtil.blankToDefault(language, "en").trim().toLowerCase(Locale.ROOT);
    }

    private double normalizeRate(Double rate) {
        double value = rate == null ? 1.0 : rate;
        if (value <= 0) {
            return 1.0;
        }
        return Math.min(3.0, Math.max(0.25, value));
    }
}
