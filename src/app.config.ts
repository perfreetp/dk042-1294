export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/calendar/index',
    'pages/checklist/index',
    'pages/records/index',
    'pages/messages/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FFFFFF',
    navigationBarTitleText: 'IVF疗程日历',
    navigationBarTextStyle: 'black',
    backgroundColor: '#FFF8FA'
  },
  tabBar: {
    color: '#B2BEC3',
    selectedColor: '#FF8BA7',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页'
      },
      {
        pagePath: 'pages/calendar/index',
        text: '日历'
      },
      {
        pagePath: 'pages/checklist/index',
        text: '清单'
      },
      {
        pagePath: 'pages/records/index',
        text: '记录'
      },
      {
        pagePath: 'pages/messages/index',
        text: '消息'
      }
    ]
  }
})
