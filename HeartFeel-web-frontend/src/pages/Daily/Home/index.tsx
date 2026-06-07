import {
  listDailyVoByPageUsingPost,
  listMyDailyVoByPageUsingPost,
} from '@/services/backend/dailyController';
import { getDailyCoverUrl } from '@/utils/cos';
import { PictureOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons';
import {
  PageContainer,
  ProFormSelect,
  ProFormText,
  QueryFilter,
} from '@ant-design/pro-components';
import { Avatar, Button, Card, Flex, List, message, Space, Tabs, Tag, Typography } from 'antd';
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

const getVisibilityTag = (isPublic?: number) => {
  if (isPublic === 1) {
    return <Tag color="blue">公开</Tag>;
  }
  return <Tag>私有</Tag>;
};

const tagListView = (tags?: string[]) => {
  if (!tags?.length) {
    return null;
  }
  return (
    <Space size={[0, 4]} wrap>
      {tags.map((tag) => (
        <Tag key={tag}>{tag}</Tag>
      ))}
    </Space>
  );
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
  const [activeTab, setActiveTab] = useState<'my' | 'public'>('my');
  const [loading, setLoading] = useState<boolean>(true);
  const [dataList, setDataList] = useState<API.DailyVO[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [searchParams, setSearchParams] = useState<API.DailyQueryRequest>({
    ...DEFAULT_PAGE_PARAMS,
  });

  const doSearch = async () => {
    setLoading(true);
    try {
      const listApi = activeTab === 'my' ? listMyDailyVoByPageUsingPost : listDailyVoByPageUsingPost;
      const res = await listApi(searchParams);
      setDataList(res.data?.records ?? []);
      setTotal(Number(res.data?.total) || 0);
    } catch (error: any) {
      message.error('获取日记失败：' + error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    doSearch();
  }, [activeTab, searchParams]);

  return (
    <PageContainer
      title="日记"
      extra={
        <Link to="/daily/edit">
          <Button type="primary" icon={<PlusOutlined />}>
            写日记
          </Button>
        </Link>
      }
    >
      <Tabs
        size="large"
        activeKey={activeTab}
        items={[
          { key: 'my', label: '我的日记' },
          { key: 'public', label: '公开日记' },
        ]}
        onChange={(key) => {
          setActiveTab(key as 'my' | 'public');
          setSearchParams({ ...DEFAULT_PAGE_PARAMS });
        }}
      />

      <QueryFilter
        span={12}
        labelWidth="auto"
        labelAlign="left"
        defaultCollapsed={false}
        style={{ padding: '16px 0' }}
        onFinish={async (values: API.DailyQueryRequest) => {
          setSearchParams({
            ...DEFAULT_PAGE_PARAMS,
            ...values,
            name: values.searchText,
          });
        }}
      >
        <ProFormText label="标题" name="searchText" />
        <ProFormSelect label="标签" name="tags" mode="tags" />
      </QueryFilter>

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
                <Space wrap>
                  {getStatusTag(data.status)}
                  {getVisibilityTag(data.isPublic)}
                </Space>
                {tagListView(data.tags)}
                <Flex justify="space-between" align="center">
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {moment(data.createTime).fromNow()}
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
