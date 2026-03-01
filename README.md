# NestJS Assessment — Ethereum Trading APIs

This project implements a lightweight backend service built with **NestJS** that provides:

- Ethereum gas price information
- Uniswap V2 off-chain swap estimation

The application demonstrates clean architecture, dependency injection, and off-chain blockchain computation using ethers.js.

---

## Features

### 1️⃣ Gas Price API

**Endpoint**
GET /gasPrice

Returns the latest Ethereum gas price.

#### Design
- Gas price is fetched from Ethereum RPC in the background.
- Values are cached in memory.
- API responses are served instantly (<50ms).
- Prevents RPC calls per request.

---

### 2️⃣ Uniswap V2 Quote API

**Endpoint**
GET /return/:fromTokenAddress/:toTokenAddress/:amountIn

Returns an estimated output amount for an exact input swap.

#### Important Constraints (as required)
- ❌ No on-chain pricing helpers used (`getAmountsOut` not used)
- ✅ Only metadata fetched:
  - pair address
  - reserves
  - token decimals
- ✅ Swap math implemented off-chain using Uniswap V2 formula

---
