# ---- Stage 1: Build Frontend ----
# 使用一个包含完整 Node.js 和 npm 工具链的镜像来构建前端
FROM node:18-alpine AS frontend-builder

WORKDIR /app/client

# 仅复制 package.json 和 package-lock.json 以利用 Docker 的层缓存
COPY client/package.json client/package-lock.json ./

# 安装前端依赖
RUN npm install

# 复制前端所有源代码
COPY client/ ./

# 执行生产模式构建，生成优化后的静态文件到 /app/client/dist
RUN npm run build


# ---- Stage 2: Build Backend & Create Final Image ----
# 使用一个轻量的 Node.js 镜像作为最终的生产环境
FROM node:18-alpine

WORKDIR /app

# 从第一阶段（frontend-builder）复制编译好的前端文件到最终镜像
COPY --from=frontend-builder /app/client/dist ./client/dist

# 复制后端的 package.json 和 package-lock.json
COPY package.json package-lock.json ./

# 仅安装生产环境需要的依赖，忽略 devDependencies
RUN npm install --production

# 复制后端的源代码和 TypeScript 配置文件
COPY src ./src
COPY tsconfig.json ./tsconfig.json

# 编译后端 TypeScript 代码，生成 JavaScript 文件到 /app/dist
RUN npx tsc

# 暴露服务器运行的端口
EXPOSE 8080

# 设置容器启动时执行的命令
# 使用我们新添加的 start:prod 脚本
CMD [ "npm", "run", "start:prod" ]