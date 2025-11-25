# The Shadow Realm

The shadow trader.

```bash
docker compose up --build
```

```bash
# Remove everything: containers, networks, images, volumes, build cache
# IMPORTANT: This will also remove everything from other projects
docker system prune -a --volumes
```

## Run separately

**Start the backend server:**

```bash
cd src
python main.py
```

**Start the frontend dashboard:**

```bash
cd web
npm install
npm run dev
```
