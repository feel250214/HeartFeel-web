package com.HeartFeel.web.model.vo;

import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONUtil;
import com.HeartFeel.web.model.entity.Daily;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import lombok.Data;
import org.springframework.beans.BeanUtils;

import java.io.Serializable;
import java.util.Date;
import java.util.List;

/**
 * 帖子视图
 *
 * @author <a href="https://github.com/feel250214">感受是什麽</a>
 */
@Data
public class DailyVO implements Serializable {

    /**
     * id
     */
    @TableId(type = IdType.AUTO)
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
    private String coverPath;

    /**
     * Cover image public URL for frontend display.
     */
    private String coverUrl;

    /**
     * Backward-compatible alias for older frontend code.
     */
    private String cover;

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

    /**
     * 创建时间
     */
    private Date createTime;

    /**
     * 更新时间
     */
    private Date updateTime;

    /**
     * 创建人信息
     */
    private UserVO user;

    private static final long serialVersionUID = 1L;


    /**
     * 包装类转对象
     *
     * @param dailyVO
     * @return
     */
    public static Daily voToObj(DailyVO dailyVO) {
        if (dailyVO == null) {
            return null;
        }
        Daily daily = new Daily();
        BeanUtils.copyProperties(dailyVO, daily);
        daily.setTags(JSONUtil.toJsonStr(dailyVO.getTags()));

        return daily;
    }

    /**
     * 对象转包装类
     *
     * @param daily
     * @return
     */
    public static DailyVO objToVo(Daily daily) {
        if (daily == null) {
            return null;
        }
        DailyVO dailyVO = new DailyVO();
        BeanUtils.copyProperties(daily, dailyVO);
        if (StrUtil.isNotBlank(daily.getTags())) {
            dailyVO.setTags(JSONUtil.toList(daily.getTags(), String.class));
        }

        return dailyVO;
    }
}
