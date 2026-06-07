package com.HeartFeel.web.model.dto.daily;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.Data;

import java.io.Serializable;
import java.util.List;

/**
 * 创建请求
 *
 * @author <a href="https://github.com/feel250214">感受是什麽</a>
 */
@Data
public class DailyAddRequest implements Serializable {

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
    @JsonAlias({"cover", "coverUrl"})
    private String coverPath;

    /**
     * Markdown content from ByteMD.
     */
    private String content;

    /**
     * Tags.
     */
    private List<String> tags;

    /**
     * Whether this diary is visible to all logged-in users.
     */
    private Integer isPublic;

    /**
     * 状态
     */
    private Integer status;

    /**
     * 创建用户 id
     */
    private Long userId;


    private static final long serialVersionUID = 1L;
}
