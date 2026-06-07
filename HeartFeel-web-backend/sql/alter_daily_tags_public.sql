use generator;

set @daily_tags_exists = (
    select count(*)
    from information_schema.columns
    where table_schema = database()
      and table_name = 'daily'
      and column_name = 'tags'
);

set @daily_tags_sql = if(
    @daily_tags_exists = 0,
    'alter table daily add column tags varchar(1024) null comment ''tags JSON array'' after coverPath',
    'select ''tags already exists'' as message'
);

prepare daily_tags_stmt from @daily_tags_sql;
execute daily_tags_stmt;
deallocate prepare daily_tags_stmt;

set @daily_isPublic_exists = (
    select count(*)
    from information_schema.columns
    where table_schema = database()
      and table_name = 'daily'
      and column_name = 'isPublic'
);

set @daily_isPublic_sql = if(
    @daily_isPublic_exists = 0,
    'alter table daily add column isPublic tinyint default 0 not null comment ''whether public'' after tags',
    'select ''isPublic already exists'' as message'
);

prepare daily_isPublic_stmt from @daily_isPublic_sql;
execute daily_isPublic_stmt;
deallocate prepare daily_isPublic_stmt;
