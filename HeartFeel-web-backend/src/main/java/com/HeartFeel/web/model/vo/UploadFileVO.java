package com.HeartFeel.web.model.vo;

import lombok.Data;

import java.io.Serializable;

/**
 * Uploaded file info.
 */
@Data
public class UploadFileVO implements Serializable {

    /**
     * COS object path saved in business tables.
     */
    private String filePath;

    /**
     * Public URL for frontend preview.
     */
    private String url;

    private static final long serialVersionUID = 1L;
}
