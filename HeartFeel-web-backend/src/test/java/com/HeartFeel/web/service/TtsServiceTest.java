package com.HeartFeel.web.service;

import com.HeartFeel.web.config.QwertyTtsConfig;
import com.HeartFeel.web.exception.BusinessException;
import com.HeartFeel.web.manager.PaddleSpeechClient;
import com.HeartFeel.web.manager.TtsEngineManager;
import com.HeartFeel.web.manager.VoiceVoxClient;
import com.HeartFeel.web.model.dto.qwerty.TtsSynthesizeRequest;
import com.HeartFeel.web.model.vo.TtsSynthesizeVO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TtsServiceTest {

    @Mock
    private TtsEngineManager ttsEngineManager;

    @Mock
    private PaddleSpeechClient paddleSpeechClient;

    @Mock
    private VoiceVoxClient voiceVoxClient;

    private TtsService ttsService;

    @BeforeEach
    void setUp() {
        QwertyTtsConfig config = new QwertyTtsConfig();
        config.setEnabled(true);
        config.setMaxTextLength(10);
        ttsService = new TtsService();
        ReflectionTestUtils.setField(ttsService, "qwertyTtsConfig", config);
        ReflectionTestUtils.setField(ttsService, "ttsEngineManager", ttsEngineManager);
        ReflectionTestUtils.setField(ttsService, "paddleSpeechClient", paddleSpeechClient);
        ReflectionTestUtils.setField(ttsService, "voiceVoxClient", voiceVoxClient);
    }

    @Test
    void synthesizeEnglishWithPaddleSpeech() {
        TtsSynthesizeRequest request = new TtsSynthesizeRequest();
        request.setText("example");
        request.setLanguage("en");
        request.setRate(0.95);
        when(paddleSpeechClient.synthesize("example", 0.95)).thenReturn("audio");

        TtsSynthesizeVO response = ttsService.synthesize(request);

        assertEquals(TtsEngineManager.ENGINE_PADDLE, response.getEngine());
        assertEquals("audio/wav", response.getMimeType());
        assertEquals("audio", response.getAudioBase64());
        verify(ttsEngineManager).ensureReady(TtsEngineManager.ENGINE_PADDLE);
        verify(voiceVoxClient, never()).synthesize("example", 0.95);
    }

    @Test
    void synthesizeJapaneseWithVoiceVox() {
        TtsSynthesizeRequest request = new TtsSynthesizeRequest();
        request.setText("kana");
        request.setLanguage("ja-JP");
        request.setRate(1.1);
        when(voiceVoxClient.synthesize("kana", 1.1)).thenReturn("audio");

        TtsSynthesizeVO response = ttsService.synthesize(request);

        assertEquals(TtsEngineManager.ENGINE_VOICEVOX, response.getEngine());
        assertEquals("audio", response.getAudioBase64());
        verify(ttsEngineManager).ensureReady(TtsEngineManager.ENGINE_VOICEVOX);
        verify(paddleSpeechClient, never()).synthesize("kana", 1.1);
    }

    @Test
    void rejectTooLongText() {
        TtsSynthesizeRequest request = new TtsSynthesizeRequest();
        request.setText("this text is too long");

        assertThrows(BusinessException.class, () -> ttsService.synthesize(request));
    }
}
