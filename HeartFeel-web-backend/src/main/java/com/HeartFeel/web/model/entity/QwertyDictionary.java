package com.HeartFeel.web.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.util.Date;

/**
 * Qwerty trainer dictionary metadata.
 */
@TableName(value = "qwerty_dictionary")
@Data
public class QwertyDictionary {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String name;

    private String description;

    private String category;

    private String language;

    private String languageCategory;

    private Integer wordCount;

    private String filePath;

    private String visibility;

    private Integer status;

    private Long userId;

    private Date createTime;

    private Date updateTime;

    @TableLogic
    private Integer isDelete;
}
