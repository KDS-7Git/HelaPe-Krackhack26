# HelaPe - Payment Streaming on Hela Chain

A decentralized payment streaming application built on the Hela blockchain, enabling continuous streams of ERC-20 token payments.


## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/KDS-7Git/HelaPe-Krackhack26.git
cd HelaPe-Krackhack26
```

### 2. Setup Blockchain Environment

Navigate to the blockchain directory and install dependencies:

```bash
cd blockchain
npm install
```

Create a `.env` file in the blockchain directory with your private key and RPC configuration:

```env
PRIVATE_KEY=0x<your_private_key>
HELA_RPC_URL=https://testnet-rpc.helachain.com
```

**How to get your private key:**
1. Install the MetaMask extension in your browser
2. Create and log into your MetaMask account
3. Click your account icon → Three dots menu → Account Details
4. Click "Export Private Key" and enter your password
5. Copy your Ethereum private key and paste it in the `.env` file (with `0x` prefix)

### 3. Deploy Smart Contracts

Open a new terminal and run:

```bash
cd blockchain
npx hardhat run scripts/deploy.ts --network hela
```

You should see output similar to:

```
MockHLUSD deployed to: 0x...
PayStream deployed to: 0x...
```

Save these contract addresses for the next step.

### 4. Configure Frontend Environment

In the `frontend` directory, create a `.env.local` file with the deployed contract addresses:

```env
NEXT_PUBLIC_PAYSTREAM_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_MOCK_TOKEN_ADDRESS=0x...
```

### 5. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 6. Start the Development Server

```bash
npm run dev
```

The web application will be available at `http://localhost:3000`


### 7. Using the HR and Employee Portal

##### HR:
- You need to connect wallet, mint required amount (If balance is zero) 
- Then Approve required Tokens (Enter the number in the monthly salary field)
- Then Create a stream by entering all the required details. (If you kept the date field blank then streaming will start 60 seconds later)
- You will get the stream in the active streams section

##### Employee:
- Connect your wallet and enter your Stream ID
- View your available balance (vested amount - withdrawn)
- Withdraw any amount up to your available balance
- Click "Add HLUSD to MetaMask" to see your token balance in your wallet
- Use "Convert HLUSD to Fiat Currency" to cash out (mock ramp service demonstration)

## Enhanced Features

### Tax Module ✅
The PayStream contract includes an automatic 10% tax deduction system:
- All withdrawals are subject to a 10% tax
- Tax is automatically sent to a designated Tax Vault address
- Employees receive 90% of withdrawn amount
- Tax calculations are transparent and shown in withdrawal confirmations

### Yield Earning 💰
**PayStreamEnhanced** contract includes yield accrual functionality:
- Unwithdawn salary earns **5% APY** while sitting in the vault
- Yield is calculated using simple interest on the remaining balance
- Automatically accrued on every withdrawal
- Benefits both employer and employee by growing the pool

### Performance Bonuses 🎉
Employers can add one-time bonus spikes:
- Add instant bonus payments to any active stream
- Specify bonus amount and reason
- Bonuses are immediately available for withdrawal
- Perfect for performance rewards, festival bonuses, or incentives

### Mock Ramp Service Integration 💱
Cash out feature for employees:
- Convert HLUSD to local fiat currency (USD, EUR, GBP, INR, JPY)
- Mock demonstration of off-ramp functionality
- In production, integrates with services like Transak, MoonPay, or Wyre
- Shows real-time exchange rates and bank transfer simulation

## Testing

Comprehensive test suite covering:
- ✅ Employee leaves mid-month (stream cancellation)
- ✅ Employer underfunds pool (withdrawal limits)
- ✅ Multiple withdrawals (tracking accuracy)
- ✅ Pause/resume abuse prevention
- ✅ Long inactivity handling
- ✅ Tax calculation verification

Run tests:
```bash
cd blockchain
npx hardhat test
```

All 13 tests passing ✅

## Smart Contract Architecture

### PayStream.sol (Production)
Basic streaming with tax module:
- Real-time salary streaming
- 10% automatic tax deduction
- Pause/resume functionality
- Stream cancellation with refunds

### PayStreamEnhanced.sol (Advanced)
Extended features:
- All PayStream.sol features
- 5% APY yield earning
- Performance bonus spikes
- Enhanced balance tracking
- Yield calculation on withdrawal

## Project Structure

- `blockchain/` - Smart contracts built with Hardhat
  - `contracts/PayStream.sol` - Production contract with tax module
  - `contracts/PayStreamEnhanced.sol` - Advanced contract with yield & bonuses
  - `test/PayStream.test.ts` - Comprehensive test suite
- `frontend/` - Next.js frontend application
  - `src/app/employee/` - Employee dashboard
  - `src/app/hr/` - HR/Employer portal
  - `src/components/MockRampService.tsx` - Fiat conversion demo


