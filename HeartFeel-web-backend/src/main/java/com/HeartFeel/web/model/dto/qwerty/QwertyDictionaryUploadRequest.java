package com.HeartFeel.web.model.dto.qwerty;

import lombok.Data;

import java.io.Serializable;

/**
 * Qwerty dictionary upload form fields.
 */
@Data
public class QwertyDictionaryUploadRequest implements Serializable {

    private String name;

    private String description;

    private String category;

    private String language;

    private String languageCategory;

    private String visibility;

    private static final long serialVersionUID = 1L;
}
