FROM node:20-alpine
WORKDIR /app
COPY package.json ./
COPY apps/api/package.json ./apps/api/
RUN mkdir -p packages/analytics/src packages/ai packages/data packages/utils
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
RUN cd apps/api && npm install
EXPOSE 4000
CMD ["node", "-e", "require('./src/index.ts')"]
