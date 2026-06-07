export default [
  {
    path: '/user',
    layout: false,
    routes: [
      { path: '/user/login', component: './User/Login' },
      { path: '/user/register', component: './User/Register' },
    ],
  },
  // 介绍页
  { path: '/welcome', icon: 'smile', component: './Welcome', name: '欢迎页' },

  // 日记路径
  {
    path: '/daily/home',
    icon: 'BookOutlined',
    component: './Daily/Home',
    name: '日记主页',
  },
  {
    path: '/daily/edit',
    access: 'canUser',
    component: './Daily/Edit',
    name: '日记编辑',
    hideInMenu: true,
  },
  {
    path: '/daily/detail/:id',
    access: 'canUser',
    component: './Daily/Detail',
    name: '日记详情',
    hideInMenu: true,
  },

  // AI问答路径
  {
    path: '/question/quiz',
    access: 'canUser',
    icon: 'smile',
    component: './AITest/Quiz',
    name: '答题页',
    hideInMenu: true,
  },
  { path: '/question/home', icon: 'AndroidOutlined', component: './AITest/Home', name: 'AI问答主页' },
  {
    path: '/question/result',
    access: 'canUser',
    icon: 'smile',
    component: './AITest/Result',
    name: '结果页',
    hideInMenu: true,
  },

  // 单词记忆训练主页
  {
    path: '/qwerty-trainer',
    access: 'canUser',
    icon: 'VerticalAlignBottomOutlined',
    component: './QwertyTrainer',
    name: '键盘记忆训练',
  },

  // 生成器路径
  {
    path: '/generator',
    icon: 'home',
    name: '生成器',
    access: 'canUser',
    routes: [
      {
        path: '/generator/home',
        icon: 'home',
        component: './Generator/Home',
        name: '生成器主页',
      },
      {
        path: '/generator/add',
        icon: 'plus',
        component: './Generator/Add',
        name: '创建生成器',
      },
      {
        path: '/generator/update',
        icon: 'plus',
        access: 'canUser',
        component: './Generator/Add',
        name: '修改生成器',
        hideInMenu: true,
      },
      {
        path: '/generator/use/:id',
        icon: 'AuditOutlined',
        access: 'canUser',
        component: './Generator/Use',
        name: '使用生成器',
        hideInMenu: true,
      },
      {
        path: '/generator/Detail/:id',
        icon: 'plus',
        access: 'canUser',
        component: './Generator/Detail',
        name: '生成器详情',
        hideInMenu: true,
      },
    ],
  },



  // 管理员路径
  {
    path: '/admin',
    icon: 'crown',
    name: '管理页',
    access: 'canAdmin',
    routes: [
      { path: '/admin', redirect: '/admin/user' },
      { icon: 'table', path: '/admin/user', component: './Admin/User', name: '用户管理' },
      {
        icon: 'tools',
        path: '/admin/generator',
        component: './Admin/Generator',
        name: '生成器管理',
      },
    ],
  },
  { path: '/', redirect: '/welcome' },
  { path: '*', layout: false, component: './404' },
];
