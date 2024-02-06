FROM alpine:latest

RUN apk update &&\
    apk upgrade &&\
    apk add nodejs npm

RUN mkdir /backend; \
    chmod +rwx /backend
WORKDIR /backend
COPY . .

RUN npm install

CMD ["npm", "start"]
