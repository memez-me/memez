import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre, { ignition, viem } from "hardhat";
import { getAddress, parseEther, getContract } from "viem";
import MemezFactory from "../ignition/modules/MemezFactory";
import { fraxswapRouterAbi } from "../contracts/fraxswapRouter.abi";
import { fraxswapFactoryAbi } from "../contracts/fraxswapFactory.abi";

describe("Memez", function () {

  async function deployMemezFactory() {
    const { memezFactory } = await ignition.deploy(MemezFactory);
    console.log(typeof memezFactory)
    return memezFactory;
  }

  async function deployMemeCoin(factory: any, name: string, symbol: string, cap: bigint) {
    await factory.write.deploy([name, symbol, cap]);
    return await viem.getContractAt("MemeCoin", await factory.read.getAddress([name, symbol, cap]))
  }

  describe("Deployment", function () {
    it("Should succesfully deploy formula and token factory", async function () {
      const factory = await loadFixture(deployMemezFactory);
      const formulaAddr = await factory.read.formula();
      const formula = await viem.getContractAt("Formula", formulaAddr);
      expect(async () => await formula.read.purchaseCost([100000n, 10n, 1, 1n])).not.to.throw();
    });

    it("Should be able to deploy MemeCoin", async function () {
      const factory = await loadFixture(deployMemezFactory);
      const memecoin = await deployMemeCoin(factory, "Test", "TST", parseEther("0.003"));
      const events = await factory.getEvents.MemeCoinDeployed();
      
      expect(events.length).to.be.equal(1);
      expect(events[0].args.addr).to.be.equal(memecoin.address);

      const actualName = await memecoin.read.name();

      expect(actualName).to.be.equal("Test");
    });

    it("Should only be able to deploy the same tokens once", async function () {
      const factory = await loadFixture(deployMemezFactory);
      const memecoin = await deployMemeCoin(factory, "Test", "TST", parseEther("0.003"));
      const sameDeployment = deployMemeCoin(factory, "Test", "TST", parseEther("0.003"));
      expect(sameDeployment).to.be.revertedWith(
        "The token with such parameters has been already deployed");
    })

  });

  describe("Token Mechanics", function () {
    describe("Basic buy/sell", function () {
      it("Subsequent buyer gets tokens by increased price", async function () {
        const [sender1, sender2] = await viem.getWalletClients();
        const factory = await loadFixture(deployMemezFactory);
        const memecoin = await deployMemeCoin(factory, "Test", "TST", parseEther("0.03"));
        await memecoin.write.mint({
          value: parseEther("0.01"),
          account: sender1.account
        });
        await memecoin.write.mint({
          value: parseEther("0.01"),
          account: sender2.account
        });
        const buys = await memecoin.getEvents.Mint({}, {
          fromBlock: 0n
        });
        // we expect first buyer to get more tokens than the second one
        expect(buys.length).to.be.equal(2);
        expect(buys[0].args.amount).to.be.equal(await memecoin.read.balanceOf([sender1.account.address]));
        expect(buys[1].args.amount).to.be.equal(await memecoin.read.balanceOf([sender2.account.address]));
        expect(buys[0].args.amount).to.be.greaterThan(buys[1].args.amount);
        
        const client = await viem.getPublicClient();
        
      });

      it("Selling should give eth back. The amount of eth shold be close to originally invested if the sell happens immediately", async function () {
        const [sender] = await viem.getWalletClients();
        const factory = await loadFixture(deployMemezFactory);
        const memecoin = await deployMemeCoin(factory, "Test", "TST", parseEther("0.03"));
        await memecoin.write.mint({
          value: parseEther("0.01"),
          account: sender.account
        });
        const balance = await memecoin.read.balanceOf([sender.account.address]);
        await memecoin.write.retire([balance], {account: sender.account});

        const sells = await memecoin.getEvents.Retire({}, {
          fromBlock: 0n
        });

        expect(parseEther("0.01")).to.be.approximately(sells[0].args.liquidity, 10000000000)
      });

      it("Earlybirds should be able to earn if token pumps", async function () {
        const client = await viem.getPublicClient();
        const [sender1, sender2] = await viem.getWalletClients();
        const factory = await loadFixture(deployMemezFactory);
        const memecoin = await deployMemeCoin(factory, "Test", "TST", parseEther("1.5"));

        const balanceBefore = await client.getBalance({
          address: sender1.account.address
        });

        await memecoin.write.mint({
          value: parseEther("0.01"),
          account: sender1.account
        });
        await memecoin.write.mint({
          value: parseEther("1"),
          account: sender2.account
        });
        const balance = await memecoin.read.balanceOf([sender1.account.address]);
        await memecoin.write.retire([balance], {account: sender1.account});

        const balanceAfter = await client.getBalance({
          address: sender1.account.address
        });

        expect(balanceAfter).is.greaterThan(balanceBefore);
      });

      it("Liquidity is provided after cap is reached", async function () {
        const factory = await loadFixture(deployMemezFactory);
        const memecoin = await deployMemeCoin(factory, "Test", "TST", parseEther("0.03"));

        const [sender1, sender2] = await viem.getWalletClients();
        await memecoin.write.mint({
          value: parseEther("0.01"),
          account: sender1.account
        });
        await memecoin.write.mint({
          value: parseEther("0.01"),
          account: sender2.account
        });
        await memecoin.write.mint({
          value: parseEther("0.01"),
          account: sender2.account
        });

        const client = await viem.getPublicClient();
        const router = await getContract({
          abi: fraxswapRouterAbi, 
          address: await memecoin.read.fraxswapRouter(), 
          client
        });

        const fraxFactory = await getContract({
          abi: fraxswapFactoryAbi, 
          address: await router.read.factory(), 
          client
        });

        const weth = await router.read.WETH();

        const createdPairs = await fraxFactory.getEvents.PairCreated({}, {
          fromBlock: 0n
        });
        const token1 = createdPairs[createdPairs.length - 1].args[0];
        const token2 = createdPairs[createdPairs.length - 1].args[1];
        expect(token1).to.be.equal(memecoin.address);
        expect(token2).to.be.equal(weth);

      });


    });

  });
});
