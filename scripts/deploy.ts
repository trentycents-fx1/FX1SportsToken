import { ethers } from "hardhat";
import { verifyContract } from "./verify";

const BuyFee = { marketingFeeRate: 50, liquidityFeeRate: 0 };
const SellFee = { marketingFeeRate: 50, liquidityFeeRate: 0 };
const Params = {
  marketingTaxRecv: "",
  dexRouter: "",
  whitelistPeriod: 300,
};

async function main() {
  const FX1_SPORTS_TOKEN = await ethers.getContractFactory("FX1SportsToken");
  const fx1SportsContract = await FX1_SPORTS_TOKEN.deploy(
    BuyFee,
    SellFee,
    Params
  );

  await fx1SportsContract.deployed();

  console.log("FX1SportsToken deployed to:", fx1SportsContract.address);

  try {
    await verifyContract(fx1SportsContract.address, [BuyFee, SellFee, Params]);
  } catch (error) {
    console.log(error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
