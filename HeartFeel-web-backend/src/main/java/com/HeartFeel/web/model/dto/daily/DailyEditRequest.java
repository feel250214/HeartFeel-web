package com.HeartFeel.web.model.dto.daily;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.Data;

import java.io.Serializable;

/**
 * 编辑请求
 *
 * @author <a href="https://github.com/feel250214">感受是什麽</a>
 */
@Data
public class DailyEditRequest implements Serializable {

    /**
     * id
     */
    private Long id;

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
     * Markdown content from ByteMD. Null means do not update content.
     */
    private String content;


    private static final long serialVersionUID = 1L;
}
