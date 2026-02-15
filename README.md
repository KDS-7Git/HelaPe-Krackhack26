# HelaPe - Payment Streaming on Hela Chain

A decentralized payment streaming application built on the Hela blockchain, enabling continuous streams of ERC-20 token payments.

### 1.Clone the Repository

```bash
git clone https://github.com/KDS-7Git/HelaPe-Krackhack26.git
cd HelaPe-Krackhack26
```

### 2.Setup Blockchain Environment
Go to the blockchain directory and install dependencies:

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
5. Copy your Ethereum private key and paste it in the `.env` file(with `0x` prefix)

### 3.Compile Smart Contracts
Open new terminal and run:

```bash
cd blockchain
npx hardhat run scripts/deploy.ts --network hela
```

You should see output like:
```
MockHLUSD deployed to: 0x...
PayStream deployed to: 0x...
```

make sure you save these contract addresses for the next step.

### 4.Configure Frontend Environment

In the `frontend` directory,create a `.env.local` file with the deployed contract addresses:

```env
NEXT_PUBLIC_PAYSTREAM_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_MOCK_TOKEN_ADDRESS=0x...
```

### 5.Installing Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 6.Execute

```bash
npm run dev
```
The web application will be available at `http://localhost:3000`
### 7.Using the HR and employee Portal

##### HR:
- You need to connect wallet, mint required amount (If balance is zero) 
- Then Approve required Tokens (Enter the number in the montly salary field)
- Then Create a stream by entering all the required details. (If you kept the date field blank then streaming will start 60 seconds later)
- You will get the stream in the active streams section

##### Employee:
 - Just connect your wallet
 - Enter the stream id provided by your employer
 - You will be able to see your stream details and the amount you can withdraw increasing every second.



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
- Click "Add HLUSD to Wallet" to see your token balance in your wallet
- Use "Convert HLUSD to your Currency" to cash out 
