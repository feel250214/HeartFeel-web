-- 创建库
create database if not exists my_db;

-- 切换库
use my_db;
-- 代码生成器表
create table if not exists daily
(
    id         bigint auto_increment comment 'id' primary key,
    name       varchar(128)                       null comment '名称',
    distPath   text                               null comment '日记路径',
    coverPath  varchar(512)                       null comment '封面图片路径',
    status     int      default 0                 not null comment '状态',
    userId     bigint                             not null comment '创建用户 id',
    createTime datetime default CURRENT_TIMESTAMP not null comment '创建时间',
    updateTime datetime default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP comment '更新时间',
    isDelete   tinyint  default 0                 not null comment '是否删除',
    index idx_userId (userId)
) comment '代码生成器' collate = utf8mb4_unicode_ci;

-- 模拟生成器数据
INSERT INTO my_db.daily (name, distPath, userId, status)
VALUES ('学习日记25-05-15', '/daily_dist/2050127591045984258/CbHVLcHn-啊沙发上.zip', 2050127591045984258, 0);
INSERT INTO my_db.daily (name, distPath, userId, status)
VALUES ('学习日记25-05-16', '/daily_dist/2050127591045984258/CbHVLcHn-啊沙发上.zip', 2050127591045984258, 0);
INSERT INTO my_db.daily (name, distPath, userId, status)
VALUES ('学习日记25-05-17', '/daily_dist/2050127591045984258/CbHVLcHn-啊沙发上.zip', 2050127591045984258, 0);
INSERT INTO my_db.daily (name, distPath, userId, status)
VALUES ('学习日记25-05-18', '/daily_dist/2050127591045984258/CbHVLcHn-啊沙发上.zip', 2050127591045984258, 0);
