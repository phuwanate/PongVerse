# PongVerse Architecture 🏓
<p align="center">
  <img src="https://github.com/user-attachments/assets/eb963901-8073-4c6d-8b48-817dbd655fdd" alt="8443 drawio">
<p>

# Usage 📙
## How to start program
To `startup` the server
```
>$ make
```
To `backup` the Docker volume
```
>$ make backup_volume
```
To `restore` the Docker volume
```
>$ make restore_volume
```
To `stop` all containers
```
>$ make down
```

## To open the web application
```
https://<your-domain>:8443/
```

## ENV File
```
#For django app settings
REDIRECT_URI = xxxxxxxxxx
AUTHORIZATION_URL = xxxxxxxxxx
TOKEN_URL = xxxxxxxxxx
PROFILE_URL = xxxxxxxxxx
EMAIL_HOST_USER = xxxxxxxxxx

#For postgreSQL and pgadmin4 settings
PGADMIN_DEFAULT_EMAIL = xxxxxxxxxx
POSTGRES_DJANGO_USER = xxxxxxxxxx
POSTGRES_DB = xxxxxxxxxx
DJANGO_DB_HOST = xxxxxxxxxx
DJANGO_DB_PORT = xxxxxxxxxx
```

## Credentials
- `client_id.txt` - Your app client_id
- `client_secret.txt` - Your app client_secret
- `email_host_pwd.txt` - Your email address
- `pgadmin4_pwd.txt` - Your pgadmin4 password
- `postgres_pwd.txt` - Your postgreSQL password
- `secret_key.txt` - Your django secret_key

## Please Note
In `requirement/django` you should have:
- `backup/` repository for backup the Docker volume
- `credentials/` repository for storing all credential files.
- `.env` file
