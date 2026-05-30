import {Button, Card, Input, message, Select, Space, Tag, Typography} from 'antd';
import React, {useState} from 'react';
import {history} from '@umijs/max';
import {generateQuiz} from '@/services/ai';
import {saveQuizData} from '@/utils/storage';

const {Title} = Typography;
const HOT_TOPICS = ['操作系统', '红楼梦', '量子力学', 'JavaScript'];

const Welcome: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(10);
  const [degree, setDegree] = useState('普通');
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    if (!topic.trim()) {
      message.warning('请输入主题');
      return;
    }

    try {
      setLoading(true);

      const res = await generateQuiz({topic: topic.trim(), count, degree: degree.trim()});

      if (!res?.quiz_list?.length) {
        message.error('未生成有效题目');
        return;
      }

      saveQuizData({
        topic: topic.trim(),
        questions: res.quiz_list,
        currentIndex: 0,
        score: 0,
        wrong: [],
      });

      history.push('/quiz');
    } catch (err) {
      console.error(err);
      message.error('生成失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{maxWidth: 500, margin: '40px auto'}}>
      <Title level={3}>AI 问答知识考试</Title>

      <Input
        placeholder="请输入学习主题，如：操作系统"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        onPressEnter={handleStart}
      />

      <Space wrap style={{marginTop: 12}}>
        {HOT_TOPICS.map((t) => (
          <Tag key={t} onClick={() => setTopic(t)} style={{cursor: 'pointer'}}>
            {t}
          </Tag>
        ))}
      </Space>

      <Space direction="vertical" style={{marginTop: 24, width: '100%'}}>
        <span>题目难度</span>

        <Select value={degree} onChange={setDegree} style={{width: 120}}>
          <Select.Option value={'专家'}>专家</Select.Option>
          <Select.Option value={'困难'}>困难</Select.Option>
          <Select.Option value={'普通'}>普通</Select.Option>
          <Select.Option value={'简单'}>简单</Select.Option>
        </Select>
      </Space>

      <Space direction="vertical" style={{marginTop: 24, width: '100%'}}>
        <span>题目数量</span>

        <Select value={count} onChange={setCount} style={{width: 120}}>
          <Select.Option value={5}>5</Select.Option>
          <Select.Option value={10}>10</Select.Option>
          <Select.Option value={20}>20</Select.Option>
          <Select.Option value={20}>30</Select.Option>
          <Select.Option value={20}>50</Select.Option>
        </Select>

        <Button type="primary" block loading={loading} onClick={handleStart}>
          生成考卷
        </Button>
      </Space>
    </Card>
  );
};

export default Welcome;
