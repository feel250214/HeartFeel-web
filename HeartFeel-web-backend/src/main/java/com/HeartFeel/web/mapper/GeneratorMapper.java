package com.HeartFeel.web.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.HeartFeel.web.model.entity.Generator;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * @author Feeling
 * @description 针对表【generator(代码生成器)】的数据库操作Mapper
 * @createDate 2025-07-12 20:37:00
 * @Entity com.HeartFeel.web.model.entity.Generator
 */
public interface GeneratorMapper extends BaseMapper<Generator> {

    @Select("SELECT id, distPath FROM generator WHERE isDelete = 1")
    List<Generator> listDeletedGenerator();
}





