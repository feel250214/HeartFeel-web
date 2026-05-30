package com.HeartFeel.web.model.dto.daily;

import com.HeartFeel.web.common.PageRequest;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serializable;
import java.util.List;

/**
 * 查询请求
 *
 * @author <a href="https://github.com/feel250214">感受是什麽</a>
 */
@EqualsAndHashCode(callSuper = true)
@Data
public class DailyQueryRequest extends PageRequest implements Serializable {

    /**
     * id
     */
    private Long id;

    /**
     * id
     */
    private Long notId;

    /**
     * 搜索词
     */
    private String searchText;

    /**
     * 创建用户 id
     */
    private Long userId;

    /**
     * 名称
     */
    private String name;

    /**
     * 日记路径
     */
    private String distPath;

    /**
     * Cover image COS path.
     */
    private String coverPath;

    /**
     * 状态
     */
    private Integer status;


    private static final long serialVersionUID = 1L;
}
