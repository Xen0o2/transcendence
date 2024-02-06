FROM alpine:latest

RUN apk update && \
    apk upgrade && \
    apk add nodejs npm && \
    apk add postgresql

RUN mkdir /backend; \
    chmod +rwx /backend
WORKDIR /backend
COPY . .

COPY ./start.sh /start.sh
RUN chmod +x /start.sh

RUN npm install; \
    npm install @prisma/client; \
    npx prisma generate; \
    apk add doas; \
    adduser kogbebou -G wheel; \
    echo 'kogbeboulebest' | chpasswd; \
    echo 'permit :wheel as root' > /etc/doas.d/doas.conf

CMD ["sh", "/start.sh"]
