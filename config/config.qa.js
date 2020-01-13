export default {
  define: {
    // 添加这个自定义的环境变量
    "process.env.UMI_ENV": process.env.UMI_ENV, // * 本地开发环境：dev，qa环境：qa，生产环境prod
    'process.env.BASE_API' : 'http://10.6.12.42/',
  },
// 配置服务器接口
  proxy: [
    {
      context: ['/operation'],
      target: 'http://10.6.12.42/', // 测试环境
      changeOrigin: true,
    }
  ],

}
