import { listMyDailyVoByPageUsingPost } from '@/services/backend/dailyController';
import { getDailyCoverUrl } from '@/utils/cos';
import { PictureOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Avatar, Button, Card, Flex, Input, List, message, Space, Tag, Typography } from 'antd';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { Link } from 'umi';

const DEFAULT_PAGE_PARAMS: PageRequest = {
  current: 1,
  pageSize: 12,
  sortField: 'createTime',
  sortOrder: 'descend',
};

const getStatusTag = (status?: number) => {
  if (status === 0 || status === undefined) {
    return <Tag color="success">正常</Tag>;
  }
  return <Tag>已停用</Tag>;
};

const coverView = (data: API.DailyVO) => {
  const coverUrl = getDailyCoverUrl(data);
  if (coverUrl) {
    return (
      <img
        alt={data.name}
        src={coverUrl}
        style={{
          aspectRatio: '4 / 3',
          objectFit: 'cover',
          width: '100%',
        }}
      />
    );
  }

  return (
    <Flex
      align="center"
      justify="center"
      style={{
        aspectRatio: '4 / 3',
        background: '#f5f5f5',
        color: '#8c8c8c',
        width: '100%',
      }}
    >
      <PictureOutlined style={{ fontSize: 28 }} />
    </Flex>
  );
};

const DailyHomePage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [dataList, setDataList] = useState<API.DailyVO[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [keyword, setKeyword] = useState<string>('');
  const [searchParams, setSearchParams] = useState<API.DailyQueryRequest>({
    ...DEFAULT_PAGE_PARAMS,
  });

  const doSearch = async () => {
    setLoading(true);
    try {
      const res = await listMyDailyVoByPageUsingPost(searchParams);
      setDataList(res.data?.records ?? []);
      setTotal(Number(res.data?.total) || 0);
    } catch (error: any) {
      message.error('获取日记失败，' + error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    doSearch();
  }, [searchParams]);

  return (
    <PageContainer
      title="我的日记"
      extra={
        <Link to="/daily/edit">
          <Button type="primary" icon={<PlusOutlined />}>
            写日记
          </Button>
        </Link>
      }
    >
      <Flex justify="center">
        <Input.Search
          style={{
            width: '40vw',
            minWidth: 320,
          }}
          placeholder="搜索日记标题"
          allowClear
          enterButton="搜索"
          size="large"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onSearch={(value: string) => {
            setSearchParams({
              ...DEFAULT_PAGE_PARAMS,
              searchText: value,
              name: value,
            });
          }}
        />
      </Flex>

      <div style={{ marginBottom: 24 }} />

      <List<API.DailyVO>
        rowKey="id"
        loading={loading}
        grid={{
          gutter: 16,
          xs: 1,
          sm: 2,
          md: 3,
          lg: 3,
          xl: 4,
          xxl: 4,
        }}
        dataSource={dataList}
        pagination={{
          current: searchParams.current,
          pageSize: searchParams.pageSize,
          total,
          showSizeChanger: false,
          onChange(current: number) {
            setSearchParams({
              ...searchParams,
              current,
            });
          },
        }}
        renderItem={(data) => (
          <List.Item>
            <Card
              hoverable
              cover={coverView(data)}
              title={
                <Link to={`/daily/detail/${data.id}`}>
                  <Typography.Text ellipsis>{data.name}</Typography.Text>
                </Link>
              }
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Flex justify="space-between" align="center">
                  {getStatusTag(data.status)}
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {moment(data.createTime).fromNow()}
                  </Typography.Text>
                </Flex>
                <Flex justify="space-between" align="center">
                  <Typography.Text type="secondary" ellipsis style={{ maxWidth: '70%' }}>
                    {data.distPath || 'Markdown 日记'}
                  </Typography.Text>
                  <Avatar src={data.user?.userAvatar} icon={<UserOutlined />} />
                </Flex>
              </Space>
            </Card>
          </List.Item>
        )}
      />
    </PageContainer>
  );
};

export default DailyHomePage;
