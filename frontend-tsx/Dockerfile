FROM node:current-alpine

WORKDIR /app

COPY . .

RUN npm ci
RUN npm run build

EXPOSE 5174

CMD ["npm", "run", "preview", "--", "--host", "--port", "5174"]