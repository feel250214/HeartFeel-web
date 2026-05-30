import {Alert, Button, Card, Progress, Space, Typography} from 'antd';
import React, {useEffect, useState} from 'react';
import {history} from '@umijs/max';
import {loadQuizData, saveQuizData} from '@/utils/storage';

const {Title} = Typography;

const Quiz: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [showExplain, setShowExplain] = useState(false);

  useEffect(() => {
    const d = loadQuizData();
    if (!d) {
      history.push('/');
      return;
    }
    setData(d);

    // 初始化时设置当前题目的已选项（如果已经做过）
    const currentQuestion = d.questions[d.currentIndex];
    if (currentQuestion.userAnswer !== undefined) {
      setSelected(currentQuestion.userAnswer);
      setShowExplain(true);
    }
  }, []);

  if (!data) return null;

  const {questions, currentIndex, score} = data;
  const question = questions[currentIndex];
  const answeredCount = questions.filter((q: any) => q.userAnswer !== undefined).length;

  const handleNext = (action: number) => {
    // action: 1 = 上一题, 2 = 下一题
    if (action === 1) {
      // 上一题逻辑 - 只允许查看，不允许修改
      if (currentIndex > 0) {
        const prevData = {
          ...data,
          currentIndex: currentIndex - 1
        };
        saveQuizData(prevData);
        setData(prevData);

        // 设置上一题的状态
        const prevQuestion = prevData.questions[prevData.currentIndex];
        setSelected(prevQuestion.userAnswer !== undefined ? prevQuestion.userAnswer : null);
        setShowExplain(prevQuestion.userAnswer !== undefined);
      }
    } else if (action === 2) {
      // 下一题逻辑
      if (selected === null) {
        // 如果没有选择答案，不能直接跳转到下一题
        return;
      }

      if (currentIndex + 1 < questions.length) {
        const nextData = {
          ...data,
          currentIndex: currentIndex + 1
        };
        saveQuizData(nextData);
        setData(nextData);

        // 设置下一题的状态
        const nextQuestion = nextData.questions[nextData.currentIndex];
        setSelected(nextQuestion.userAnswer !== undefined ? nextQuestion.userAnswer : null);
        setShowExplain(nextQuestion.userAnswer !== undefined);
      } else {
        // 如果是最后一题，跳转到结果页
        history.push('/result');
      }
    }
  };

  const handleSelect = (idx: number) => {
    // 如果当前题目已经回答过，不允许重新选择
    if (question.userAnswer !== undefined) {
      return;
    }

    const correct = idx === question.answer_index;

    const newQuestions = [...questions];
    newQuestions[currentIndex] = {
      ...question,
      userAnswer: idx,
      isCorrect: correct
    };

    const newData = {
      ...data,
      questions: newQuestions,
      score: correct ? score + 1 : score,
    };

    // 只有做错才加入错题本
    if (!correct) {
      const exists = data.wrong.some((q: any) => q.question === question.question);
      if (!exists) {
        newData.wrong = [...data.wrong, {
          ...question,
          userAnswer: idx
        }];
      }
    }


    setSelected(idx);
    setShowExplain(true);
    saveQuizData(newData);
    setData(newData);
  };

  const getOptionStyle = (idx: number) => {
    const style: React.CSSProperties = {};

    if (question.userAnswer !== undefined) {
      // 已经答过的题目
      if (idx === question.answer_index) {
        // 正确答案
        style.borderColor = '#52c41a';
        style.color = '#52c41a';
        style.backgroundColor = '#f6ffed';
      } else if (idx === question.userAnswer && idx !== question.answer_index) {
        // 用户选择的错误答案
        style.borderColor = '#ff4d4f';
        style.color = '#ff4d4f';
        style.backgroundColor = '#fff2f0';
      }
    } else if (selected !== null) {
      // 当前正在回答的题目
      if (idx === question.answer_index) {
        // 正确答案
        style.borderColor = '#52c41a';
        style.color = '#52c41a';
        style.backgroundColor = '#f6ffed';
      } else if (idx === selected && idx !== question.answer_index) {
        // 用户选择的错误答案
        style.borderColor = '#ff4d4f';
        style.color = '#ff4d4f';
        style.backgroundColor = '#fff2f0';
      }
    }

    return style;
  };

  const getButtonType = (idx: number) => {
    if (question.userAnswer !== undefined || selected !== null) {
      if (idx === question.answer_index) return 'primary';
    }
    return 'default';
  };

  return (
    <Card style={{maxWidth: 600, margin: '40px auto'}}>
      <Progress
        percent={Math.round((answeredCount / questions.length) * 100)}
      />

      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 16}}>
        <span>已答：{answeredCount}/{questions.length}</span>
        <span>得分：{score}/{questions.length}</span>
      </div>

      <Title level={4} style={{marginTop: 16}}>
        {currentIndex + 1}. {question.question}
      </Title>

      <Space direction="vertical" style={{width: '100%'}}>
        {question.options.map((opt: string, idx: number) => {
          const isAnswered = question.userAnswer !== undefined;

          return (
            <Button
              key={idx}
              block
              type={getButtonType(idx) as any}
              style={getOptionStyle(idx)}
              onClick={() => handleSelect(idx)}
              disabled={isAnswered}
            >
              {opt}
            </Button>
          );
        })}
      </Space>

      <Space style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16
      }}>
        <Button
          color='geekblue'
          onClick={() => handleNext(1)}
          disabled={currentIndex === 0}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          上一题
        </Button>
        <div style={{width: '50px'}}></div>
        <Button
          type="primary"
          color='blue'
          onClick={() => handleNext(2)}
          disabled={selected === null}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {currentIndex + 1 === questions.length ? '完成考试' : '下一题'}
        </Button>
      </Space>

      {showExplain && (
        <Alert
          style={{marginTop: 16}}
          type="info"
          message="AI 解析："
          description={question.explanation}
        />
      )}
    </Card>
  );
};

export default Quiz;
