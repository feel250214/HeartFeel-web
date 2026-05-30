package com.HeartFeel.web.model.dto.generator;

import com.HeartFeel.maker.meta.Meta;
import lombok.Data;

import java.io.Serializable;
import java.util.Map;

/**
 * 制作代码生成器请求
 *
 * @author <a href="https://github.com/feel250214">感受是什麽</a>
 */
@Data
public class GeneratorMakeRequest implements Serializable {

    /**
     * 元信息
     */
    private Meta meta;

    /**
     * 模板文件压缩包路径
     */
    private String zipFilePath;


    private static final long serialVersionUID = 1L;
}