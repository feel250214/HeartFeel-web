package com.HeartFeel.web.model.dto.qwerty;

import com.HeartFeel.web.common.PageRequest;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serializable;

/**
 * Qwerty dictionary query request.
 */
@EqualsAndHashCode(callSuper = true)
@Data
public class QwertyDictionaryQueryRequest extends PageRequest implements Serializable {

    private Long id;

    private Long notId;

    private String searchText;

    private Long userId;

    private String name;

    private String category;

    private String language;

    private String languageCategory;

    private String visibility;

    private Integer status;

    private static final long serialVersionUID = 1L;
}
