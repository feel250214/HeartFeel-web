package com.HeartFeel.web.model.dto.daily;

import lombok.Data;

import java.io.Serializable;

/**
 * 缓存代码生成器请求
 *
 * @author <a href="https://github.com/feel250214">感受是什麽</a>
 */
@Data
public class DailyCacheRequest implements Serializable {

    /**
     * 日记的 id
     */
    private Long id;

    private static final long serialVersionUID = 1L;
}