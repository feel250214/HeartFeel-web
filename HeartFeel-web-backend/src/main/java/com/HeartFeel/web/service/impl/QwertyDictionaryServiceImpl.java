package com.HeartFeel.web.service.impl;

import cn.hutool.core.collection.CollUtil;
import com.HeartFeel.web.common.ErrorCode;
import com.HeartFeel.web.constant.CommonConstant;
import com.HeartFeel.web.exception.BusinessException;
import com.HeartFeel.web.exception.ThrowUtils;
import com.HeartFeel.web.mapper.QwertyDictionaryMapper;
import com.HeartFeel.web.model.dto.qwerty.QwertyDictionaryQueryRequest;
import com.HeartFeel.web.model.entity.QwertyDictionary;
import com.HeartFeel.web.model.entity.User;
import com.HeartFeel.web.model.vo.QwertyDictionaryVO;
import com.HeartFeel.web.service.QwertyDictionaryService;
import com.HeartFeel.web.service.UserService;
import com.HeartFeel.web.utils.SqlUtils;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.apache.commons.lang3.ObjectUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 单词服务实现
 *
 * @author <a href="https://github.com/feel250214">感受是什麽</a>
 */
@Service
public class QwertyDictionaryServiceImpl extends ServiceImpl<QwertyDictionaryMapper, QwertyDictionary>
        implements QwertyDictionaryService {

    @Resource
    private UserService userService;

    @Override
    public void validDictionary(QwertyDictionary dictionary, boolean add) {
        if (dictionary == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        String name = dictionary.getName();
        String category = dictionary.getCategory();
        String language = dictionary.getLanguage();
        String languageCategory = dictionary.getLanguageCategory();
        String filePath = dictionary.getFilePath();
        String visibility = normalizeVisibility(dictionary.getVisibility());
        dictionary.setVisibility(visibility);
        Integer wordCount = dictionary.getWordCount();

        if (add) {
            ThrowUtils.throwIf(StringUtils.isAnyBlank(name, category, language, languageCategory, filePath,
                    visibility), ErrorCode.PARAMS_ERROR);
            ThrowUtils.throwIf(wordCount == null || wordCount <= 0, ErrorCode.PARAMS_ERROR);
        }
        if (StringUtils.isNotBlank(name) && name.length() > 80) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "dictionary name is too long");
        }
        if (StringUtils.isNotBlank(category) && category.length() > 80) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "dictionary category is too long");
        }
        if (StringUtils.isNotBlank(language) && language.length() > 32) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "dictionary language is too long");
        }
        if (StringUtils.isNotBlank(languageCategory) && languageCategory.length() > 32) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "dictionary language category is too long");
        }
        if (StringUtils.isNotBlank(filePath) && filePath.length() > 512) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "dictionary file path is too long");
        }
        if (StringUtils.isNotBlank(visibility) && !VISIBILITY_PRIVATE.equals(visibility)
                && !VISIBILITY_PUBLIC.equals(visibility)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "dictionary visibility is invalid");
        }
    }

    @Override
    public QueryWrapper<QwertyDictionary> getQueryWrapper(QwertyDictionaryQueryRequest queryRequest) {
        QueryWrapper<QwertyDictionary> queryWrapper = new QueryWrapper<>();
        if (queryRequest == null) {
            return queryWrapper;
        }
        Long id = queryRequest.getId();
        Long notId = queryRequest.getNotId();
        String searchText = queryRequest.getSearchText();
        Long userId = queryRequest.getUserId();
        String name = queryRequest.getName();
        String category = queryRequest.getCategory();
        String language = queryRequest.getLanguage();
        String languageCategory = queryRequest.getLanguageCategory();
        String visibility = normalizeVisibility(queryRequest.getVisibility());
        Integer status = queryRequest.getStatus();
        String sortField = queryRequest.getSortField();
        String sortOrder = queryRequest.getSortOrder();

        if (StringUtils.isNotBlank(searchText)) {
            queryWrapper.and(qw -> qw.like("name", searchText).or().like("description", searchText)
                    .or().like("category", searchText));
        }
        queryWrapper.ne(ObjectUtils.isNotEmpty(notId), "id", notId);
        queryWrapper.eq(ObjectUtils.isNotEmpty(id), "id", id);
        queryWrapper.eq(ObjectUtils.isNotEmpty(userId), "userId", userId);
        queryWrapper.like(StringUtils.isNotBlank(name), "name", name);
        queryWrapper.eq(StringUtils.isNotBlank(category), "category", category);
        queryWrapper.eq(StringUtils.isNotBlank(language), "language", language);
        queryWrapper.eq(StringUtils.isNotBlank(languageCategory), "languageCategory", languageCategory);
        if (StringUtils.isNotBlank(visibility)) {
            if (VISIBILITY_PUBLIC.equals(visibility)) {
                queryWrapper.in("visibility", Arrays.asList(VISIBILITY_PUBLIC, VISIBILITY_PUBLIC_LEGACY,
                        VISIBILITY_PUBLIC_CN));
            } else if (VISIBILITY_PRIVATE.equals(visibility)) {
                queryWrapper.in("visibility", Arrays.asList(VISIBILITY_PRIVATE, VISIBILITY_PRIVATE_LEGACY));
            } else {
                queryWrapper.eq("visibility", visibility);
            }
        }
        queryWrapper.eq(ObjectUtils.isNotEmpty(status), "status", status);
        queryWrapper.orderBy(SqlUtils.validSortField(sortField), CommonConstant.SORT_ORDER_ASC.equals(sortOrder),
                sortField);
        return queryWrapper;
    }

    private String normalizeVisibility(String visibility) {
        if (StringUtils.isBlank(visibility)) {
            return visibility;
        }
        String trimmedVisibility = visibility.trim();
        if (VISIBILITY_PRIVATE_LEGACY.equals(trimmedVisibility)) {
            return VISIBILITY_PRIVATE;
        }
        if (VISIBILITY_PUBLIC_LEGACY.equals(trimmedVisibility) || VISIBILITY_PUBLIC_CN.equals(trimmedVisibility)) {
            return VISIBILITY_PUBLIC;
        }
        return trimmedVisibility;
    }

    @Override
    public Page<QwertyDictionaryVO> getDictionaryVOPage(Page<QwertyDictionary> dictionaryPage,
                                                        HttpServletRequest request) {
        List<QwertyDictionary> dictionaryList = dictionaryPage.getRecords();
        Page<QwertyDictionaryVO> voPage = new Page<>(dictionaryPage.getCurrent(), dictionaryPage.getSize(),
                dictionaryPage.getTotal());
        if (CollUtil.isEmpty(dictionaryList)) {
            return voPage;
        }
        Set<Long> userIdSet = dictionaryList.stream().map(QwertyDictionary::getUserId).collect(Collectors.toSet());
        Map<Long, List<User>> userIdUserListMap = userService.listByIds(userIdSet).stream()
                .collect(Collectors.groupingBy(User::getId));
        List<QwertyDictionaryVO> voList = dictionaryList.stream().map(dictionary -> {
            QwertyDictionaryVO vo = QwertyDictionaryVO.objToVo(dictionary);
            Long userId = dictionary.getUserId();
            User user = null;
            if (userIdUserListMap.containsKey(userId)) {
                user = userIdUserListMap.get(userId).get(0);
            }
            vo.setUser(userService.getUserVO(user));
            return vo;
        }).collect(Collectors.toList());
        voPage.setRecords(voList);
        return voPage;
    }

    @Override
    public QwertyDictionaryVO getDictionaryVO(QwertyDictionary dictionary, HttpServletRequest request) {
        QwertyDictionaryVO vo = QwertyDictionaryVO.objToVo(dictionary);
        if (vo == null) {
            return null;
        }
        User user = dictionary.getUserId() == null ? null : userService.getById(dictionary.getUserId());
        vo.setUser(userService.getUserVO(user));
        return vo;
    }
}
