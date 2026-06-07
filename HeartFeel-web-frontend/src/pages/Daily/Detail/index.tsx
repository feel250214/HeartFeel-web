import {
  deleteDailyUsingPost,
  downloadDailyByIdUsingGet,
  getDailyVoByIdUsingGet,
} from '@/services/backend/dailyController';
import { getDailyCoverUrl } from '@/utils/cos';
import { Link, useModel, useParams } from '@@/exports';
import { DeleteOutlined, DownloadOutlined, EditOutlined, UserOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import gfm from '@bytemd/plugin-gfm';
import { Viewer } from '@bytemd/react';
import { history } from '@umijs/max';
import { Avatar, Button, Card, Flex, message, Popconfirm, Space, Tag, Typography } from 'antd';
import { saveAs } from 'file-saver';
import moment from 'moment';
import React, { useEffect, useState } from 'react';

const plugins = [gfm()];

const getStatusTag = (status?: number) => {
  if (status === 0 || status === undefined) {
    return <Tag color="success">正常</Tag>;
  }
  return <Tag>已停用</Tag>;
};

const isPublicDaily = (isPublic?: number | string | boolean) => {
  return isPublic === 1 || isPublic === '1' || isPublic === true || isPublic === 'true';
};

const getVisibilityTag = (isPublic?: number | string | boolean) => {
  if (isPublicDaily(isPublic)) {
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

const DailyDetailPage: React.FC = () => {
  const { id } = useParams();
  const dailyId = id ? Number(id) : undefined;
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<API.DailyVO>({});
  const { initialState } = useModel('@@initialState');
  const { currentUser } = initialState ?? {};
  const canManage = currentUser?.id === data.userId || currentUser?.userRole === 'admin';
  const coverUrl = getDailyCoverUrl(data);

  const loadData = async () => {
    if (!dailyId || Number.isNaN(dailyId)) {
      message.error('日记不存在');
      history.push('/daily');
      return;
    }
    setLoading(true);
    try {
      const res = await getDailyVoByIdUsingGet({
        id: dailyId,
      });
      setData(res.data || {});
    } catch (error: any) {
      message.error('获取日记失败，' + error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const doDownload = async () => {
    if (!dailyId) {
      return;
    }
    try {
      const blob = await downloadDailyByIdUsingGet(
        {
          id: dailyId,
        },
        {
          responseType: 'blob',
        },
      );
      saveAs(blob, `${data.name || 'daily'}.md`);
    } catch (error: any) {
      message.error('下载失败，' + error.message);
    }
  };

  const doDelete = async () => {
    if (!dailyId) {
      return;
    }
    try {
      const res = await deleteDailyUsingPost({
        id: dailyId,
      });
      if (res.data) {
        message.success('删除成功');
        history.push('/daily');
      }
    } catch (error: any) {
      message.error('删除失败，' + error.message);
    }
  };

  return (
    <PageContainer title={<></>} loading={loading}>
      <Card>
        {coverUrl && (
          <>
            <img
              alt={data.name}
              src={coverUrl}
              style={{
                aspectRatio: '4 / 3',
                borderRadius: 4,
                display: 'block',
                marginBottom: 24,
                maxWidth: 480,
                objectFit: 'cover',
                width: '100%',
              }}
            />
          </>
        )}
        <Flex justify="space-between" align="flex-start" gap={24} wrap="wrap">
          <Space direction="vertical" size="middle">
            <Space align="center" size="middle" wrap>
              <Typography.Title level={3} style={{ margin: 0 }}>
                {data.name}
              </Typography.Title>
              {getStatusTag(data.status)}
              {getVisibilityTag(data.isPublic)}
              {tagListView(data.tags)}
            </Space>
            <Space size="middle" wrap>
              <Avatar src={data.user?.userAvatar} icon={<UserOutlined />} />
              <Typography.Text>{data.user?.userName || '未知用户'}</Typography.Text>
              <Typography.Text type="secondary">
                创建时间：{moment(data.createTime).format('YYYY-MM-DD HH:mm:ss')}
              </Typography.Text>
              <Typography.Text type="secondary">
                更新时间：{moment(data.updateTime).format('YYYY-MM-DD HH:mm:ss')}
              </Typography.Text>
            </Space>
          </Space>
          {canManage && (
            <Space wrap>
              <Link to={`/daily/edit?id=${data.id}`}>
                <Button icon={<EditOutlined />}>编辑</Button>
              </Link>
              <Button icon={<DownloadOutlined />} onClick={doDownload}>
                下载
              </Button>
              <Popconfirm
                title="删除日记"
                description="删除后不可恢复，确定删除这篇日记吗？"
                okText="删除"
                cancelText="取消"
                okButtonProps={{ danger: true }}
                onConfirm={doDelete}
              >
                <Button danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            </Space>
          )}
        </Flex>
      </Card>

      <div style={{ marginBottom: 24 }} />

      <Card>
        <Viewer value={data.content || ''} plugins={plugins} />
      </Card>
    </PageContainer>
  );
};

export default DailyDetailPage;
