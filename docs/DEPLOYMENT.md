# Deployment Guide for UCR HousingConnect

This guide walks through the steps to deploy the UCR HousingConnect application to a production server.

## Prerequisites

- A Linux server (Ubuntu 20.04 LTS or later recommended)
- Python 3.8+ installed
- PostgreSQL database server
- Nginx web server
- Domain name with DNS configured to point to your server
- SSL certificate (Let's Encrypt recommended)

## 1. Server Setup

### Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

### Install Required Packages

```bash
sudo apt install -y python3-pip python3-dev python3-venv libpq-dev nginx certbot python3-certbot-nginx
```

### Set Up PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo -u postgres psql -c "CREATE DATABASE ucrhousing;"
sudo -u postgres psql -c "CREATE USER ucrhousinguser WITH PASSWORD 'secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ucrhousing TO ucrhousinguser;"
```

## 2. Application Setup

### Clone the Repository

```bash
cd /var/www
sudo git clone https://github.com/yourusername/ucrhousing.git
sudo chown -R $USER:$USER /var/www/ucrhousing
```

### Set Up Python Environment

```bash
cd /var/www/ucrhousing
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### Configure Environment Variables

Create a `.env` file based on the example:

```bash
cp env.example .env
nano .env
```

Edit the file to set proper values for all variables, particularly:

- `SECRET_KEY`: Generate a strong random key
- `DATABASE_URL`: Set to your PostgreSQL connection string
- `GOOGLE_MAPS_API_KEY`: Your Google Maps API key
- `SENTRY_DSN`: Your Sentry DSN for error monitoring (optional)

### Download NLTK Data

Run the NLTK data download script:

```bash
python download_nltk_data.py
```

### Set Up the PostgreSQL Database

```bash
python setup_postgres.py
```

This will create the database tables and add the initial data.

## 3. Configure Web Server

### Set Up Systemd Service

Create a systemd service file:

```bash
sudo nano /etc/systemd/system/ucrhousing.service
```

Add the following configuration:

```ini
[Unit]
Description=UCR HousingConnect Gunicorn Service
After=network.target postgresql.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/ucrhousing
Environment="PATH=/var/www/ucrhousing/venv/bin"
EnvironmentFile=/var/www/ucrhousing/.env
ExecStart=/var/www/ucrhousing/venv/bin/python production.py
Restart=always
RestartSec=5
SyslogIdentifier=ucrhousing

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl enable ucrhousing
sudo systemctl start ucrhousing
sudo systemctl status ucrhousing
```

### Configure Nginx

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/ucrhousing
```

Customize the example configuration from `nginx.conf.example` and add it to this file, adjusting paths and domain names.

Create a symlink to enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/ucrhousing /etc/nginx/sites-enabled
sudo nginx -t
sudo systemctl restart nginx
```

### Set Up SSL with Let's Encrypt

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Set Permissions

```bash
sudo chown -R www-data:www-data /var/www/ucrhousing
sudo chmod -R 755 /var/www/ucrhousing
```

## 4. Maintenance and Updates

### Updating the Application

```bash
cd /var/www/ucrhousing
sudo git pull
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart ucrhousing
```

### Database Backups

Set up automatic daily backups:

```bash
sudo nano /etc/cron.daily/backup-ucrhousing
```

Add the following script:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/ucrhousing"
DATETIME=$(date +%Y%m%d_%H%M%S)
FILENAME="ucrhousing_$DATETIME.sql"

mkdir -p $BACKUP_DIR
sudo -u postgres pg_dump ucrhousing > $BACKUP_DIR/$FILENAME
gzip $BACKUP_DIR/$FILENAME

# Keep only the last 14 backups
find $BACKUP_DIR -type f -name "ucrhousing_*.sql.gz" -mtime +14 -delete
```

Make the script executable:

```bash
sudo chmod +x /etc/cron.daily/backup-ucrhousing
```

## 5. Monitoring and Logging

### Accessing Logs

Application logs:

```bash
sudo journalctl -u ucrhousing
```

Nginx logs:

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Setting Up Monitoring (Optional)

For more advanced monitoring, consider setting up:

- Prometheus for metrics collection
- Grafana for visualization
- Sentry for error tracking (already integrated in the app code)

## Troubleshooting

### Application Won't Start

1. Check the logs: `sudo journalctl -u ucrhousing`
2. Verify the `.env` file has correct values
3. Check database connection: `psql -U ucrhousinguser -h localhost -d ucrhousing`

### Web Server Issues

1. Check Nginx configuration: `sudo nginx -t`
2. Verify Nginx is running: `sudo systemctl status nginx`
3. Check if Gunicorn is accessible: `curl http://localhost:8000/ping`

### SSL Certificate Issues

1. Check certificate status: `sudo certbot certificates`
2. Renew certificates: `sudo certbot renew --dry-run`
