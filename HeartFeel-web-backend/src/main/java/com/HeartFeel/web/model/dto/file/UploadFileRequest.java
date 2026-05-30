package com.HeartFeel.web.model.dto.file;

import lombok.Data;

import java.io.Serializable;

/**
 * 文件上传请求
 *
 * @author <a href="https://github.com/feel250214">感受是什麽</a>
 */
@Data
public class UploadFileRequest implements Serializable {

    /**
     * 业务
     */
    private String biz;

    /**
     * Daily id. When biz is daily_cover, the uploaded path will be saved to this diary.
     */
    private Long dailyId;

    private static final long serialVersionUID = 1L;
}
