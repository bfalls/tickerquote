# TickerQuote: Low-Cost Real-Time Stock Strategy Analyzer

**TickerQuote** is a cost-efficient, real-time stock strategy platform built using AWS services, React/TypeScript, Python, and GitHub Actions. It provides fundamental screening and real-time price analysis of U.S. stocks, with a strong emphasis on security, automation, and minimal operating cost.

## Project Overview

The system is composed of three primary components:

1. **Frontend (stock-strategy-app)**  
   A React + TypeScript web application that:
   - Loads stock fundamentals from S3.
   - Filters stocks based on selected strategies.
   - Provides interactive analysis and data exploration.

2. **Lambda Backend Services**
   - `GetFundamentals`: Periodically pulls and stores comprehensive stock fundamentals (e.g., via Finnhub or similar APIs) into S3.
   - `EvaluateStockStrategy`: Applies logic to screen the current stocks against defined strategies.

3. **EC2 WebSocket Price Streamer**
   - A lightweight EC2 instance (Amazon Linux 2023, Free Tier) connects to the Twelve Data WebSocket API.
   - Streams live stock prices to clients.
   - Uses `systemd` and a custom service (`streamer.service`) to ensure the app is resilient and restartable.

## Security Architecture

- **Secrets Management**
  - All secrets used in the Lambda functions are stored in **AWS SSM Parameter Store (SecureString)**.
  - The EC2 instance also retrieves runtime secrets (like Dynu credentials) from SSM at launch.
  - GitHub Actions workflows use **GitHub Actions Secrets** for deployment authentication.

- **Client Isolation**
  - No secrets are ever exposed to the frontend client.
  - The website fetches public JSON files from S3 and receives live pricing from a public WebSocket hosted on the EC2 instance.

## GitHub Actions & CI/CD

- GitHub Actions is configured to:
  - Package and deploy the Lambda functions on every commit.
  - Build and upload the static frontend to S3 + CloudFront.
  - SSH into the EC2 instance (or use AWS Session Manager) to deploy or restart the streaming service.

- The deployment is fully automated and triggered by successful pushes to the `main` branch. This may be customized in the future as development workflows evolve.

## Dynamic DNS with Dynu & Zero Fixed IP Cost

- To avoid the cost of a static Elastic IP (EIP), the EC2 instance uses **Dynu Dynamic DNS**:
  - At boot, a script updates Dynu with the current public IP via a script.
  - A `stock-strategy.ddnsfree.com` hostname is maintained with Dynu and used for SSH and WebSocket connections.
  - Systemd runs this script before starting the streaming service, ensuring the IP is always current.

## Cost Optimization

This project was engineered to run **entirely within AWS Free Tier limits**:

- **Lambda**: Fully serverless and only invoked periodically.
- **S3 + CloudFront**: Used for serving the frontend and stock data, with caching enabled.
- **EC2**: Runs only during market hours via manual or scheduled automation.
- **No Elastic IP**: Dynamic DNS removes the need for a static IP.

## Strategy Logic

The stock strategy logic is written to be extensible and currently includes:

- Basic screeners using price-to-earnings ratios, earnings growth, and other fundamentals.
- Real-time validation with price feeds to determine if a stock is "in a good place to buy".

Strategy logic runs in both Lambda and browser (via filtered JSON), enabling rapid iteration and transparency.

## Directory Structure (Simplified)

```
tickerquote-main/
├── lambdas/
│   ├── EvaluateStockStrategy/
│   └── GetFundamentals/
├── stock-strategy-app/     # React + TypeScript client
├── ec2/
│   ├── stream_price_data_app.py
│   └── update_dynu_ip.sh
├── .github/workflows/
│   ├── deploy-frontend.yml
│   ├── deploy-lambdas.yml
│   └── deploy-ec2.yml
```

## Getting Started

To clone and deploy your own version:

```bash
git clone https://github.com/your-username/tickerquote.git
cd tickerquote
```

Ensure you configure:
- GitHub Secrets for deployment credentials.
- AWS SSM parameters for runtime secrets (`DYNU_USERNAME`, `DYNU_PASSWORD`, etc.).
- Optional: Set up Dynu Dynamic DNS account.

Then simply push changes to `main` and watch your infrastructure update itself.

## Credits

Created and maintained by Barnaby Falls.  
Built to maximize transparency, automation, and cost-efficiency.
