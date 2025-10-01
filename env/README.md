# Environment Files

```
env/
  shared/.env.example        # exported globally (copy to env/shared/.env)
  auth/.env.example          # per-service overrides (copy to env/auth/.env)
  orchestrator/.env.example  # orchestrator overrides (copy to env/orchestrator/.env)
  llm-proxy/.env.example     # llm proxy overrides (copy to env/llm-proxy/.env)
  mock/.env.example          # mock server overrides (copy to env/mock/.env)
```

Usage pattern:

```bash
cp env/shared/.env.example env/shared/.env
cp env/auth/.env.example env/auth/.env
cp env/orchestrator/.env.example env/orchestrator/.env
cp env/llm-proxy/.env.example env/llm-proxy/.env
cp env/mock/.env.example env/mock/.env

# Option A: symlink into each service the config it expects
ln -sf ../../env/auth/.env microservices/auth/.env
ln -sf ../../env/orchestrator/.env microservices/orchestrator/.env
ln -sf ../../env/llm-proxy/.env microservices/llm-proxy/.env

# Option B: load them in your shell before starting services
set -a && source env/shared/.env && source env/auth/.env && set +a
```

Keep the real `.env` files untracked; adjust the `.example` files if defaults change so everyone stays in sync.
