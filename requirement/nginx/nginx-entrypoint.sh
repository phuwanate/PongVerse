#!/bin/bash

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -out /etc/ssl/transcendence.42.fr.crt \
    -keyout /etc/ssl/transcendence.42.fr.key \
    -subj "/C=TH/ST=BKK/L=BKK/O=42 School/OU=42/CN=transcendence.42.fr/UID=transcendence"

nginx -g "daemon off;"