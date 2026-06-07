import PictureUploader from '@/components/PictureUploader';
import {
  addDailyUsingPost,
  editDailyUsingPost,
  getDailyContentByIdUsingGet,
  getDailyVoByIdUsingGet,
  listMyDailyTemplateVoByPageUsingPost,
  listMyDailyVoByPageUsingPost,
} from '@/services/backend/dailyController';
import { getDailyCoverUrl } from '@/utils/cos';
import { useSearchParams } from '@@/exports';
import type { ProFormInstance } from '@ant-design/pro-components';
import { PageContainer, ProCard, ProForm, ProFormText } from '@ant-design/pro-components';
import { ProFormItem } from '@ant-design/pro-form';
import gfm from '@bytemd/plugin-gfm';
import { Editor } from '@bytemd/react';
import { history } from '@umijs/max';
import { Button, Empty, Flex, Input, List, message, Modal, Space, Typography } from 'antd';
import moment from 'moment';
import React, { useEffect, useRef, useState } from 'react';

const plugins = [gfm()];

const TEMPLATE_PAGE_PARAMS: API.DailyQueryRequest = {
  current: 1,
  pageSize: 8,
  sortField: 'createTime',
  sortOrder: 'descend',
};

const DailyEditPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const idParam = searchParams.get('id');
  const dailyId = idParam ? Number(idParam) : undefined;
  const isEdit = Boolean(idParam);
  const formRef = useRef<ProFormInstance<API.DailyEditRequest>>();
  const [loading, setLoading] = useState<boolean>(false);
  const [oldData, setOldData] = useState<API.DailyVO>();
  const [coverPath, setCoverPath] = useState<string>();
  const [coverUrl, setCoverUrl] = useState<string>();
  const [templateOpen, setTemplateOpen] = useState<boolean>(false);
  const [templateLoading, setTemplateLoading] = useState<boolean>(false);
  const [templateKeyword, setTemplateKeyword] = useState<string>('');
  const [templateList, setTemplateList] = useState<API.DailyVO[]>([]);
  const [templateTotal, setTemplateTotal] = useState<number>(0);
  const [templateParams, setTemplateParams] = useState<API.DailyQueryRequest>({
    ...TEMPLATE_PAGE_PARAMS,
  });

  const loadData = async () => {
    if (!idParam) {
      return;
    }
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
      setOldData(res.data || {});
      setCoverPath(res.data?.coverPath || res.data?.coverUrl || res.data?.cover);
      setCoverUrl(getDailyCoverUrl(res.data));
      formRef.current?.setFieldsValue({
        name: res.data?.name,
        content: res.data?.content,
        coverPath: res.data?.coverPath || res.data?.coverUrl || res.data?.cover,
      });
    } catch (error: any) {
      message.error('加载日记失败，' + error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [idParam]);

  const loadTemplates = async (params: API.DailyQueryRequest = templateParams) => {
    setTemplateLoading(true);
    try {
      const requestParams = {
        ...params,
        notId: dailyId,
      };
      let res: API.BaseResponsePageDailyVO_;
      try {
        res = await listMyDailyTemplateVoByPageUsingPost(requestParams);
      } catch (error) {
        res = await listMyDailyVoByPageUsingPost(requestParams);
      }
      setTemplateList(res.data?.records ?? []);
      setTemplateTotal(Number(res.data?.total) || 0);
    } catch (error: any) {
      message.error('加载已有内容失败，' + error.message);
    }
    setTemplateLoading(false);
  };

  useEffect(() => {
    if (templateOpen) {
      loadTemplates();
    }
  }, [templateOpen, templateParams]);

  const applyTemplate = async (template: API.DailyVO) => {
    if (!template.id) {
      return;
    }
    setTemplateLoading(true);
    try {
      const res = await getDailyContentByIdUsingGet({
        id: template.id,
      });
      formRef.current?.setFieldsValue({
        name: template.name,
        content: res.data ?? template.content ?? '',
        coverPath: template.coverPath || template.coverUrl || template.cover,
      });
      setCoverPath(template.coverPath || template.coverUrl || template.cover);
      setCoverUrl(getDailyCoverUrl(template));
      message.success('已导入已有内容');
      setTemplateOpen(false);
    } catch (error: any) {
      message.error('导入已有内容失败，' + error.message);
    }
    setTemplateLoading(false);
  };

  const doSubmit = async (values: API.DailyEditRequest) => {
    const payload = {
      name: values.name?.trim(),
      content: values.content ?? '',
      coverPath: values.coverPath || coverPath,
    };

    try {
      if (dailyId) {
        const res = await editDailyUsingPost({
          id: dailyId,
          ...payload,
        });
        if (res.data) {
          message.success('保存成功');
          history.push(`/daily/detail/${dailyId}`);
        }
      } else {
        const res = await addDailyUsingPost(payload);
        if (res.data) {
          message.success('创建成功');
          history.push(`/daily/detail/${res.data}`);
        }
      }
      return true;
    } catch (error: any) {
      message.error((dailyId ? '保存失败，' : '创建失败，') + error.message);
      return false;
    }
  };

  return (
    <PageContainer
      title={dailyId ? '编辑日记' : '写日记'}
      loading={loading}
      extra={<Button onClick={() => setTemplateOpen(true)}>选择已有内容</Button>}
    >
      <ProCard>
        {(!isEdit || oldData) && (
          <ProForm<API.DailyEditRequest>
            formRef={formRef}
            initialValues={oldData}
            layout="vertical"
            onFinish={doSubmit}
            submitter={{
              searchConfig: {
                submitText: dailyId ? '保存修改' : '创建日记',
                resetText: '重置',
              },
            }}
          >
            <ProFormText
              name="name"
              label="标题"
              placeholder="请输入日记标题"
              rules={[{ required: true, message: '请输入日记标题' }]}
            />
            <ProFormItem
              name="coverPath"
              label="封面图"
              extra="图片会压缩到 3MB 以内再上传"
            >
              <PictureUploader
                biz="daily_cover"
                aspectRatio={4 / 3}
                aspectRatioLabel="4:3"
                dailyId={dailyId}
                maxSizeMB={3}
                value={coverUrl}
                onChange={(url, filePath) => {
                  const nextCoverPath = filePath || url;
                  setCoverPath(nextCoverPath);
                  setCoverUrl(url);
                  formRef.current?.setFieldsValue({
                    coverPath: nextCoverPath,
                  });
                }}
              />
            </ProFormItem>
            <ProFormItem name="content" label="正文">
              <Editor
                plugins={plugins}
                mode="auto"
                placeholder="记录今天的想法..."
                editorConfig={{
                  lineNumbers: true,
                }}
              />
            </ProFormItem>
          </ProForm>
        )}
      </ProCard>
      <Modal
        title="选择已有内容"
        width={760}
        open={templateOpen}
        footer={null}
        onCancel={() => setTemplateOpen(false)}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Input.Search
            allowClear
            placeholder="搜索日记标题"
            enterButton="搜索"
            value={templateKeyword}
            onChange={(event) => setTemplateKeyword(event.target.value)}
            onSearch={(value) => {
              setTemplateParams({
                ...TEMPLATE_PAGE_PARAMS,
                name: value,
                searchText: value,
              });
            }}
          />
          <List<API.DailyVO>
            rowKey="id"
            loading={templateLoading}
            dataSource={templateList}
            locale={{
              emptyText: <Empty description="暂无可选日记" />,
            }}
            pagination={{
              current: templateParams.current,
              pageSize: templateParams.pageSize,
              total: templateTotal,
              showSizeChanger: false,
              onChange(current) {
                setTemplateParams({
                  ...templateParams,
                  current,
                });
              },
            }}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button key="use" type="link" onClick={() => applyTemplate(item)}>
                    使用此内容
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    getDailyCoverUrl(item) ? (
                      <img
                        alt={item.name}
                        src={getDailyCoverUrl(item)}
                        style={{
                          aspectRatio: '4 / 3',
                          borderRadius: 4,
                          height: 72,
                          objectFit: 'cover',
                          width: 96,
                        }}
                      />
                    ) : undefined
                  }
                  title={item.name}
                  description={
                    <Flex vertical gap={4}>
                      <Typography.Text type="secondary" ellipsis>
                        {item.content || '无正文预览'}
                      </Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {moment(item.updateTime || item.createTime).format('YYYY-MM-DD HH:mm')}
                      </Typography.Text>
                    </Flex>
                  }
                />
              </List.Item>
            )}
          />
        </Space>
      </Modal>
    </PageContainer>
  );
};

export default DailyEditPage;
