FROM busybox:1.36.1

WORKDIR /

CMD ["tar", "xvf",  "/backup/backup.tar", "-C", "/data"]