package com.HeartFeel.web.model.vo;

import lombok.Data;

import java.io.Serializable;

/**
 * TTS synthesis audio payload.
 */
@Data
public class TtsSynthesizeVO implements Serializable {

    private String engine;

    private String mimeType;

    private String audioBase64;

    private String cacheKey;

    private static final long serialVersionUID = 1L;
}
