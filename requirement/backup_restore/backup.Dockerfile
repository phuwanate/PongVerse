FROM busybox:1.36.1

WORKDIR /

CMD ["tar", "cvf",  "/backup/backup.tar", "/data"]