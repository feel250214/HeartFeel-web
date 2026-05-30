import {Button, Card, List, Result as AntResult} from 'antd';
import React from 'react';
import {history} from '@umijs/max';
import {clearQuizData, loadQuizData} from '@/utils/storage';

const Result: React.FC = () => {
  const data = loadQuizData();
  if (!data) {
    history.push('/');
    return null;
  }

  const {questions, score, wrong} = data;

  return (
    <Card style={{maxWidth: 700, margin: '40px auto'}}>
      <AntResult
        status="success"
        title={`得分 ${score / questions.length * 100} 分`}
        subTitle={`答对 ${score} / ${questions.length} 题`}
        extra={[
          <Button
            key="retry"
            onClick={() => history.push('/quiz')}
          >
            再测一次
          </Button>,
          <Button
            key="home"
            type="primary"
            onClick={() => {
              clearQuizData();
              history.push('/');
            }}
          >
            换个主题
          </Button>,
        ]}
      />

      {wrong.length > 0 && (
        <List
          style={{fontSize: 20, color: "lightcoral"}}
          header="错题回顾"
          dataSource={wrong}
          renderItem={(item: any) => (
            <List.Item>
              <div>
                <b style={{fontSize: 20, color: "lightpink"}}>{item.question}</b>
                <div>
                  <text style={{color: "lightgreen"}}>正确答案：</text>
                  {item.options[item.answer_index]}
                </div>
                <div>
                  <text style={{color: "lightgreen"}}>AI 解析：</text>
                  {item.explanation}</div>
              </div>
            </List.Item>
          )}
        />
      )}
    </Card>
  );
};

export default Result;
