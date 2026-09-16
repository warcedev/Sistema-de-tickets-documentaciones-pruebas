.PHONY: start stop restart build logs shell

start:
	docker-compose up -d

stop:
	docker-compose down

restart:
	docker-compose down && docker-compose up -d

build:
	docker-compose up -d --build

logs:
	docker-compose logs -f

shell:
	docker exec -it docuweb-app bash