# Qwerty TTS Runtime

This directory is reserved for local offline TTS runtime files used by the backend-managed TTS process mode.

Expected layout:

```text
runtime/
  tts/
    paddlespeech/
      application.yaml
    voicevox/
      run.exe
```

Runtime binaries, model files, generated logs, and engine downloads are intentionally ignored by Git.

Default backend commands are configured in `src/main/resources/application.yml`:

```yaml
qwerty:
  tts:
    paddle:
      command: paddlespeech_server start --config_file runtime/tts/paddlespeech/application.yaml
    voicevox:
      command: runtime/tts/voicevox/run.exe --host 127.0.0.1 --port 50021
```

Keep both engines bound to `127.0.0.1` or `localhost`; the backend rejects non-loopback TTS engine URLs.
