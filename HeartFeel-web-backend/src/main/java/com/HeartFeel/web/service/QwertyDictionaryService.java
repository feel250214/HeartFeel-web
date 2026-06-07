package com.HeartFeel.web.service;

import com.HeartFeel.web.model.dto.qwerty.QwertyDictionaryQueryRequest;
import com.HeartFeel.web.model.entity.QwertyDictionary;
import com.HeartFeel.web.model.vo.QwertyDictionaryVO;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;

import javax.servlet.http.HttpServletRequest;

/**
 * 单词服务
 *
 * @author <a href="https://github.com/feel250214">感受是什麽</a>
 */
public interface QwertyDictionaryService extends IService<QwertyDictionary> {

    String VISIBILITY_PRIVATE = "private";

    String VISIBILITY_PUBLIC = "public";

    String VISIBILITY_PRIVATE_LEGACY = "私有";

    String VISIBILITY_PUBLIC_LEGACY = "公共";

    String VISIBILITY_PUBLIC_CN = "公开";

    void validDictionary(QwertyDictionary dictionary, boolean add);

    QueryWrapper<QwertyDictionary> getQueryWrapper(QwertyDictionaryQueryRequest queryRequest);

    Page<QwertyDictionaryVO> getDictionaryVOPage(Page<QwertyDictionary> dictionaryPage,
                                                 HttpServletRequest request);

    QwertyDictionaryVO getDictionaryVO(QwertyDictionary dictionary, HttpServletRequest request);
}
