# Deploying SmartAgri to Google Cloud (single VM, docker-compose)

Simplest path for a demo: one Compute Engine VM runs the existing `docker-compose.yml`
as-is (Postgres + backend + ml + nginx/frontend, all on port 80).

Run all commands below in **Cloud Shell** (console.cloud.google.com → Activate Cloud Shell,
top right). It's browser-based and already has `gcloud` authenticated — no local install needed.

## 1. One-time project setup

```bash
gcloud config set project YOUR_PROJECT_ID   # or create one first: gcloud projects create
gcloud services enable compute.googleapis.com
```

## 2. Firewall — allow HTTP and HTTPS

```bash
gcloud compute firewall-rules create allow-http-https \
  --allow=tcp:80,tcp:443 --target-tags=http-server --direction=INGRESS
```

## 3. Create the VM

8GB RAM minimum — the ML service loads two model files (~1.3GB combined) fully into
memory at startup, plus Postgres + backend + nginx running alongside it.

```bash
gcloud compute instances create smartagri-vm \
  --zone=us-central1-a \
  --machine-type=e2-standard-2 \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=30GB \
  --tags=http-server
```

## 4. SSH in and install Docker

```bash
gcloud compute ssh smartagri-vm --zone=us-central1-a
```

Then, on the VM:

```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-plugin git
sudo usermod -aG docker $USER
newgrp docker
```

## 5. Get the code onto the VM

```bash
git clone https://github.com/Ravindu08/SmartAgri.git
cd SmartAgri
git checkout Induwara
```

## 6. Set real secrets (these are gitignored, so they don't come from the clone)

```bash
nano backend/.env.docker
```

Set at minimum:
- `SECRET_KEY` — generate with `python3 -c "import secrets; print(secrets.token_hex(32))"`
- `SMARTAGRI_CORS_ORIGINS` — set to your HTTPS domain, e.g. `https://smartagri-demo.duckdns.org`
  (see step 6a below for pointing a free domain at the VM; `frontend/nginx.conf` is hard-coded
  to redirect the bare IP and plain HTTP to this domain, so the app won't work over `http://<IP>` alone)
- SMTP_* — only if you want real password-reset emails to send during the demo;
  otherwise leave `EMAIL_ENABLED=false`
- **Do not reuse the SMTP app password found in your local `backend/.env`** — generate
  a fresh Gmail App Password for this if you want email working, since the old one
  has been sitting in plaintext locally.

Also set a real Postgres password:

```bash
export POSTGRES_PASSWORD=$(python3 -c "import secrets; print(secrets.token_hex(16))")
echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD" >> .env
```

(docker-compose.yml reads `POSTGRES_PASSWORD` from a root `.env` file automatically.)

## 6a. Point a free domain at the VM and get an HTTPS certificate

`frontend/nginx.conf` is checked in with `server_name smartagri-demo.duckdns.org` and expects a
cert at `/etc/letsencrypt/live/smartagri-demo.duckdns.org/`. To reuse it as-is, register that
exact free subdomain at [duckdns.org](https://www.duckdns.org) and point it at the VM's external
IP (duckdns.org's dashboard has an "update IP" field — paste the VM's external IP from step 3/4).
For a different domain, edit `server_name` and the cert paths in `frontend/nginx.conf` to match
before building.

Then, on the VM, get a cert with certbot in standalone mode (port 80 must be free — stop the
compose stack first if it's already running):

```bash
sudo apt-get install -y certbot
sudo systemctl stop nginx 2>/dev/null  # only if a host nginx happens to be running
docker compose down 2>/dev/null        # free port 80 if the stack is already up
sudo certbot certonly --standalone -d smartagri-demo.duckdns.org
```

This writes the cert to `/etc/letsencrypt/live/smartagri-demo.duckdns.org/`, which
`docker-compose.yml` mounts read-only into the `frontend` container. Certbot installs a systemd
timer that renews automatically before expiry — no manual renewal needed.

## 7. Build and run

```bash
docker compose up -d --build
```

First build will take a while (installs xgboost/sklearn, builds frontend). Watch it:

```bash
docker compose logs -f
```

## 8. Verify

Open `https://smartagri-demo.duckdns.org` (or your own domain) in a browser — the bare IP and
plain `http://` both redirect there automatically. Log in with the admin account
(`admin@smartagri.lk` / `Admin@12345`) or one of the test accounts.

## 9. After the demo — stop billing

```bash
gcloud compute instances stop smartagri-vm --zone=us-central1-a
# or delete entirely when done:
gcloud compute instances delete smartagri-vm --zone=us-central1-a
```

A stopped VM doesn't charge for compute, only the small disk-storage cost. Delete it
once you're fully done to avoid any charges.

## Known limitations (acceptable for a demo, not for real production)

- Uploaded images (profile/marketplace/task photos) persist across redeploys via a named
  Docker volume (`uploads`, mounted by both `backend` and `ml`), but they still live on the
  single VM's disk — fine as long as the VM isn't deleted, but not off-host durable storage
  (e.g. Cloud Storage/S3).
- HTTPS is handled by a single certbot-issued Let's Encrypt cert for one free DuckDNS domain
  (see step 6a) — fine for a demo, but a real production domain would want a proper DNS
  provider and likely a load balancer terminating TLS instead of nginx doing it directly.
- Single VM is a single point of failure — acceptable for a scheduled demo, not for
  always-on production use.
