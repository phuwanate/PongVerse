all:
	docker compose -f docker-compose.yaml up

build:
	docker compose -f docker-compose.yaml up --build

down:
	docker compose -f docker-compose.yaml down

test:
	if [ -f requirement/django/app/uploads/avatars/test_avatar.jpg ]; then rm requirement/django/app/uploads/avatars/test_avatar.jpg; fi
	if [ -f requirement/django/app/uploads/avatars/test_avatar2.jpg ]; then rm requirement/django/app/uploads/avatars/test_avatar2.jpg; fi
	python3 requirement/django/app/manage.py test backend

# automate test with selenium
amt: close_auth
	rm -f ./requirement/django/app/db.sqlite3
	cp ./requirement/django/app/db.sqlite3.bk ./requirement/django/app/db.sqlite3
	rm -f requirement/django/app/uploads/avatars/*.webp
	docker compose -f docker-compose.yaml up -d
	sleep 2
	$(MAKE) -C selenium
	docker compose -f docker-compose.yaml down
	$(MAKE) open_auth

# automate test with selenuim use test when have database
amt1: close_auth
	docker compose -f docker-compose.yaml up -d
	sleep 2
	$(MAKE) -C selenium
	docker compose -f docker-compose.yaml down
	$(MAKE) open_auth

open_auth:
	sed -i '' -e 's/ALLOW_API_WITHOUT_AUTH = True/ALLOW_API_WITHOUT_AUTH = False/' \
	-e 's/ALLOW_API_WITHOUT_JWT = True/ALLOW_API_WITHOUT_JWT = False/' \
	./requirement/django/app/transcendence/settings.py

close_auth:
	sed -i '' -e 's/ALLOW_API_WITHOUT_AUTH = False/ALLOW_API_WITHOUT_AUTH = True/' \
	-e 's/ALLOW_API_WITHOUT_JWT = False/ALLOW_API_WITHOUT_JWT = True/' \
	./requirement/django/app/transcendence/settings.py

backup_volume:
	docker compose -f docker-compose-backup.yaml up backup-upload --build
	docker compose -f docker-compose-backup.yaml up backup --build
	docker compose -f docker-compose-backup.yaml down

restore_volume:
	docker compose -f docker-compose-backup.yaml up restore-upload --build
	docker compose -f docker-compose-backup.yaml up restore --build
	docker compose -f docker-compose-backup.yaml down