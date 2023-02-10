# Pass Card 

Try running some of the following tasks:

```shell
npx hardhat help

npx hardhat test

REPORT_GAS=true npx hardhat test

# for test
npx hardhat run ./scripts/merkle.js

# deploy
npx hardhat node
npx hardhat run ./scripts/deploy.nft.js --network localhost
npx hardhat run ./scripts/deploy.escrow.js --network localhost
npx hardhat run ./scripts/deploy.vault.js --network localhost
npx hardhat run ./scripts/deploy.init.js --network localhost
 
npx hardhat run ./scripts/deploy.nft.js --network goerli
npx hardhat run ./scripts/deploy.escrow.js --network goerli
npx hardhat run ./scripts/deploy.vault.js --network goerli
npx hardhat run ./scripts/deploy.init.js --network goerli

```
