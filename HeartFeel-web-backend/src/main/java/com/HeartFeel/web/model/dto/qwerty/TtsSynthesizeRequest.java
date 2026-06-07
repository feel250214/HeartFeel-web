package com.HeartFeel.web.model.dto.qwerty;

import lombok.Data;

import java.io.Serializable;

/**
 * TTS synthesis request for Qwerty trainer pronunciation.
 */
@Data
public class TtsSynthesizeRequest implements Serializable {

    private String text;

    private String language;

    private Double rate;

    private static final long serialVersionUID = 1L;
}
