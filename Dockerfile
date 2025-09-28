FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache \
    ffmpeg \
    python3 \
    make \
    g++

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
