FROM node:20-alpine

WORKDIR /opt/configgen

COPY package*.json ./
RUN npm install --production

COPY . .

# 创建配置目录
RUN mkdir -p /opt/configgen

EXPOSE 3000

# 配置文件路径（挂载点）
ENV CONFIG_FILE=/opt/configgen/config.json

CMD ["node", "server.js"]
