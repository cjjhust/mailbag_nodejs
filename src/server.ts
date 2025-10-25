import express, { Request, Response } from 'express';

// -----------------------------------------------------------
// 1. 配置
// -----------------------------------------------------------
// 使用环境变量 PORT，如果未设置，则默认为 3000
const PORT = process.env.PORT || 3000;
const app = express();

// 添加中间件，用于解析 JSON 格式的请求体
app.use(express.json());

// -----------------------------------------------------------
// 2. 路由定义
// -----------------------------------------------------------

// 定义一个根路由 /
app.get('/', (req: Request, res: Response) => {
  res.send('Backend API is running successfully! (via Node.js/TypeScript)');
});

// 定义一个示例 API 路由 
app.get('/api/status', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Data loaded from the backend.',
  });
});


// -----------------------------------------------------------
// 3. 启动服务器
// -----------------------------------------------------------
app.listen(PORT, () => {
  // 打印日志，确认服务器已启动
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`   Access it via: http://localhost:${PORT}`);
});