# Oracle Cloud SMTP Server Setup

## 1. Create Always Free ARM VM

1. Sign up at https://cloud.oracle.com (free tier, credit card for verification only)
2. Create a Compute Instance:
   - Shape: `VM.Standard.A1.Flex` (1 OCPU, 6 GB RAM)
   - OS: Ubuntu 24.04
   - SSH key: Add your public key
3. Note the **Public IP Address**

## 2. Open Port 2525

1. Go to Networking > Virtual Cloud Networks > your VCN > Security Lists
2. Add Ingress Rule:
   - Source CIDR: `0.0.0.0/0`
   - Protocol: TCP
   - Destination Port: `2525`
3. Also open port `3001` for the health check (optional, can be internal only)

## 3. Install Node.js

```bash
ssh ubuntu@<PUBLIC_IP>

# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PM2
npm install -g pm2
```

## 4. Clone and Build

```bash
git clone <your-repo-url> ~/mailfail
cd ~/mailfail
pnpm install
cd apps/smtp
pnpm build
```

## 5. Environment Variables

```bash
cat > ~/mailfail/apps/smtp/.env << 'EOF'
DATABASE_URL=postgresql://...@...neon.tech/mailfail?sslmode=require
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...
SMTP_PORT=2525
HEALTH_PORT=3001
EOF
```

## 6. Start with PM2

```bash
cd ~/mailfail/apps/smtp
pm2 start dist/index.js --name mailfail-smtp
pm2 save
pm2 startup  # Follow the printed command to enable auto-start
```

## 7. Health Check Cron

Prevents Oracle from reclaiming idle instances (threshold: < 20% CPU/network/memory for 7 days).

```bash
crontab -e
# Add this line:
*/5 * * * * curl -s http://localhost:3001/health > /dev/null 2>&1
```

## 8. DNS Setup

Add an A record for your SMTP subdomain:

```
smtp.mailfail.dev  →  A  →  <ORACLE_VM_PUBLIC_IP>
```

## 9. Verify

```bash
# From your local machine, test SMTP connectivity:
telnet <PUBLIC_IP> 2525

# Or use swaks:
swaks --to test@example.com --from sender@test.com \
  --server <PUBLIC_IP>:2525 \
  --auth --auth-user <SMTP_USER> --auth-password <SMTP_PASS> \
  --header "Subject: Test" --body "Hello from MailFail"
```

## 10. Updates

```bash
cd ~/mailfail
git pull
cd apps/smtp
pnpm build
pm2 restart mailfail-smtp
```
