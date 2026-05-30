package com.HeartFeel.web.model.dto.daily;

import lombok.Data;

import java.io.Serializable;
import java.util.Map;

/**
 * 查看请求
 *
 * @author <a href="https://github.com/feel250214">感受是什麽</a>
 */
@Data
public class DailyUseRequest implements Serializable {

    /**
     * 日记的 id
     */
    private Long id;

    /**
     * 数据模型
     */
    private Map<String, Object> dataModel;
    private static final long serialVersionUID = 1L;
}