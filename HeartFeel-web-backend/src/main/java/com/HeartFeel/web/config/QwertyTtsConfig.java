package com.HeartFeel.web.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Qwerty trainer TTS engine configuration.
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "qwerty.tts")
public class QwertyTtsConfig {

    private boolean enabled = true;

    private boolean embedded = true;

    private boolean autoStart = true;

    private int timeoutMs = 8000;

    private int maxTextLength = 120;

    private PaddleConfig paddle = new PaddleConfig();

    private VoiceVoxConfig voicevox = new VoiceVoxConfig();

    @Data
    public static class PaddleConfig {

        private String baseUrl = "http://127.0.0.1:8090";

        private String command = "paddlespeech_server start --config_file runtime/tts/paddlespeech/application.yaml";

        private int spkId = 0;

        private double volume = 1.0;

        private int sampleRate = 0;
    }

    @Data
    public static class VoiceVoxConfig {

        private String baseUrl = "http://127.0.0.1:50021";

        private String command = "runtime/tts/voicevox/run.exe --host 127.0.0.1 --port 50021";

        private int speakerId = 1;
    }
}
