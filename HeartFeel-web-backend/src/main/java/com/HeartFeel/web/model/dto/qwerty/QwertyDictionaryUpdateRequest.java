package com.HeartFeel.web.model.dto.qwerty;

import lombok.Data;

import java.io.Serializable;

/**
 * Qwerty dictionary metadata update request.
 */
@Data
public class QwertyDictionaryUpdateRequest implements Serializable {

    private Long id;

    private String name;

    private String description;

    private String category;

    private String language;

    private String languageCategory;

    private String visibility;

    private Integer status;

    private static final long serialVersionUID = 1L;
}
