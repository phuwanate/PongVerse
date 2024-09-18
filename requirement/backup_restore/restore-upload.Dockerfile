FROM busybox:1.36.1

WORKDIR /usr/src/app/uploads/avatars

CMD ["tar", "xvf",  "/backup/backup-upload.tar", "-C", "."]