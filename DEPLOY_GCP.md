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

## 2. Firewall — allow HTTP

```bash
gcloud compute firewall-rules create allow-http \
  --allow=tcp:80 --target-tags=http-server --direction=INGRESS
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
- `SMARTAGRI_CORS_ORIGINS` — set to `http://<VM_EXTERNAL_IP>` (get the IP from
  `gcloud compute instances describe smartagri-vm --zone=us-central1-a --format='get(networkInterfaces[0].accessConfigs[0].natIP)'`)
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

## 7. Build and run

```bash
docker compose up -d --build
```

First build will take a while (installs xgboost/sklearn, builds frontend). Watch it:

```bash
docker compose logs -f
```

## 8. Verify

Open `http://<VM_EXTERNAL_IP>` in a browser. Log in with the admin account
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

- Uploaded marketplace images live in `backend/uploads/` on the VM's local disk — fine
  as long as the VM isn't recreated, but not durable storage.
- No HTTPS/TLS — fine for a demo over plain HTTP via IP address. For a real domain +
  HTTPS you'd add Caddy/certbot in front of nginx, which is more setup than needed here.
- Single VM is a single point of failure — acceptable for a scheduled demo, not for
  always-on production use.
