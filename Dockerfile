FROM node:18.20.7-bookworm

WORKDIR /app

COPY package*.json ./

# Остальные зависимости
RUN npm install

COPY . .
RUN npm run build

RUN rm -rf src

# Права на данные
RUN mkdir -p /app/dist/database/db && chown -R node:node /app/dist/database/db
RUN mkdir -p /app/dist/memes

USER node
CMD ["npm", "run", "start:prod"]