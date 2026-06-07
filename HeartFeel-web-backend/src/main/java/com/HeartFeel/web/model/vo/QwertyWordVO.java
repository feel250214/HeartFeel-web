package com.HeartFeel.web.model.vo;

import lombok.Data;

import java.io.Serializable;
import java.util.List;

/**
 * Qwerty trainer word entry.
 */
@Data
public class QwertyWordVO implements Serializable {

    private String name;

    private List<String> trans;

    private String usphone;

    private String ukphone;

    private List<String> tags;

    private List<String> examples;

    private static final long serialVersionUID = 1L;
}
