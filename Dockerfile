FROM node:20

WORKDIR /app

COPY package.json package-lock.json* ./
RUN node -e "require('./package.json'); console.log('package.json OK')" \
 && npm install

COPY . .

RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
