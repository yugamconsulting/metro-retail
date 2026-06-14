# MRT Production Deployment Guide (PHP & MySQL Edition)

This guide explains how to host the **Metro Retail and Trade** platform on a standard cPanel or Shared Hosting environment.

## 1. Prerequisites
*   A domain or subdomain (e.g., `orders.metroretailtrade.com`).
*   A standard hosting plan (cPanel, Hostinger, Bluehost, etc.).
*   PHP 7.4 or 8.x and a MySQL database.

## 2. Database Setup
1.  Log in to your **cPanel**.
2.  Open **MySQL Database Wizard**.
3.  Create a database named `mrt_wholesale`.
4.  Create a user, assign a password, and give it "ALL PRIVILEGES".
5.  Go to **phpMyAdmin**, select your database, and click **Import**.
6.  Upload the `api/database.sql` file provided in this project.

## 3. Backend Deployment (PHP)
1.  Locate the `api/` folder in this project.
2.  Open `api/config.php` and update the `$host`, `$db_name`, `$username`, and `$password` with the credentials from Step 2.
3.  Upload the entire contents of the `api/` folder to your server into a folder named `api`.
    *   Path: `yourdomain.com/api/`

## 4. Frontend Deployment (React)
1.  Open `src/api/client.ts` in your code.
2.  Ensure `API_BASE_URL` points to your new PHP api:
    `const API_BASE_URL = 'https://orders.yourdomain.com/api';`
3.  Build the project locally:
    ```bash
    npm run build
    ```
4.  Upload everything inside the `dist/` folder to your subdomain's **public_html** or root folder.

## 5. Subdomain Configuration
If using cPanel, create a subdomain `orders` and set the Document Root to where you uploaded the `dist` files.

## 6. SSL Security (Mandatory)
Ensure **AutoSSL** or **Let's Encrypt** is active. The MRT "Copy" and "WhatsApp Share" features will only function over `https://`.

---
**Metro Retail and Trade: High-Performance Wholesale, Low-Cost Infrastructure.**
