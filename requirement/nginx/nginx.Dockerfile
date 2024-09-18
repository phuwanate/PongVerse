FROM nginx:1.27

COPY nginx-entrypoint.sh /

COPY nginx.conf /etc/nginx/conf.d/default.conf

WORKDIR /

RUN apt update

RUN apt install -y openssl

RUN chmod +x nginx-entrypoint.sh

ENTRYPOINT [ "/nginx-entrypoint.sh" ]