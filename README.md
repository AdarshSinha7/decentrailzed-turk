# Turkify — Decentralized Data Labeling Platform

A crowdsourced image labeling platform with **Solana blockchain micropayments**. Users post labeling tasks (paid in SOL), workers label images and get paid instantly — no middlemen, no delays.

> Built with Node.js · Express · PostgreSQL · Prisma · AWS S3 · Solana

---

## How It Works

1. **User** uploads images and pays 0.1 SOL → task is created
2. **Workers** label the images via the worker frontend
3. Labels are aggregated by consensus (60% threshold)
4. **Workers get paid automatically** in SOL upon task completion (~8s settlement)

---

## Tech Stack

- **Backend** — Node.js, Express.js, TypeScript
- **Database** — PostgreSQL + Prisma ORM (hosted on Neon DB)
- **Storage** — AWS S3 + CloudFront (via pre-signed URLs)
- **Blockchain** — Solana (Phantom Wallet, Alchemy RPC)
- **Deployment** — AWS EC2, NGINX, Docker

---

## Getting Started

### Prerequisites
- Node.js v18+
- PostgreSQL or [Neon DB](https://neon.tech) account
- AWS S3 bucket
- Solana wallet + [Alchemy](https://www.alchemy.com) RPC URL

### Setup

```bash
git clone https://github.com/your-username/turkify.git
cd turkify/backend
npm install
```

Create a `.env` file:

```env
DATABASE_URL=postgresql://user:password@host/dbname
JWT_SECRET=your_jwt_secret

AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_BUCKET_NAME=your_bucket
AWS_REGION=ap-southeast-2

PARENT_WALLET_ADDRESS=your_solana_wallet_pubkey
PARENT_WALLET_PRIVATE_KEY=your_solana_wallet_privkey
RPC_URL=https://solana-devnet.g.alchemy.com/v2/your_api_key
```

```bash
npx prisma migrate dev
npm run dev       # runs on port 3001
```

---

## API Endpoints

### User
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/v1/user/signin` | Sign in with Solana wallet signature |
| GET | `/v1/user/presignedUrl` | Get S3 pre-signed URL for image upload |
| POST | `/v1/user/task` | Create a task (verifies on-chain payment) |
| GET | `/v1/user/task?taskId=<id>` | Get task results and vote counts |

### Worker
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/v1/worker/signin` | Sign in with Solana wallet signature |
| GET | `/v1/worker/nextTask` | Fetch next available labeling task |
| POST | `/v1/worker/submission` | Submit a label for a task |
| GET | `/v1/worker/balance` | Check pending SOL earnings |
| POST | `/v1/worker/payout` | Withdraw SOL to worker's wallet |

All protected routes require a JWT in the `Authorization` header.

---

## Project Structure

```
backend/
├── src/
│   ├── routes/
│   │   ├── user.ts       # User endpoints
│   │   └── worker.ts     # Worker endpoints
│   ├── middleware/
│   │   └── auth.ts       # JWT auth middleware
│   └── index.ts          # Entry point
├── prisma/
│   └── schema.prisma     # DB schema
└── .env
```

---

## Deployment

```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Clone, configure .env, then:
npm install && npm run build && npm start
```

NGINX sits in front as a reverse proxy. Frontend is deployed separately on Vercel.

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWTs |
| `AWS_*` | S3 credentials and bucket name |
| `PARENT_WALLET_ADDRESS` | Platform's Solana wallet (holds funds) |
| `PARENT_WALLET_PRIVATE_KEY` | Used to sign payout transactions |
| `RPC_URL` | Solana RPC endpoint (Alchemy/Devnet) |

> ⚠️ Never commit your `.env`. Keep `PARENT_WALLET_PRIVATE_KEY` strictly on your server.

---

## License

Academic project — NERIST, Arunachal Pradesh, India.
