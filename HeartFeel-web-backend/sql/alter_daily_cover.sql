use my_db;

set @daily_coverPath_exists = (
    select count(*)
    from information_schema.columns
    where table_schema = database()
      and table_name = 'daily'
      and column_name = 'coverPath'
);

set @daily_coverPath_sql = if(
    @daily_coverPath_exists = 0,
    'alter table daily add column coverPath text null comment ''cover image path'' after distPath',
    'select ''coverPath already exists'' as message'
);

prepare daily_coverPath_stmt from @daily_coverPath_sql;
execute daily_coverPath_stmt;
deallocate prepare daily_coverPath_stmt;
