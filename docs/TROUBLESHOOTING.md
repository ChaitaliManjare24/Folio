## Troubleshooting

### Containers won't start

```bash
# Check logs
docker compose logs backend
docker compose logs frontend
docker compose logs mcp-server

# Restart everything
docker compose restart
```

### Database issues

```bash
# Reset database completely (WARNING: deletes all data)
docker compose down -v
docker compose up -d --build

# Check database connection
docker compose exec db pg_isready -U SimpleAIFolio
```

### MCP server not responding

```bash
# Check health
curl http://localhost:3100/health

# Check logs
docker compose logs mcp-server

# Verify API key is generated
docker compose exec backend curl -s http://localhost:3001/api/mcp-config
```

### Admin login doesn't work

The admin account is created on first startup from your `.env` file. If you changed `SEED_ADMIN_EMAIL` or `SEED_ADMIN_PASSWORD` after the first run:

```bash
# Reset everything and start fresh
docker compose down -v
docker compose up -d --build
```

### Port already in use

Edit `docker-compose.yml` and change the port mappings:
```yaml
ports:
  - "3300:3000"  # Change 3300 to any available port
```

### AI Blog Studio shows "not configured"

Go to **Admin > Settings > Site Wide > AI Configuration** and enter your OpenAI-compatible API details. The AI features are disabled by default.

---

## License

[MIT](./LICENSE) — Free to use, modify, and distribute.
