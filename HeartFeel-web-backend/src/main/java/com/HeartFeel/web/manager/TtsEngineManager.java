package com.HeartFeel.web.manager;

import cn.hutool.core.util.StrUtil;
import com.HeartFeel.web.common.ErrorCode;
import com.HeartFeel.web.config.QwertyTtsConfig;
import com.HeartFeel.web.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import javax.annotation.Resource;
import java.io.File;
import java.net.URI;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Starts and monitors embedded local TTS engine processes.
 */
@Component
@Slf4j
public class TtsEngineManager implements ApplicationRunner {

    public static final String ENGINE_PADDLE = "paddlespeech";

    public static final String ENGINE_VOICEVOX = "voicevox";

    @Resource
    private QwertyTtsConfig qwertyTtsConfig;

    private final Map<String, Process> processes = new ConcurrentHashMap<>();

    @Override
    public void run(ApplicationArguments args) {
        if (!qwertyTtsConfig.isEnabled() || !qwertyTtsConfig.isEmbedded() || !qwertyTtsConfig.isAutoStart()) {
            return;
        }
        tryStart(ENGINE_PADDLE);
        tryStart(ENGINE_VOICEVOX);
    }

    public void ensureReady(String engine) {
        if (!qwertyTtsConfig.isEnabled()) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "TTS is disabled");
        }
        if (isHealthy(engine)) {
            return;
        }
        if (qwertyTtsConfig.isEmbedded() && qwertyTtsConfig.isAutoStart()) {
            tryStart(engine);
        }
        if (!isHealthy(engine)) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "TTS engine is not ready: " + engine);
        }
    }

    public boolean isHealthy(String engine) {
        EngineRuntime runtime = getRuntime(engine);
        validateLoopbackBaseUrl(runtime.baseUrl);
        try {
            ResponseEntity<String> response = createRestTemplate()
                    .getForEntity(StrUtil.removeSuffix(runtime.baseUrl, "/") + runtime.healthPath, String.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            return false;
        }
    }

    public synchronized void tryStart(String engine) {
        EngineRuntime runtime = getRuntime(engine);
        validateLoopbackBaseUrl(runtime.baseUrl);
        if (isHealthy(engine)) {
            return;
        }
        Process oldProcess = processes.get(engine);
        if (oldProcess != null && oldProcess.isAlive()) {
            waitUntilHealthy(engine);
            return;
        }
        if (StrUtil.isBlank(runtime.command)) {
            log.warn("tts engine command is blank, engine = {}", engine);
            return;
        }
        try {
            File logDir = new File("logs");
            if (!logDir.exists() && !logDir.mkdirs()) {
                log.warn("tts log directory create failed, path = {}", logDir.getAbsolutePath());
            }
            ProcessBuilder processBuilder = new ProcessBuilder(buildShellCommand(runtime.command));
            processBuilder.redirectErrorStream(true);
            processBuilder.redirectOutput(ProcessBuilder.Redirect.appendTo(new File(logDir, "tts-" + engine + ".log")));
            Process process = processBuilder.start();
            processes.put(engine, process);
            waitUntilHealthy(engine);
        } catch (Exception e) {
            log.warn("tts engine start failed, engine = {}", engine, e);
        }
    }

    public void shutdownEngines() {
        for (Map.Entry<String, Process> entry : processes.entrySet()) {
            Process process = entry.getValue();
            if (process != null && process.isAlive()) {
                process.destroy();
                try {
                    Thread.sleep(500L);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                if (process.isAlive()) {
                    process.destroyForcibly();
                }
            }
        }
        processes.clear();
    }

    @javax.annotation.PreDestroy
    public void destroy() {
        shutdownEngines();
    }

    private void waitUntilHealthy(String engine) {
        long deadline = System.currentTimeMillis() + Math.max(1000, qwertyTtsConfig.getTimeoutMs());
        while (System.currentTimeMillis() < deadline) {
            if (isHealthy(engine)) {
                return;
            }
            try {
                Thread.sleep(300L);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return;
            }
        }
        log.warn("tts engine health check timed out, engine = {}", engine);
    }

    private EngineRuntime getRuntime(String engine) {
        if (ENGINE_VOICEVOX.equals(engine)) {
            return new EngineRuntime(qwertyTtsConfig.getVoicevox().getBaseUrl(),
                    qwertyTtsConfig.getVoicevox().getCommand(), "/version");
        }
        if (ENGINE_PADDLE.equals(engine)) {
            return new EngineRuntime(qwertyTtsConfig.getPaddle().getBaseUrl(),
                    qwertyTtsConfig.getPaddle().getCommand(), "/paddlespeech/tts/help");
        }
        throw new BusinessException(ErrorCode.PARAMS_ERROR, "unsupported TTS engine: " + engine);
    }

    private RestTemplate createRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Math.min(2000, qwertyTtsConfig.getTimeoutMs()));
        factory.setReadTimeout(Math.min(2000, qwertyTtsConfig.getTimeoutMs()));
        return new RestTemplate(factory);
    }

    private void validateLoopbackBaseUrl(String baseUrl) {
        try {
            URI uri = URI.create(baseUrl);
            String host = uri.getHost();
            boolean loopback = "127.0.0.1".equals(host) || "localhost".equalsIgnoreCase(host) || "::1".equals(host);
            if (!loopback) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "TTS engine baseUrl must use localhost");
            }
        } catch (IllegalArgumentException e) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "invalid TTS engine baseUrl", e);
        }
    }

    private String[] buildShellCommand(String command) {
        String os = System.getProperty("os.name", "").toLowerCase();
        if (os.contains("win")) {
            return new String[]{"cmd.exe", "/c", command};
        }
        return new String[]{"sh", "-c", command};
    }

    private static class EngineRuntime {

        private final String baseUrl;

        private final String command;

        private final String healthPath;

        private EngineRuntime(String baseUrl, String command, String healthPath) {
            this.baseUrl = baseUrl;
            this.command = command;
            this.healthPath = healthPath;
        }
    }
}
