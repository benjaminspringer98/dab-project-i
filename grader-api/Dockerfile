FROM lukechannings/deno:v1.32.1

EXPOSE 7000

WORKDIR /app

#RUN apk add --update docker openrc
RUN apt-get update

RUN apt update --fix-missing 
RUN apt upgrade -y

RUN apt install docker.io -y

#RUN rc-update add docker boot

RUN addgroup deno docker

COPY deps.js .

RUN deno cache deps.js

COPY . .

CMD [ "run", "--watch", "--unstable", "--allow-all", "app.js" ]