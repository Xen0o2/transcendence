FROM alpine:latest

RUN apk update &&\
    apk upgrade &&\
    apk add nodejs npm

COPY . .

RUN npm install

CMD ["npm", "start"]
