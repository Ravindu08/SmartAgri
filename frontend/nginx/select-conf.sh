#!/bin/sh
# Runs before the nginx image's own template step (20-envsubst-on-templates.sh)
# and picks which server config that step renders.
set -e

mode=http
if [ -n "${DOMAIN:-}" ] && [ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
    mode=https
fi

mkdir -p /etc/nginx/templates
cp "/etc/nginx/smartagri/${mode}.conf.template" /etc/nginx/templates/default.conf.template
echo "smartagri: serving in ${mode} mode${DOMAIN:+ for ${DOMAIN}}"
