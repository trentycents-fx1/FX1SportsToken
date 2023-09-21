# FX1 Sports Smart Contracts

## Set up the development environment

- Install the latest version of VS Code
- Install the latest version of Yarn
- Install the latest version of Node.js version

# Technical stack

- Solidity
- Hardhat
- @openzeppelin/contracts 4.6.0
- Solidity-coverage
- TypeScript

# FX1 Sports Token

`File`: FX1SportsToken.sol

`Name`: FX1 Sports

`Symbol`: FX1

`Total Supply`: 300_000_000

`Info`: The FX1 Sports Token contract is designed to implement an ERC-20 compliant token with enhanced functionalities tailored for a specific ecosystem, potentially in the realm of sports. The contract aims to provide features like automated liquidity provisioning, customizable fee rates, whitelisting, and controlled token transfer mechanics.

# Run environment

Clone the repository and run the `yarn` command to install all dependencies.

# Run unit test

run this command in terminal

```bash
npx hardhat test
```

# Run coverage

run this command in terminal

```bash
yarn coverage
```

# Running Deployments

**Example Rinkeby:**

```bash
yarn deploy:rinkeby
```

# Other commands that can be executed

see [hardhatDocs](https://hardhat.org/hardhat-runner/docs/getting-started#overview)

---

# Contract Overview

# Constructor Initialization:

Upon deployment, the contract's constructor initializes various parameters that shape the token's behavior. These parameters include fee rates for buying and selling, maximum transfer amounts, maximum wallet amounts, marketing tax recipient, whitelist period, and Uniswap router address.

# Ownership:

The contract inherits from the OpenZeppelin Ownable contract, which means the deployer of the contract has special privileges, including the ability to modify certain contract parameters and perform administrative functions.

# Whitelisting and Bot Management:

The contract supports whitelisting to allow or disallow specific addresses to perform transfers during a specific period after the contract's launch. Additionally, there's a mechanism to mark addresses as bots, preventing them from executing certain functions.

# Maximum Transfer Limits:

The contract enforces maximum transfer limits per transaction and wallet, except for excluded addresses. Excluded addresses, such as the contract itself, the Uniswap pair, and the contract owner, are not subject to these limits.

# Fee Rates and Taxation:

The contract implements a fee mechanism where fees are applied to both buy and sell transactions. The cumulative fee rate consists of marketing and liquidity fees. Marketing fees are collected to fund marketing initiatives, while liquidity fees contribute to liquidity pools on decentralized exchanges.

# Automated Liquidity Provisioning:

The contract automatically accumulates a portion of tokens to be used for liquidity provisioning on decentralized exchanges, such as Uniswap. Excess tokens are periodically swapped for ETH, and a portion of ETH is used to provide liquidity on a designated trading pair.

# Token Swapping:

Tokens are automatically swapped for ETH to provide liquidity and fund marketing efforts. Swapping thresholds trigger the swapping process to occur when a certain amount of tokens are accumulated in the contract.

# Fee Distribution:

The contract's fee distribution mechanism ensures that marketing and liquidity fees are properly allocated and reserved in separate accumulators. These accumulators are later used for liquidity provisioning and marketing initiatives.

# Transfer Logic:

The contract's internal transfer logic takes into account the sender's and recipient's addresses, transfer amounts, fee rates, and launch time to determine how the transfer should be processed. Transactions from and to the Uniswap pair trigger specific transfer processes to apply the appropriate fee rates.

# Conclusion:

The FX1 Sports Token contract provides a feature-rich token that goes beyond the standard ERC-20 implementation. It offers automated liquidity provisioning, fee distribution, whitelisting, and controlled transfer mechanics, making it suitable for ecosystem-specific applications, particularly in the sports domain. This contract's logic aims to balance functionality, security, and flexibility to support the growth and sustainability of the associated ecosystem.
