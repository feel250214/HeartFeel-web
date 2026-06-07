import React, {useEffect, useRef, useState} from 'react';
import './static/css/root.css';
import './static/css/style.css';
import logo from './static/img/logo.png';
import logoFrame from './static/img/logokuang.png';
import skillPc from './static/svg/skillPc.svg';
import skillWap from './static/svg/skillWap.svg';
import SnakeLight from './static/components/SnakeLight';
import SnakeDark from './static/components/SnakeDark';
import imgSite1 from './static/img/i1.png';
import imgProj1 from './static/img/i1.png';
import imgSite2 from './static/img/i2.png';
import imgProj2 from './static/img/i2.png';
import imgProj3 from './static/img/i4.png';
import imgProj4 from './static/img/i4.png';
import imgWechat from './static/img/微信公众号.png';
import imgDonate from './static/img/收款码.jpg';
import {history} from "@@/core/history";

type ThemeType = 'Light' | 'Dark';

function setCookie(name: string, value: string, days: number) {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/`;
}

function getCookie(name: string) {
  const nameEQ = `${name}=`;
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i += 1) {
    let cookie = cookies[i];
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1, cookie.length);
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return cookie.substring(nameEQ.length, cookie.length);
    }
  }
  return null;
}

interface ProjectItemProps {
  className: string;
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
}

const ProjectItem: React.FC<ProjectItemProps> = ({className, href, onClick, children}) => {
  const [pressed, setPressed] = useState(false);
  const handlePress = () => setPressed(true);
  const handleRelease = () => setPressed(false);
  const handleCancel = () => setPressed(false);
  const finalClassName = `${className} projectItem${pressed ? ' pressed' : ''}`;
  const commonProps = {
    className: finalClassName,
    onMouseDown: handlePress,
    onMouseUp: handleRelease,
    onMouseLeave: handleCancel,
    onTouchStart: handlePress,
    onTouchEnd: handleRelease,
    onTouchCancel: handleCancel,
    onClick,
  } as const;
  if (href) {
    return (
      <a {...commonProps} href={href} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }
  return (
    <a {...commonProps} href="javascript:void(0)">
      {children}
    </a>
  );
};

const Welcome: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<ThemeType>('Light');
  const [popupImage, setPopupImage] = useState<string | null>(null);
  const fpsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };
    document.addEventListener('contextmenu', handleContextMenu);
    const savedTheme = getCookie('themeState') as ThemeType | null;
    const initialTheme: ThemeType = savedTheme === 'Dark' ? 'Dark' : 'Light';
    setTheme(initialTheme);
    if (typeof document !== 'undefined') {
      const html = document.documentElement;
      html.dataset.theme = initialTheme;
    }
    let animationFrameId: number;
    let last = performance.now();
    let frames = 0;
    const loop = (now: number) => {
      frames += 1;
      const offset = now - last;
      if (offset >= 1000) {
        if (fpsRef.current) {
          fpsRef.current.textContent = `FPS: ${frames}`;
        }
        frames = 0;
        last = now;
      }
      animationFrameId = requestAnimationFrame(loop);
    };
    animationFrameId = requestAnimationFrame(loop);
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 100);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      cancelAnimationFrame(animationFrameId);
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    const html = document.documentElement;
    html.dataset.theme = theme;
    setCookie('themeState', theme, 365);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'Dark' ? 'Light' : 'Dark'));
  };

  const openPopup = (src: string) => {
    setPopupImage(src);
  };

  const closePopup = () => {
    setPopupImage(null);
  };

  const goToAItest = () => {
    const urlParams = new URL(window.location.href).searchParams;
    history.push(urlParams.get('redirect') || '/home');
  }

  const isSwitchChecked = theme === 'Light';

  return (
    <div className="welcome-page-root">
      <div
        id="heart_feel-loading"
        style={{
          opacity: loading ? 1 : 0,
          pointerEvents: loading ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      >
        <div id="heart_feel-loading-center"/>
      </div>
      <div className="heart_feel-filter"/>
      <div className="heart_feel-main">
        <div className="heart_feel-left">
          <div className="logo" style={{backgroundImage: `url(${logo})`}}>
            <img
              style={{
                position: 'absolute',
                top: '-15%',
                left: '-10%',
                width: '120%',
                aspectRatio: '1/1',
              }}
              src={logoFrame}
              alt=""
            />
          </div>
          <div className="left-div left-des">
            <div className="left-des-item">
              <svg
                className="icon"
                viewBox="0 0 1024 1024"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M512 249.976471c-99.388235 0-180.705882 81.317647-180.705882 180.705882s81.317647 180.705882 180.705882 180.705882 180.705882-81.317647 180.705882-180.705882-81.317647-180.705882-180.705882-180.705882z m0 301.17647c-66.258824 0-120.470588-54.211765-120.470588-120.470588s54.211765-120.470588 120.470588-120.470588 120.470588 54.211765 120.470588 120.470588-54.211765 120.470588-120.470588 120.470588z"/>
                <path
                  d="M512 39.152941c-216.847059 0-391.529412 174.682353-391.529412 391.529412 0 349.364706 391.529412 572.235294 391.529412 572.235294s391.529412-222.870588 391.529412-572.235294c0-216.847059-174.682353-391.529412-391.529412-391.529412z m0 891.482353C424.658824 873.411765 180.705882 686.682353 180.705882 430.682353c0-183.717647 147.576471-331.294118 331.294118-331.294118s331.294118 147.576471 331.294118 331.294118c0 256-243.952941 442.729412-331.294118 499.952941z"/>
              </svg>
              广东汕头
            </div>
            <div className="left-des-item">
              <svg
                className="icon"
                viewBox="0 0 1024 1024"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M729.6 234.666667H294.4V157.866667a51.2 51.2 0 0 1 51.2-51.2h332.8a51.2 51.2 0 0 1 51.2 51.2v76.8z m179.2 51.2a51.2 51.2 0 0 1 51.2 51.2v512a51.2 51.2 0 0 1-51.2 51.2H115.2a51.2 51.2 0 0 1-51.2-51.2v-512a51.2 51.2 0 0 1 51.2-51.2h793.557333z m-768 172.032c0 16.384 13.312 29.696 29.696 29.696h683.008a29.696 29.696 0 1 0 0-59.392H170.410667a29.696 29.696 0 0 0-29.696 29.696z m252.416 118.784c0 16.384 13.312 29.696 29.696 29.696h178.176a29.696 29.696 0 1 0 0-59.392H422.912a29.738667 29.738667 0 0 0-29.696 29.696z"/>
              </svg>
              汕头大学学生
            </div>
          </div>
          <div className="left-div left-tag">
            <div className="left-tag-item">前端</div>
            <div className="left-tag-item">后端</div>
            <div className="left-tag-item">全栈</div>
            <div className="left-tag-item">网页</div>
            <div className="left-tag-item">羽毛球</div>
            <div className="left-tag-item">铲屎官</div>
            <div className="left-tag-item">独处</div>
            <div className="left-tag-item">散步</div>
          </div>
          <div className="left-div left-time">
            <ul id="line">
              <li>
                <div className="focus"/>
                <div>单词拼写上线</div>
                <div>2026.06</div>
              </li>
              <li>
                <div className="focus"/>
                <div>日记功能上线</div>
                <div>2026.04</div>
              </li>
              <li>
                <div className="focus"/>
                <div>代码生成器上线</div>
                <div>2026.04</div>
              </li>
              <li>
                <div className="focus"/>
                <div>个人网站上线</div>
                <div>2026.04</div>
              </li>
              <li>
                <div className="focus"/>
                <div>ICP备案成功</div>
                <div>2025.12</div>
              </li>
              <li>
                <div className="focus"/>
                <div>注册域名dpqas.top</div>
                <div>2025.11</div>
              </li>
              <li>
                <div className="focus"/>
                <div>搭建微纳视界薄膜研究网站</div>
                <div>2025.10</div>
              </li>
              <li>
                <div className="focus"/>
                <div>...</div>
                <div>...</div>
              </li>
              <li>
                <div className="focus"/>
                <div>出来后洗心革面</div>
                <div>2005.02</div>
              </li>
            </ul>
          </div>
        </div>
        <div className="heart_feel-right">
          <header>
            <div className="index-logo" style={{backgroundImage: `url(${logo})`}}>
              <img
                style={{
                  position: 'absolute',
                  top: '-15%',
                  left: '-10%',
                  width: '120%',
                  aspectRatio: '1/1',
                }}
                src={logoFrame}
                alt=""
              />
            </div>
            <div className="welcome">
              你好我是<span className="gradientText">Heart_Feel.</span>
            </div>
            <div className="description">
              👦 <span className="purpleText">Full Stack</span> Developer
            </div>
            <div className="description">
              📝 The only way to do <span className="purpleText textBackground">great</span> is to{' '}
              <span className="purpleText textBackground">love</span> what you do.
            </div>
            <div className="iconContainer">
              <a className="iconItem" href="https://github.com/feel250214" target="_blank" rel="noreferrer">
                <svg
                  className="icon"
                  viewBox="0 0 1024 1024"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M511.6 76.3C264.3 76.2 64 276.4 64 523.5 64 718.9 189.3 885 363.8 946c23.5 5.9 19.9-10.8 19.9-22.2v-77.5c-135.7 15.9-141.2-73.9-150.3-88.9C215 726 171.5 718 184.5 703c30.9-15.9 62.4 4 98.9 57.9 26.4 39.1 77.9 32.5 104 26 5.7-23.5 17.9-44.5 34.7-60.8-140.6-25.2-199.2-111-199.2-213 0-49.5 16.3-95 48.3-131.7-20.4-60.5 1.9-112.3 4.9-120 58.1-5.2 118.5 41.6 123.2 45.3 33-8.9 70.7-13.6 112.9-13.6 42.4 0 80.2 4.9 113.5 13.9 11.3-8.6 67.3-48.8 121.3-43.9 2.9 7.7 24.7 58.3 5.5 118 32.4 36.8 48.9 82.7 48.9 132.3 0 102.2-59 188.1-200 212.9 23.5 23.2 38.1 55.4 38.1 91v112.5c0.8 9 0 17.9 15 17.9 177.1-59.7 304.6-227 304.6-424.1 0-247.2-200.4-447.3-447.5-447.3z"/>
                </svg>
                <div className="iconTip">Github</div>
              </a>
              <a className="iconItem" href="mailto:13690068203@163.com?subject=关于您的网站">
                <svg
                  className="icon"
                  viewBox="0 0 1024 1024"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M926.47619 355.644952V780.190476a73.142857 73.142857 0 0 1-73.142857 73.142857H170.666667a73.142857 73.142857 0 0 1-73.142857-73.142857V355.644952l304.103619 257.828572a170.666667 170.666667 0 0 0 220.745142 0L926.47619 355.644952zM853.333333 170.666667a74.044952 74.044952 0 0 1 26.087619 4.778666 72.704 72.704 0 0 1 30.622477 22.186667 73.508571 73.508571 0 0 1 10.678857 17.67619c3.169524 7.509333 5.12 15.652571 5.607619 24.210286L926.47619 243.809524v24.380952L559.469714 581.241905a73.142857 73.142857 0 0 1-91.306666 2.901333l-3.632762-2.925714L97.52381 268.190476v-24.380952a72.899048 72.899048 0 0 1 40.155428-65.292191A72.97219 72.97219 0 0 1 170.666667 170.666667h682.666666z"/>
                </svg>
                <div className="iconTip">Mail</div>
              </a>
              <a className="iconItem" onClick={() => openPopup(imgDonate)}>
                <svg
                  className="icon"
                  viewBox="0 0 1024 1024"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M995.575172 725.451034c-12.358621-26.835862-38.488276-64.794483-92.689655-94.27862-62.146207-33.721379-136.297931-40.96-208.860689-20.303448l-99.928276 28.424827-279.304828-126.057931H22.775172v489.401379h509.704828l432.375172-195.266207c15.006897-6.708966 26.835862-19.42069 32.662069-34.957241 5.649655-15.36 4.943448-31.955862-1.942069-46.962759z m-482.162758 188.910345H111.051034V601.688276h184.673104l166.664828 75.387586-3.354483 0.882759h-170.372414v88.275862H471.393103l246.819311-70.267586c49.434483-14.124138 101.517241-9.357241 142.653793 12.888275 18.184828 9.886897 30.72 20.833103 39.371034 30.896552l-386.824827 174.609655z"/>
                  <path
                    d="M695.437241 163.486897l58.615173-142.30069h-397.24138l66.736552 143.36c-121.82069 53.142069-207.095172 174.433103-207.095172 315.674483 0 28.601379 3.531034 57.202759 10.593103 84.744827l85.627586-21.715862c-5.12-20.48-7.768276-41.666207-7.768275-63.028965 0-141.241379 114.758621-256 256-256s256 114.758621 256 256c0 51.023448-14.830345 100.104828-43.078621 142.300689l73.268965 49.08138c37.958621-56.673103 58.085517-122.88 58.085518-191.382069-0.176552-141.947586-86.686897-264.121379-209.743449-316.733793zM467.508966 91.983448h180.965517l-21.009655 50.846897a348.16 348.16 0 0 0-66.913104-6.708966c-23.834483 0-46.962759 2.471724-69.384827 7.062069l-23.657931-51.2z"/>
                  <path
                    d="M683.431724 427.431724v-70.62069h-38.311724l30.190345-30.190344-49.964138-49.964138-62.49931 62.49931h-6.002759L494.344828 276.656552l-49.787587 49.964138 30.013793 30.190344h-38.311724v70.62069h88.275862v35.310345h-88.275862v70.62069h88.275862v52.965517h70.62069v-52.965517h88.275862v-70.62069h-88.275862v-35.310345z"/>
                </svg>
                <div className="iconTip">赞助</div>
              </a>
              <a className="switch" href="javascript:void(0)">
                <div className="onoffswitch">
                  <input
                    type="checkbox"
                    name="onoffswitch"
                    className="onoffswitch-checkbox"
                    id="myonoffswitch"
                    checked={isSwitchChecked}
                    onChange={handleToggleTheme}
                  />
                  <label className="onoffswitch-label" htmlFor="myonoffswitch">
                    <span className="onoffswitch-inner"/>
                    <span className="onoffswitch-switch"/>
                  </label>
                </div>
              </a>
            </div>
            <div className="tanChiShe">
              {theme === 'Dark' ? <SnakeDark/> : <SnakeLight/>}
            </div>
          </header>
          <div className="content">
            <div className="title">
              <svg
                className="icon"
                viewBox="0 0 1024 1024"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M629.333333 202.666667v213.333333h277.333334v448h-512v-213.333333h-277.333334v-448h512z m213.333334 277.333333h-213.333334v170.666667h-170.666666v149.333333h384v-320z m-277.333334-213.333333h-384v320h213.333334v-170.666667h170.666666v-149.333333z m0 213.333333h-106.666666v106.666667h106.666666v-106.666667z"/>
              </svg>
              site
            </div>
            <div className="projectList">
              <ProjectItem className="projectItem a" onClick={() => openPopup(imgWechat)}>
                <div className="projectItemLeft">
                  <h1>公众号</h1>
                  <p>记录学习打卡日常</p>
                </div>
                <div className="projectItemRight">
                  <img src={imgSite1} alt=""/>
                </div>
              </ProjectItem>
              <ProjectItem className="projectItem a" href="http://www.dpqas.top">
                <div className="projectItemLeft">
                  <h1>微纳视界网站</h1>
                  <p>大创网站，自己的第一个网站</p>
                </div>
                <div className="projectItemRight">
                  <img src={imgSite2} alt=""/>
                </div>
              </ProjectItem>
            </div>
            <div className="title">
              <svg
                className="icon"
                viewBox="0 0 1024 1024"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M629.333333 202.666667v213.333333h277.333334v448h-512v-213.333333h-277.333334v-448h512z m213.333334 277.333333h-213.333334v170.666667h-170.666666v149.333333h384v-320z m-277.333334-213.333333h-384v320h213.333334v-170.666667h170.666666v-149.333333z m0 213.333333h-106.666666v106.666667h106.666666v-106.666667z"/>
              </svg>
              project
            </div>
            <div className="projectList">
              <ProjectItem className="projectItem b">
                <a href="http://dpqas.top:8787/generator/home">
                  <div className="projectItemLeft">
                    <h1>代码生成器项目</h1>
                    <p>代码生成器在线制作共享</p>
                  </div>
                </a>
                <div className="projectItemRight">
                  <img src={imgProj1} alt=""/>
                </div>
              </ProjectItem>
              <ProjectItem className="projectItem b" onClick={goToAItest}>
                <a href="http://dpqas.top:8787/qusetion/home">
                  <div className="projectItemLeft">
                    <h1>AI 问答知识考试</h1>
                    <p>AI为你出题从此高效学习</p>
                  </div>
                </a>
                <div className="projectItemRight">
                  <img src={imgProj2} alt=""/>
                </div>
              </ProjectItem>
              <ProjectItem className="projectItem b">
                <a href="http://dpqas.top:8787/qwerty-trainer">
                  <div className="projectItemLeft">
                    <h1>英语单词打字</h1>
                    <p>在线练习打字</p>
                  </div>
                </a>
                <div className="projectItemLeft">
                  <h1></h1>
                  <p>未开发</p>
                </div>
                <div className="projectItemRight">
                  <img src={imgProj3} alt=""/>
                </div>
              </ProjectItem>
              <ProjectItem className="projectItem b">
                <a href="http://dpqas.top:8787/daily/home">
                  <div className="projectItemLeft">
                    <h1>日记学习打卡</h1>
                    <p>记录日常学习生活</p>
                  </div>
                </a>
                <div className="projectItemRight">
                  <img src={imgProj4} alt=""/>
                </div>
              </ProjectItem>
            </div>
            <div className="title">
              <svg
                className="icon"
                viewBox="0 0 1024 1024"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M395.765333 586.570667h-171.733333c-22.421333 0-37.888-22.442667-29.909333-43.381334L364.768 95.274667A32 32 0 0 1 394.666667 74.666667h287.957333c22.72 0 38.208 23.018667 29.632 44.064l-99.36 243.882666h187.050667c27.509333 0 42.186667 32.426667 24.042666 53.098667l-458.602666 522.56c-22.293333 25.408-63.626667 3.392-54.976-29.28l85.354666-322.421333zM416.714667 138.666667L270.453333 522.581333h166.869334a32 32 0 0 1 30.933333 40.181334l-61.130667 230.954666 322.176-367.114666H565.312c-22.72 0-38.208-23.018667-29.632-44.064l99.36-243.882667H416.714667z"/>
              </svg>
              skills
            </div>
            <div className="skill">
              <img id="skillPc" src={skillPc} alt=""/>
              <img id="skillWap" src={skillWap} alt=""/>
            </div>
          </div>
        </div>
      </div>
      {popupImage && (
        <div className="tc active" onClick={closePopup}>
          <div className="tc-main active" onClick={(event) => event.stopPropagation()}>
            <img className="tc-img" src={popupImage} alt=""/>
          </div>
        </div>
      )}

      <div
        id="fps"
        ref={fpsRef}
        style={{
          position: 'fixed',
          left: 0,
          zIndex: 10000,
        }}
      />
    </div>
  );
};

export default Welcome;
