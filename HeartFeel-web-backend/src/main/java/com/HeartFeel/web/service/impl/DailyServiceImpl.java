package com.HeartFeel.web.service.impl;

import cn.hutool.core.collection.CollUtil;
import com.HeartFeel.web.common.ErrorCode;
import com.HeartFeel.web.constant.CommonConstant;
import com.HeartFeel.web.exception.BusinessException;
import com.HeartFeel.web.exception.ThrowUtils;
import com.HeartFeel.web.manager.CosManager;
import com.HeartFeel.web.model.dto.daily.DailyQueryRequest;
import com.HeartFeel.web.model.entity.User;
import com.HeartFeel.web.model.vo.DailyVO;
import com.HeartFeel.web.model.vo.UserVO;
import com.HeartFeel.web.service.UserService;
import com.HeartFeel.web.utils.SqlUtils;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.HeartFeel.web.model.entity.Daily;
import com.HeartFeel.web.service.DailyService;
import com.HeartFeel.web.mapper.DailyMapper;
import org.apache.commons.lang3.ObjectUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
* @author Feeling
* @description 针对表【daily(日记)】的数据库操作Service实现
* @createDate 2026-05-24 16:33:31
*/
@Service
public class DailyServiceImpl extends ServiceImpl<DailyMapper, Daily>
    implements DailyService{

    @Resource
    private UserService userService;

    @Resource
    private CosManager cosManager;

    @Override
    public void validDaily(Daily daily, boolean add) {
        if (daily == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        String name = daily.getName();
        String coverPath = daily.getCoverPath();

        // 创建时，参数不能为空
        if (add) {
            ThrowUtils.throwIf(StringUtils.isAnyBlank(name), ErrorCode.PARAMS_ERROR);
        }
        // 有参数则校验
        if (StringUtils.isNotBlank(name) && name.length() > 80) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "名称过长");
        }
        if (StringUtils.isNotBlank(coverPath) && coverPath.length() > 512) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "cover path is too long");
        }
    }

    @Override
    public DailyVO getDailyVO(Daily daily, HttpServletRequest request) {
        DailyVO dailyVO = DailyVO.objToVo(daily);
        String coverUrl = buildFileViewUrl(dailyVO.getCoverPath(), request);
        dailyVO.setCoverUrl(coverUrl);
        dailyVO.setCover(coverUrl);
        long dailyId = daily.getId();
        // 1. 关联查询用户信息
        Long userId = daily.getUserId();
        User user = null;
        if (userId != null && userId > 0) {
            user = userService.getById(userId);
        }
        UserVO userVO = userService.getUserVO(user);
        dailyVO.setUser(userVO);
        return dailyVO;
    }

    /**
     * 获取查询包装类
     *
     * @param dailyQueryRequest
     * @return
     */
    @Override
    public QueryWrapper<Daily> getQueryWrapper(DailyQueryRequest dailyQueryRequest) {
        QueryWrapper<Daily> queryWrapper = new QueryWrapper<>();
        if (dailyQueryRequest == null) {
            return queryWrapper;
        }
        Long id = dailyQueryRequest.getId();
        Long notId = dailyQueryRequest.getNotId();
        String searchText = dailyQueryRequest.getSearchText();
        List<String> tags = dailyQueryRequest.getTags();
        Long userId = dailyQueryRequest.getUserId();
        String name = dailyQueryRequest.getName();
        String distPath = dailyQueryRequest.getDistPath();
        String coverPath = dailyQueryRequest.getCoverPath();
        Integer isPublic = dailyQueryRequest.getIsPublic();
        Integer status = dailyQueryRequest.getStatus();
        String sortField = dailyQueryRequest.getSortField();
        String sortOrder = dailyQueryRequest.getSortOrder();

        // 拼接查询条件
        if (StringUtils.isNotBlank(searchText)) {
            queryWrapper.and(qw -> qw.like("name", searchText).or().like("distPath", searchText)
                    .or().like("coverPath", searchText));
        }
        queryWrapper.like(StringUtils.isNotBlank(name), "name", name);
        if (CollUtil.isNotEmpty(tags)) {
            for (String tag : tags) {
                queryWrapper.like("tags", "\"" + tag + "\"");
            }
        }

        queryWrapper.ne(ObjectUtils.isNotEmpty(notId), "id", notId);
        queryWrapper.eq(ObjectUtils.isNotEmpty(id), "id", id);
        queryWrapper.eq(ObjectUtils.isNotEmpty(userId), "userId", userId);
        queryWrapper.eq(StringUtils.isNotBlank(distPath), "distPath", distPath);
        queryWrapper.eq(StringUtils.isNotBlank(coverPath), "coverPath", coverPath);
        queryWrapper.eq(ObjectUtils.isNotEmpty(isPublic), "isPublic", isPublic);
        queryWrapper.eq(ObjectUtils.isNotEmpty(status), "status", status);
        queryWrapper.orderBy(SqlUtils.validSortField(sortField), CommonConstant.SORT_ORDER_ASC.equals(sortOrder),
                sortField);
        return queryWrapper;
    }

    @Override
    public Page<DailyVO> getDailyVOPage(Page<Daily> dailyPage, HttpServletRequest request) {
        List<Daily> dailyList = dailyPage.getRecords();
        Page<DailyVO> dailyVOPage = new Page<>(dailyPage.getCurrent(), dailyPage.getSize(), dailyPage.getTotal());
        if (CollUtil.isEmpty(dailyList)) {
            return dailyVOPage;
        }
        // 1. 关联查询用户信息
        Set<Long> userIdSet = dailyList.stream().map(Daily::getUserId).collect(Collectors.toSet());
        Map<Long, List<User>> userIdUserListMap = userService.listByIds(userIdSet).stream()
                .collect(Collectors.groupingBy(User::getId));
        // 填充信息
        List<DailyVO> dailyVOList = dailyList.stream().map(daily -> {
            DailyVO dailyVO = DailyVO.objToVo(daily);
            String coverUrl = buildFileViewUrl(dailyVO.getCoverPath(), request);
            dailyVO.setCoverUrl(coverUrl);
            dailyVO.setCover(coverUrl);
            Long userId = daily.getUserId();
            User user = null;
            if (userIdUserListMap.containsKey(userId)) {
                user = userIdUserListMap.get(userId).get(0);
            }
            dailyVO.setUser(userService.getUserVO(user));
            return dailyVO;
        }).collect(Collectors.toList());
        dailyVOPage.setRecords(dailyVOList);
        return dailyVOPage;
    }

    private String buildFileViewUrl(String filepath, HttpServletRequest request) {
        if (StringUtils.isBlank(filepath)) {
            return null;
        }
        String scheme = request.getScheme();
        int port = request.getServerPort();
        String baseUrl = scheme + "://" + request.getServerName();
        if (!(("http".equals(scheme) && port == 80) || ("https".equals(scheme) && port == 443))) {
            baseUrl += ":" + port;
        }
        try {
            String encodedPath = URLEncoder.encode(filepath, StandardCharsets.UTF_8.name());
            return baseUrl + request.getContextPath() + "/file/view?filepath=" + encodedPath;
        } catch (UnsupportedEncodingException e) {
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "file path encode failed", e);
        }
    }

}




