package com.HeartFeel.web.model.vo;

import com.HeartFeel.web.model.entity.QwertyDictionary;
import lombok.Data;
import org.springframework.beans.BeanUtils;

import java.io.Serializable;
import java.util.Date;

/**
 * Qwerty dictionary view object.
 */
@Data
public class QwertyDictionaryVO implements Serializable {

    private Long id;

    private String name;

    private String description;

    private String category;

    private String language;

    private String languageCategory;

    private Integer wordCount;

    private String visibility;

    private Integer status;

    private Long userId;

    private Date createTime;

    private Date updateTime;

    private UserVO user;

    private static final long serialVersionUID = 1L;

    public static QwertyDictionaryVO objToVo(QwertyDictionary dictionary) {
        if (dictionary == null) {
            return null;
        }
        QwertyDictionaryVO vo = new QwertyDictionaryVO();
        BeanUtils.copyProperties(dictionary, vo);
        return vo;
    }
}
