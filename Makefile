.PHONY: up down logs ps tree status

up:
	docker compose -f services/auth/docker-compose.yml up -d || true
	docker compose -f microservices/infra/gateway/docker-compose.yml up -d || true

down:
	docker compose -f microservices/infra/gateway/docker-compose.yml down || true
	docker compose -f services/auth/docker-compose.yml down || true

logs:
	docker compose -f services/auth/docker-compose.yml logs -f --tail 100 | cat

ps:
	docker ps | cat

tree:
	command -v tree >/dev/null 2>&1 && tree -L 3 -I 'node_modules|dist|coverage|.git' || find . -maxdepth 3 -not -path '*/\.*' | sed 's|^\./||' | sort | head -n 400 | cat

status:
	git status | cat
