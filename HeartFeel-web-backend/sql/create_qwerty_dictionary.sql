-- Qwerty trainer dictionary metadata.
-- 切换库
create database if not exists my_db;

use my_db;
create table if not exists qwerty_dictionary
(
    id               bigint auto_increment comment 'id' primary key,
    name             varchar(80)                        not null comment '单词本名称',
    description      text                               null comment '单词本描述',
    category         varchar(80)                        not null comment '单词本类别',
    language         varchar(32)                        not null comment '语言',
    languageCategory varchar(32)                        not null comment '语言类别',
    wordCount        int      default 0                 not null comment '单词数',
    filePath         varchar(512)                       not null comment 'json文件路径',
    visibility       varchar(16) default 'private'      not null comment '私有或公有',
    status           int      default 0                 not null comment '状态',
    userId           bigint                             not null comment '用户ID',
    createTime       datetime default CURRENT_TIMESTAMP not null comment '创建时间',
    updateTime       datetime default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP comment '更新时间',
    isDelete         tinyint  default 0                 not null comment '是否删除',
    index idx_userId (userId)
) comment '单词本' collate = utf8mb4_unicode_ci;
