#!/bin/bash

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -out /etc/ssl/pongverse.42.fr.crt \
    -keyout /etc/ssl/pongverse.42.fr.key \
    -subj "/C=TH/ST=BKK/L=BKK/O=42 School/OU=42/CN=pongverse.42.fr/UID=pongverse"

nginx -g "daemon off;"