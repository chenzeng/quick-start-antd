let targetAdmin = 'http://172.20.19.14:8000/'; // 服务端ip
let targetBase = 'http://172.20.19.14:8000/'; // 
export default {
  define: {
    // 添加这个自定义的环境变量
    'process.env.UMI_ENV': process.env.UMI_ENV, // * 本地开发环境：dev，qa环境：qa，生产环境prod
    // 页面用使用process.env.BASE_API获取url前缀
    'process.env.BASE_API': targetAdmin,
  },
  // 配置服务器接口
  proxy: [
    {
      context: ['/product', '/user', '/role', '/auth'],
      target: targetAdmin,
    },
    {
      context: ['/login', '/logout', '/image', '/file'],
      target: targetBase,
    },
  ],
};
