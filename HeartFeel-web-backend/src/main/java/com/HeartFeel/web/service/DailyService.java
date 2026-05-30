package com.HeartFeel.web.service;

import com.HeartFeel.web.model.dto.daily.DailyQueryRequest;
import com.HeartFeel.web.model.dto.generator.GeneratorQueryRequest;
import com.HeartFeel.web.model.entity.Daily;
import com.HeartFeel.web.model.entity.Generator;
import com.HeartFeel.web.model.vo.DailyVO;
import com.HeartFeel.web.model.vo.GeneratorVO;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;

import javax.servlet.http.HttpServletRequest;

/**
* @author Feeling
* @description 针对表【daily(代码生成器)】的数据库操作Service
* @createDate 2026-05-24 16:33:31
*/
public interface DailyService extends IService<Daily> {
    /**
     * 校验
     *
     * @param daily
     * @param add
     */
    void validDaily(Daily daily, boolean add);

    /**
     * 获取帖子封装
     *
     * @param daily
     * @param request
     * @return
     */
    DailyVO getDailyVO(Daily daily, HttpServletRequest request);

    /**
     * 获取查询条件
     *
     * @param dailyQueryRequest
     * @return
     */
    QueryWrapper<Daily> getQueryWrapper(DailyQueryRequest dailyQueryRequest);


    /**
     * 分页获取帖子封装
     *
     * @param dailyPage
     * @param request
     * @return
     */
    Page<DailyVO> getDailyVOPage(Page<Daily> dailyPage, HttpServletRequest request);

}
