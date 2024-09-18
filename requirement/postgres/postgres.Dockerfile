FROM postgres:16.4

COPY init_db.sh /docker-entrypoint-initdb.d/

COPY postgres_entrypoint.sh /

RUN chmod +x postgres_entrypoint.sh

WORKDIR /

ENTRYPOINT [ "/postgres_entrypoint.sh" ]

EXPOSE 5432