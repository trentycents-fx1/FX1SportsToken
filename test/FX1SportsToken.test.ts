import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { FX1SportsToken } from "../typechain-types";
import { routerAbiV2, wethAbi } from "./test_abis/abiRouter";
import {
  ROUTER_ADDRESS_V2,
  WETH_ADDRESS,
  ZERO_ADDRESS,
  MAX_UINT,
  ONE_HOUR,
} from "./constants";

describe("FX1SportsToken tests", () => {
  const BuyFee = {
    marketingFeeRate: 50,
    liquidityFeeRate: 0,
  };

  const SellFee = {
    marketingFeeRate: 50,
    liquidityFeeRate: 0,
  };

  let ownerAccount: SignerWithAddress;
  let accounts: SignerWithAddress[];
  let marketingAccount: SignerWithAddress;
  let swapRouterV2: any;
  let FX1Sports_Token: FX1SportsToken;
  let WETH_Token: any;

  before("Init test environment", async () => {
    [ownerAccount, marketingAccount, ...accounts] = await ethers.getSigners();
    swapRouterV2 = await ethers.getContractAt(routerAbiV2, ROUTER_ADDRESS_V2);
    WETH_Token = await ethers.getContractAt(wethAbi, WETH_ADDRESS);

    const Params = {
      marketingTaxRecv: marketingAccount.address,
      dexRouter: swapRouterV2.address,
      whitelistPeriod: ONE_HOUR,
    };
    const FX1SportsToken = await ethers.getContractFactory("FX1SportsToken");
    FX1Sports_Token = await FX1SportsToken.deploy(BuyFee, SellFee, Params);
    await FX1Sports_Token.deployed();

    await FX1Sports_Token.approve(swapRouterV2.address, MAX_UINT);
    await WETH_Token.approve(swapRouterV2.address, MAX_UINT);

    for (const account of accounts) {
      await WETH_Token.connect(account).approve(swapRouterV2.address, MAX_UINT);
      await FX1Sports_Token.connect(account).approve(
        swapRouterV2.address,
        MAX_UINT
      );
    }

    await swapRouterV2.addLiquidityETH(
      FX1Sports_Token.address,
      ethers.utils.parseUnits("100000", 18),
      1,
      1,
      ownerAccount.address,
      MAX_UINT,
      {
        value: ethers.utils.parseEther("1000"),
      }
    );

    const amountToSend = ethers.utils.parseEther("1000");
    await WETH_Token.deposit({
      value: amountToSend,
    });
  });

  describe("Checking for incorrect transmitted data during deployment", async () => {
    it("should set marketingTaxRecv", async () => {
      const Params = {
        marketingTaxRecv: ZERO_ADDRESS,
        dexRouter: await FX1Sports_Token.dexRouter(),
        whitelistPeriod: ONE_HOUR,
      };

      const fx1SportsToken = await ethers.getContractFactory("FX1SportsToken");
      await expect(
        fx1SportsToken.deploy(BuyFee, SellFee, Params)
      ).to.be.revertedWith("Invalid MarketingTaxRecv address");
    });

    it("should revert when dexRouter is invalid", async () => {
      const Params = {
        marketingTaxRecv: marketingAccount.address,
        dexRouter: ZERO_ADDRESS,
        whitelistPeriod: ONE_HOUR,
      };

      const fx1SportsToken = await ethers.getContractFactory("FX1SportsToken");
      await expect(
        fx1SportsToken.deploy(BuyFee, SellFee, Params)
      ).to.be.revertedWith("Invalid dexRouter adddress");
    });

    it("should revert when whitelistPeriod is invalid", async () => {
      const Params = {
        marketingTaxRecv: marketingAccount.address,
        dexRouter: await FX1Sports_Token.dexRouter(),
        whitelistPeriod: 0,
      };

      const fx1SportsToken = await ethers.getContractFactory("FX1SportsToken");
      await expect(
        fx1SportsToken.deploy(BuyFee, SellFee, Params)
      ).to.be.revertedWith("Invalid whitelistPeriod");
    });

    it("should revert when buyFee rates exceed maximum", async () => {
      const BuyFee = {
        marketingFeeRate: 100,
        liquidityFeeRate: 1,
      };
      const Params = {
        marketingTaxRecv: marketingAccount.address,
        dexRouter: await FX1Sports_Token.dexRouter(),
        whitelistPeriod: ONE_HOUR,
      };

      const fx1SportsToken = await ethers.getContractFactory("FX1SportsToken");
      await expect(
        fx1SportsToken.deploy(BuyFee, SellFee, Params)
      ).to.be.revertedWith("Max Rate exceeded, please lower value");
    });

    it("should revert when sellFee rates exceed maximum", async () => {
      const SellFee = {
        marketingFeeRate: 50,
        liquidityFeeRate: 51,
      };
      const Params = {
        marketingTaxRecv: marketingAccount.address,
        dexRouter: await FX1Sports_Token.dexRouter(),
        whitelistPeriod: ONE_HOUR,
      };

      const fx1SportsToken = await ethers.getContractFactory("FX1SportsToken");
      await expect(
        fx1SportsToken.deploy(BuyFee, SellFee, Params)
      ).to.be.revertedWith("Max Rate exceeded, please lower value");
    });
  });

  describe("Checking data after deployment", async () => {
    it("should be deployed name Token", async () => {
      expect(await FX1Sports_Token.name()).to.be.equal("FX1 Sports");
    });

    it("should be deployed symbol Token", async () => {
      expect(await FX1Sports_Token.symbol()).to.be.equal("FX1");
    });

    it("should be deployed decimals Fx1SportsToken", async () => {
      expect(await FX1Sports_Token.decimals()).to.be.equal(18);
    });

    it("should be deployed totalSupply FX1SportsToken", async () => {
      const totalSupplyFx1Token = ethers.utils.parseUnits("300000000", 18);
      expect(await FX1Sports_Token.totalSupply()).to.be.equal(
        totalSupplyFx1Token
      );
    });

    it("should be deployed FX1Sports Token", async () => {
      expect(FX1Sports_Token.address).to.be.properAddress;
    });
  });

  describe("Testing the main logic and correctness of charging a fee", async () => {
    it("should successfully transfer FX1Sports Token to multiple accounts", async () => {
      const transferAmount = ethers.utils.parseUnits("10000", 18);

      await FX1Sports_Token.transfer(accounts[1].address, transferAmount);
      await FX1Sports_Token.transfer(accounts[2].address, transferAmount);
      await FX1Sports_Token.transfer(accounts[3].address, transferAmount);
      expect(await FX1Sports_Token.balanceOf(accounts[1].address)).to.be.equal(
        transferAmount
      );
      expect(await FX1Sports_Token.balanceOf(accounts[2].address)).to.be.equal(
        transferAmount
      );
      expect(await FX1Sports_Token.balanceOf(accounts[3].address)).to.be.equal(
        transferAmount
      );
    });

    it("should add or remove addresses to/from the whitelist", async () => {
      await expect(
        FX1Sports_Token.updateWhitelists([], true)
      ).to.be.revertedWith("Invalid accounts length");

      const oneAccount = accounts[1].address;
      await FX1Sports_Token.updateWhitelists([oneAccount], true);
      expect(await FX1Sports_Token.whitelists(oneAccount)).to.be.equal(true);
      await FX1Sports_Token.updateWhitelists([oneAccount], false);
      expect(await FX1Sports_Token.whitelists(oneAccount)).to.be.equal(false);

      let accountsWhiteLists = [];
      for (const account of accounts) {
        accountsWhiteLists.push(account.address);
      }

      await FX1Sports_Token.updateWhitelists(accountsWhiteLists, true);
      for (const account of accounts) {
        expect(await FX1Sports_Token.whitelists(account.address)).to.be.equal(
          true
        );
      }
    });

    it("should send funds to multiple recipients if sender has enough balance", async () => {
      const recepients = [
        accounts[5].address,
        accounts[6].address,
        accounts[7].address,
        accounts[8].address,
        accounts[9].address,
        accounts[10].address,
      ];
      const amounts = [
        ethers.utils.parseUnits("5000", 18),
        ethers.utils.parseUnits("7000", 18),
        ethers.utils.parseUnits("150000", 18),
        ethers.utils.parseUnits("22500", 18),
        ethers.utils.parseUnits("7000", 18),
        ethers.utils.parseUnits("30000", 18),
      ];
      await expect(FX1Sports_Token.multiSender([], amounts)).to.be.revertedWith(
        "Invalid arrays length"
      );
      await expect(
        FX1Sports_Token.multiSender(
          [ZERO_ADDRESS],
          [ethers.utils.parseUnits("1000", 18)]
        )
      ).to.be.revertedWith("Invalid recipient address");

      const recepient = accounts[1].address;
      await expect(
        FX1Sports_Token.excludeWalletsFromMaxWallets([], true)
      ).to.be.revertedWith("Invalid length array");

      await FX1Sports_Token.excludeWalletsFromMaxWallets([recepient], true);
      const balanceBefore = await FX1Sports_Token.balanceOf(
        ownerAccount.address
      );
      await expect(
        FX1Sports_Token.multiSender([recepient], [balanceBefore.add(1)])
      ).to.be.revertedWith("Not enough balance to send");

      await FX1Sports_Token.multiSender(recepients, amounts);
      for (let i = 0; i < recepients.length; i++) {
        const balance = await FX1Sports_Token.balanceOf(recepients[i]);
        expect(balance).to.equal(amounts[i]);
      }
    });

    it("should successfully purchase tokens", async () => {
      await FX1Sports_Token.setLaunchBegin();
      await expect(FX1Sports_Token.setLaunchBegin()).to.be.revertedWith(
        "Already launched"
      );

      const buyer = accounts[5];
      const transferAmount = ethers.utils.parseEther("10");
      await WETH_Token.transfer(buyer.address, transferAmount);
      const balanceBefore = await ethers.provider.getBalance(buyer.address);

      await swapRouterV2
        .connect(buyer)
        .swapExactETHForTokens(
          1,
          [await swapRouterV2.WETH(), FX1Sports_Token.address],
          buyer.address,
          MAX_UINT,
          { value: transferAmount }
        );

      const balanceAfter = await ethers.provider.getBalance(buyer.address);
      const gasCost = balanceBefore.sub(balanceAfter).sub(transferAmount);
      expect(balanceBefore.sub(balanceAfter).sub(gasCost)).to.be.equal(
        transferAmount
      );
    });

    it("should successfully sell tokens", async () => {
      await FX1Sports_Token.setSwapThreshold(ethers.utils.parseUnits("1", 18));
      const buyer = accounts[15];
      const transferAmount = ethers.utils.parseUnits("100", 18);
      await FX1Sports_Token.transfer(buyer.address, transferAmount);
      expect(await FX1Sports_Token.balanceOf(buyer.address)).to.be.equal(
        transferAmount
      );

      const balanceBefore = await ethers.provider.getBalance(buyer.address);
      const balanceBeforeMarketing = await ethers.provider.getBalance(
        marketingAccount.address
      );
      await swapRouterV2
        .connect(buyer)
        .swapExactTokensForETHSupportingFeeOnTransferTokens(
          transferAmount,
          0,
          [FX1Sports_Token.address, await swapRouterV2.WETH()],
          buyer.address,
          MAX_UINT
        );

      const balanceAfter = await ethers.provider.getBalance(buyer.address);
      const balanceAfterMarketing = await ethers.provider.getBalance(
        marketingAccount.address
      );
      const gasCost = balanceBefore.sub(balanceAfter).sub(transferAmount);
      expect(balanceBefore.sub(balanceAfter).sub(gasCost)).to.be.equal(
        transferAmount
      );
      expect(balanceBeforeMarketing).to.be.not.equal(balanceAfterMarketing);
    });

    it("should enforce 1% minimum wallet limit in setMaxWalletAmount", async () => {
      const transferAmount = ethers.utils.parseUnits("50000", 18);
      const transferAcc = accounts[15];

      const balanceAfter = await FX1Sports_Token.balanceOf(transferAcc.address);
      expect(balanceAfter).to.be.equal(0);
      await FX1Sports_Token.transfer(transferAcc.address, transferAmount);

      const balanceBefore = await FX1Sports_Token.balanceOf(
        transferAcc.address
      );
      expect(balanceBefore).to.be.equal(transferAmount);
      expect(
        await FX1Sports_Token.excludedFromMaxTransfer(transferAcc.address)
      ).to.be.equal(false);

      await expect(
        FX1Sports_Token.excludeWalletsFromMaxTransfer([], true)
      ).to.be.revertedWith("Invalid length array");
      await FX1Sports_Token.excludeWalletsFromMaxTransfer(
        [transferAcc.address],
        true
      );
      expect(
        await FX1Sports_Token.excludedFromMaxTransfer(transferAcc.address)
      ).to.be.equal(true);

      await expect(
        FX1Sports_Token.excludeWalletsFromFees([], true)
      ).to.be.revertedWith("Invalid length array");
      await FX1Sports_Token.excludeWalletsFromFees([transferAcc.address], true);

      const maxTransferAmount = ethers.utils.parseUnits("5000000", 18);
      const invalidLimit = ethers.utils.parseUnits("0.004", 18);
      await expect(
        FX1Sports_Token.setMaxTransferAmount(invalidLimit)
      ).to.be.revertedWith("Min 0.5% limit");
      await FX1Sports_Token.setMaxTransferAmount(maxTransferAmount);

      const invalidLimitMaxWallet = ethers.utils.parseUnits("0.009", 18);
      await expect(
        FX1Sports_Token.setMaxWalletAmount(invalidLimitMaxWallet)
      ).to.be.revertedWith("Min 1% limit");

      const maxWalletAccountBefore = await FX1Sports_Token.maxWalletAmount();
      await FX1Sports_Token.setMaxWalletAmount(maxWalletAccountBefore.add(100));
      const maxWalletAccountAfter = await FX1Sports_Token.maxWalletAmount();
      expect(maxWalletAccountAfter).to.be.equal(
        maxWalletAccountBefore.add(100)
      );

      await FX1Sports_Token.connect(transferAcc).transfer(
        accounts[1].address,
        transferAmount
      );
      expect(await FX1Sports_Token.balanceOf(transferAcc.address)).to.be.equal(
        0
      );
    });

    it("should update marketing wallet", async () => {
      expect(await FX1Sports_Token.marketingTaxRecv()).to.be.equal(
        marketingAccount.address
      );

      const newAddress = accounts[15].address;
      await expect(
        FX1Sports_Token.setMarketingTaxWallet(ZERO_ADDRESS)
      ).to.be.revertedWith("Invalid marketingTaxWallet address");
      await FX1Sports_Token.setMarketingTaxWallet(newAddress);
      expect(await FX1Sports_Token.marketingTaxRecv()).to.be.equal(newAddress);

      await FX1Sports_Token.setMarketingTaxWallet(marketingAccount.address);
      expect(await FX1Sports_Token.marketingTaxRecv()).to.be.equal(
        marketingAccount.address
      );
    });

    it("should set bots and handle transfers", async () => {
      const bots = [
        accounts[1].address,
        accounts[2].address,
        accounts[3].address,
      ];

      for (const bot of bots) {
        expect(await FX1Sports_Token.bots(bot)).to.be.equal(false);
      }

      await expect(FX1Sports_Token.setBots([])).to.be.revertedWith(
        "Invalid array length"
      );
      await FX1Sports_Token.setBots(bots);

      for (const bot of bots) {
        expect(await FX1Sports_Token.bots(bot)).to.be.equal(true);
      }

      const accBot = bots[2];
      const getAccBotBefore = await FX1Sports_Token.bots(accBot);
      await expect(getAccBotBefore).to.be.equal(true);

      const transferAmount = ethers.utils.parseUnits("1000", 18);
      await expect(
        FX1Sports_Token.connect(accounts[3]).transfer(bots[1], transferAmount)
      ).to.be.revertedWith("No bots allowed");

      await FX1Sports_Token.delBot(accBot);
      const getAccBotAfter = await FX1Sports_Token.bots(accBot);
      await expect(getAccBotAfter).to.be.equal(false);

      await expect(FX1Sports_Token.setSwapThreshold(0)).to.be.revertedWith(
        "Invalid swapThreshold"
      );
      await FX1Sports_Token.setSwapThreshold(
        ethers.utils.parseUnits("30000", 18)
      );
      await FX1Sports_Token.connect(accounts[3]).transfer(
        accBot,
        transferAmount
      );
    });

    it("should update buy fee rate", async () => {
      const marketingFeeRateBefore = (await FX1Sports_Token.buyfeeRate())
        .marketingFeeRate;
      const liquidityFeeRateBefore = (await FX1Sports_Token.buyfeeRate())
        .marketingFeeRate;

      const NewBuyFee = {
        marketingFeeRate: 70,
        liquidityFeeRate: 30,
      };
      await FX1Sports_Token.updateBuyFeeRate(
        NewBuyFee.marketingFeeRate,
        NewBuyFee.liquidityFeeRate
      );

      await expect(NewBuyFee.marketingFeeRate).to.be.not.equal(
        marketingFeeRateBefore
      );
      await expect(NewBuyFee.liquidityFeeRate).to.be.not.equal(
        liquidityFeeRateBefore
      );

      const marketingFeeRateAfter = (await FX1Sports_Token.buyfeeRate())
        .marketingFeeRate;
      const liquidityFeeRateAfter = (await FX1Sports_Token.buyfeeRate())
        .liquidityFeeRate;

      await expect(NewBuyFee.marketingFeeRate).to.be.equal(
        marketingFeeRateAfter
      );
      await expect(NewBuyFee.liquidityFeeRate).to.be.equal(
        liquidityFeeRateAfter
      );
      expect(await FX1Sports_Token.totalBuyFeeRate()).to.be.equal(
        NewBuyFee.marketingFeeRate + NewBuyFee.liquidityFeeRate
      );
    });

    it("should update sell fee rate", async () => {
      const marketingFeeRateBefore = (await FX1Sports_Token.sellfeeRate())
        .marketingFeeRate;
      const liquidityFeeRateBefore = (await FX1Sports_Token.sellfeeRate())
        .marketingFeeRate;

      const NewSellFee = {
        marketingFeeRate: 70,
        liquidityFeeRate: 30,
      };
      await FX1Sports_Token.updateSellFeeRate(
        NewSellFee.marketingFeeRate,
        NewSellFee.liquidityFeeRate
      );

      await expect(NewSellFee.marketingFeeRate).to.be.not.equal(
        marketingFeeRateBefore
      );
      await expect(NewSellFee.liquidityFeeRate).to.be.not.equal(
        liquidityFeeRateBefore
      );

      const marketingFeeRateAfter = (await FX1Sports_Token.sellfeeRate())
        .marketingFeeRate;
      const liquidityFeeRateAfter = (await FX1Sports_Token.sellfeeRate())
        .liquidityFeeRate;

      await expect(NewSellFee.marketingFeeRate).to.be.equal(
        marketingFeeRateAfter
      );
      await expect(NewSellFee.liquidityFeeRate).to.be.equal(
        liquidityFeeRateAfter
      );
      expect(await FX1Sports_Token.totalSellFeeRate()).to.be.equal(
        NewSellFee.marketingFeeRate + NewSellFee.liquidityFeeRate
      );
    });
  });

  describe("Calling errors in functions and checking the correct processing of these functions", async () => {
    it("should test token transfers and allowances", async () => {
      const transferAmount = ethers.utils.parseUnits("1000", 18);
      const recepient = accounts[10];

      await expect(
        FX1Sports_Token.transferFrom(
          recepient.address,
          ownerAccount.address,
          transferAmount
        )
      ).to.be.revertedWith("Transfer > allowance");

      await expect(
        FX1Sports_Token.approve(ZERO_ADDRESS, transferAmount)
      ).to.be.revertedWith("Approve to zero");

      await FX1Sports_Token.connect(recepient).approve(
        ownerAccount.address,
        transferAmount
      );
      const allowanceAmount = await FX1Sports_Token.allowance(
        recepient.address,
        ownerAccount.address
      );
      expect(allowanceAmount).to.equal(transferAmount);

      await expect(
        FX1Sports_Token.transferFrom(recepient.address, ownerAccount.address, 0)
      ).to.be.revertedWith("Zero amount");

      await FX1Sports_Token.transferFrom(
        recepient.address,
        ownerAccount.address,
        transferAmount
      );
    });

    it("should update fee buy and sale rate", async () => {
      const NewFee = {
        marketingFeeRate: 50,
        liquidityFeeRate: 51,
      };

      await expect(
        FX1Sports_Token.updateBuyFeeRate(
          NewFee.marketingFeeRate,
          NewFee.liquidityFeeRate
        )
      ).to.be.revertedWith("Max Rate exceeded, please lower value");
      await expect(
        FX1Sports_Token.updateSellFeeRate(
          NewFee.marketingFeeRate,
          NewFee.liquidityFeeRate
        )
      ).to.be.revertedWith("Max Rate exceeded, please lower value");
    });

    it("should incorrect update pair", async () => {
      const pairBefore = await FX1Sports_Token.pair();
      await expect(FX1Sports_Token.updatePair(ZERO_ADDRESS)).to.be.revertedWith(
        "Invalid pair address"
      );

      await FX1Sports_Token.updatePair(marketingAccount.address);

      const pairAfter = await FX1Sports_Token.pair();
      expect(pairBefore).to.be.not.equal(pairAfter);
      await FX1Sports_Token.updatePair(pairBefore);
    });

    it("should update setWhiteListPeriod", async () => {
      const whiteListBefore = await FX1Sports_Token.whitelistPeriod();
      await expect(FX1Sports_Token.setWhiteListPeriod(0)).to.be.revertedWith(
        "Invalid whitelistPeriod"
      );

      const newWhiteListPeriod = ONE_HOUR * 2;
      await FX1Sports_Token.setWhiteListPeriod(newWhiteListPeriod);
      expect(await FX1Sports_Token.whitelistPeriod()).to.be.not.equal(
        whiteListBefore
      );
    });

    it("should update UniSwapRouter", async () => {
      await expect(
        FX1Sports_Token.updateDexRouter(ZERO_ADDRESS)
      ).to.be.revertedWith("Address is not a contract");

      const contractBefore = await FX1Sports_Token.dexRouter();
      expect(contractBefore).to.be.equal(swapRouterV2.address);

      await expect(
        FX1Sports_Token.updateDexRouter(ZERO_ADDRESS)
      ).to.be.revertedWith("Address is not a contract");
      await FX1Sports_Token.updateDexRouter(WETH_Token.address);

      const contractAfter = await FX1Sports_Token.dexRouter();
      expect(contractAfter).to.be.equal(WETH_Token.address);
      await FX1Sports_Token.updateDexRouter(swapRouterV2.address);
    });
  });
});
