import { loadFixture } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers';
import { expect } from 'chai';
import hre, { ignition, viem } from 'hardhat';
import { parseEther } from 'viem';
import MemezFactory from '../ignition/modules/MemezFactory';
import MockERC20 from '../ignition/modules/MockERC20';
import MockMEMEZ from '../ignition/modules/MockMEMEZ';

describe('Memez', function () {
  async function deployMEMEZ() {
    const { mockMEMEZ } = await ignition.deploy(MockMEMEZ);
    return mockMEMEZ;
  }

  async function deployMemezFactory(
    memezAddress?: string,
    treasuryAddress?: string,
  ) {
    let memez: string;
    if (!memezAddress) {
      memez = (await deployMEMEZ()).address;
    } else {
      memez = memezAddress;
    }
    let treasury: string;
    if (!treasuryAddress) {
      const [sender1] = await viem.getWalletClients();
      treasury = sender1.account.address;
    } else {
      treasury = treasuryAddress;
    }
    const { memezFactory } = await ignition.deploy(MemezFactory, {
      parameters: {
        MemezFactory: {
          treasury,
          memez,
        },
      },
    });
    return memezFactory;
  }

  async function deployMemeCoin(
    factory: Awaited<ReturnType<typeof deployMemezFactory>>,
    name: string,
    symbol: string,
    cap: bigint,
    powerN: bigint | number = 3,
    powerD: bigint | number = 1,
    factorN: bigint | number = 1000,
    factorD: bigint | number = 1,
    description: string = '*description*',
    image: string = '*image*',
  ) {
    const [sender1] = await viem.getWalletClients();
    await factory.write.deploy([
      cap,
      Number(powerN),
      Number(powerD),
      Number(factorN),
      Number(factorD),
      name,
      symbol,
      description,
      image,
    ]);
    return await viem.getContractAt(
      'MemeCoin',
      await factory.read.getAddress([symbol]),
    );
  }

  async function deployMockERC20(
    name: string = 'MockERC20',
    symbol: string = 'MERC20',
    cap: bigint = 0n,
  ) {
    const { mockERC20 } = await ignition.deploy(MockERC20, {
      parameters: {
        MockERC20: {
          name,
          symbol,
          cap,
        },
      },
    });
    return mockERC20;
  }

  describe('Deployment', function () {
    it('Should successfully deploy formula and token factory', async function () {
      const factory = await loadFixture(deployMemezFactory);
      const formulaAddr = await factory.read.formula();
      const formula = await viem.getContractAt('Formula', formulaAddr);
      expect(
        async () => await formula.read.purchaseCost([100000n, 10n, 1, 1n]),
      ).not.to.throw();
    });

    it('Should be able to deploy MemeCoin', async function () {
      const factory = await loadFixture(deployMemezFactory);
      const [sender1] = await viem.getWalletClients();
      const memecoin = await deployMemeCoin(
        factory,
        'Test',
        'TST',
        parseEther('30'),
      );
      const events = await factory.getEvents.MemeCoinDeployed();

      expect(events.length).to.be.equal(1);
      expect(events[0].args.creator?.toLowerCase()).to.be.equal(
        sender1.account.address.toLowerCase(),
      );
      expect(events[0].args.memecoin).to.be.equal(memecoin.address);

      const actualName = await memecoin.read.name();

      expect(actualName).to.be.equal('Test');
    });

    it('Should not deploy MemeCoin with 0 cap', async function () {
      const factory = await loadFixture(deployMemezFactory);
      const zeroCapDeployment = deployMemeCoin(factory, 'Test', 'TST', 0n);

      await expect(zeroCapDeployment).to.be.revertedWith(
        'Positive cap expected',
      );
    });

    it('Should only be able to deploy the same tokens once', async function () {
      const factory = await loadFixture(deployMemezFactory);
      const memecoin = await deployMemeCoin(
        factory,
        'Test',
        'TST',
        parseEther('30'),
      );
      const sameDeployment = deployMemeCoin(
        factory,
        'Test',
        'TST',
        parseEther('30'),
      );
      await expect(sameDeployment).to.be.revertedWith('Symbol is already used');
    });
  });

  describe('Account management', function () {
    it('Should update account information', async function () {
      const [sender1] = await viem.getWalletClients();
      const factory = await loadFixture(deployMemezFactory);

      const nickname = '*nickname*';
      const profilePicture = '*profilePicture*';

      await factory.write.updateAccountInfo([nickname, profilePicture], {
        account: sender1.account,
      });

      const accountInfoUpdatedEvents =
        await factory.getEvents.AccountInfoUpdated(
          {},
          {
            fromBlock: 0n,
          },
        );

      expect(accountInfoUpdatedEvents.length).to.be.equal(1);
      expect(
        accountInfoUpdatedEvents[0].args.account?.toLowerCase(),
      ).to.be.equal(sender1.account.address.toLowerCase());

      const accountInfo = await factory.read.accounts([
        sender1.account.address,
      ]);
      expect(accountInfo[0]).to.be.equal(nickname);
      expect(accountInfo[1]).to.be.equal(profilePicture);
    });

    it('Should not use existing nickname', async function () {
      const [sender1, sender2] = await viem.getWalletClients();
      const factory = await loadFixture(deployMemezFactory);

      const nickname = 'nickname1';
      const profilePicture = 'profilePicture';

      await factory.write.updateAccountInfo([nickname, profilePicture], {
        account: sender1.account,
      });

      await expect(
        factory.write.updateAccountInfo([nickname, profilePicture], {
          account: sender2.account,
        }),
      ).to.be.revertedWith('Nickname exists');
    });

    it('Should deploy MemeCoin and set owner', async function () {
      const factory = await loadFixture(deployMemezFactory);
      const [sender1] = await viem.getWalletClients();
      const memecoin = await deployMemeCoin(
        factory,
        'Test',
        'TST',
        parseEther('30'),
      );

      const ownerAddress = await memecoin.read.owner();

      expect(ownerAddress.toLowerCase()).to.be.equal(
        sender1.account.address.toLowerCase(),
      );
    });

    it('Should update created Memecoins count and arrays after the deployment of MemeCoin', async function () {
      const factory = await loadFixture(deployMemezFactory);
      const [sender1] = await viem.getWalletClients();
      const [, , initialUsersCount] = await factory.read.accounts([
        sender1.account.address,
      ]);
      const initialAllCount = await factory.read.allMemecoinsCount();
      const memecoin = await deployMemeCoin(
        factory,
        'Test',
        'TST',
        parseEther('30'),
      );

      const [, , updatedUsersCount] = await factory.read.accounts([
        sender1.account.address,
      ]);
      const updatedAllCount = await factory.read.allMemecoinsCount();

      expect(updatedUsersCount).to.be.equal(initialUsersCount + 1n);
      expect(updatedAllCount).to.be.equal(initialAllCount + 1);

      const lastUserMemecoin = await factory.read.memecoinsByCreators([
        sender1.account.address,
        initialUsersCount,
      ]);
      const lastAllMemecoin = await factory.read.allMemecoins([
        initialUsersCount,
      ]);

      expect(lastUserMemecoin.toLowerCase()).to.be.equal(
        memecoin.address.toLowerCase(),
      );
      expect(lastAllMemecoin.toLowerCase()).to.be.equal(
        memecoin.address.toLowerCase(),
      );
    });
  });

  describe('Token Mechanics', function () {
    describe('Basic buy/sell', function () {
      it('Subsequent buyer gets tokens by increased price', async function () {
        const [sender1, sender2] = await viem.getWalletClients();
        const factory = await loadFixture(deployMemezFactory);
        const memecoin = await deployMemeCoin(
          factory,
          'Test',
          'TST',
          parseEther('30'),
        );
        const value = parseEther('10');
        await memecoin.write.mint([0n], {
          value,
          account: sender1.account,
        });
        await memecoin.write.mint([0n], {
          value,
          account: sender2.account,
        });
        const buys = await memecoin.getEvents.Mint(
          {},
          {
            fromBlock: 0n,
          },
        );

        expect(buys.length).to.be.equal(2);

        expect(buys[0].args.by?.toLowerCase()).to.be.equal(
          sender1.account.address.toLowerCase(),
        );
        expect(buys[1].args.by?.toLowerCase()).to.be.equal(
          sender2.account.address.toLowerCase(),
        );

        // we expect first buyer to get more tokens than the second one
        const balance1 = await memecoin.read.balanceOf([
          sender1.account.address,
        ]);
        expect(buys[0].args.amount).to.be.equal(balance1);
        const balance2 = await memecoin.read.balanceOf([
          sender2.account.address,
        ]);
        expect(buys[1].args.amount).to.be.equal(balance2);
        expect(buys[0].args.amount).to.be.greaterThan(buys[1].args.amount);

        expect(buys[0].args.liquidity).to.be.equal(value);
        expect(buys[1].args.liquidity).to.be.equal(value);

        expect(buys[0].args.newSupply).to.be.equal(balance1);
        expect(buys[1].args.newSupply).to.be.equal(balance1 + balance2);
      });

      it('Selling should give eth back. The amount of eth should be close to originally invested if the sell happens immediately', async function () {
        const [sender] = await viem.getWalletClients();
        const factory = await loadFixture(deployMemezFactory);
        const memecoin = await deployMemeCoin(
          factory,
          'Test',
          'TST',
          parseEther('30'),
        );
        const value = parseEther('10');
        await memecoin.write.mint([0n], {
          value,
          account: sender.account,
        });
        const balance = await memecoin.read.balanceOf([sender.account.address]);
        await memecoin.write.retire([balance, 0n], { account: sender.account });

        const sells = await memecoin.getEvents.Retire(
          {},
          {
            fromBlock: 0n,
          },
        );

        expect(sells[0].args.by?.toLowerCase()).to.be.equal(
          sender.account.address.toLowerCase(),
        );
        expect(sells[0].args.amount).to.be.equal(balance);
        expect(sells[0].args.liquidity).to.be.approximately(
          value,
          value / 1000n,
        );
        expect(sells[0].args.newSupply).to.be.equal(0n);
      });

      it('Earlybirds should be able to earn if token pumps', async function () {
        const client = await viem.getPublicClient();
        const [sender1, sender2] = await viem.getWalletClients();
        const factory = await loadFixture(deployMemezFactory);
        const memecoin = await deployMemeCoin(
          factory,
          'Test',
          'TST',
          parseEther('15'),
        );

        const balanceBefore = await client.getBalance({
          address: sender1.account.address,
        });

        await memecoin.write.mint([0n], {
          value: parseEther('1'),
          account: sender1.account,
        });
        await memecoin.write.mint([0n], {
          value: parseEther('5'),
          account: sender2.account,
        });
        const balance = await memecoin.read.balanceOf([
          sender1.account.address,
        ]);
        await memecoin.write.retire([balance, 0n], {
          account: sender1.account,
        });

        const balanceAfter = await client.getBalance({
          address: sender1.account.address,
        });

        expect(balanceAfter).is.greaterThan(balanceBefore);
      });

      it('Liquidity is provided after cap is reached', async function () {
        const factory = await loadFixture(deployMemezFactory);
        const memecoin = await deployMemeCoin(
          factory,
          'Test',
          'TST',
          parseEther('30'),
        );

        const [sender1, sender2] = await viem.getWalletClients();
        await memecoin.write.mint([0n], {
          value: parseEther('10'),
          account: sender1.account,
        });
        await memecoin.write.mint([0n], {
          value: parseEther('10'),
          account: sender2.account,
        });
        await memecoin.write.mint([0n], {
          value: parseEther('10'),
          account: sender2.account,
        });

        const listingManagerAddress = await memecoin.read.listingManager();
        const listingManager = await hre.viem.getContractAt(
          'MemeCoinListingManager',
          listingManagerAddress,
        );
        const fraxswapRouterAddress =
          await listingManager.read.fraxswapRouter();
        const fraxswapFactoryAddress =
          await listingManager.read.fraxswapFactory();
        const router = await hre.viem.getContractAt(
          'IFraxswapRouter',
          fraxswapRouterAddress,
        );

        const fraxFactory = await hre.viem.getContractAt(
          'IFraxswapFactory',
          fraxswapFactoryAddress,
        );

        const weth = await router.read.WETH();

        const createdPairs = await fraxFactory.getEvents.PairCreated(
          {},
          {
            fromBlock: 0n,
          },
        );
        const token1 = (createdPairs[createdPairs.length - 1] as any).args[0];
        const token2 = (createdPairs[createdPairs.length - 1] as any).args[1];
        expect(token1).to.be.equal(memecoin.address);
        expect(token2).to.be.equal(weth);
      });
    });
    describe('Unexpected usage checking', function () {
      it('Should check MemeCoin legitimacy', async function () {
        const legitFactory = await loadFixture(deployMemezFactory);
        const nonLegitFactory = await loadFixture(deployMemezFactory);
        const legitMemecoin = await deployMemeCoin(
          legitFactory,
          'Real Memecoin',
          'RMC',
          parseEther('30'),
        );

        const nonLegitMemecoin = await deployMockERC20(
          'Fake Memecoin',
          'FMC',
          parseEther('30'),
        );

        expect(await legitFactory.read.isMemeCoinLegit([legitMemecoin.address]))
          .to.be.true;
        expect(
          await legitFactory.read.isMemeCoinLegit([nonLegitMemecoin.address]),
        ).to.be.false;
        expect(
          await legitFactory.read.isMemeCoinLegit([nonLegitFactory.address]),
        ).to.be.false;
      });

      it('Should sent leftover back on reaching cap', async function () {
        const publicClient = await viem.getPublicClient();
        const [, sender] = await viem.getWalletClients();
        const factory = await loadFixture(deployMemezFactory);
        const cap = parseEther('10');
        const memecoin = await deployMemeCoin(factory, 'Test', 'TST', cap);

        const balanceBefore = await publicClient.getBalance({
          address: sender.account.address,
        });
        const hash = await memecoin.write.mint([0n], {
          value: cap + parseEther('5'),
          account: sender.account,
        });
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        const gasSpent = receipt.gasUsed * receipt.effectiveGasPrice;
        const balanceAfter = await publicClient.getBalance({
          address: sender.account.address,
        });

        expect(balanceBefore - gasSpent - cap).to.be.eq(balanceAfter);

        const buys = await memecoin.getEvents.Mint(
          {},
          {
            fromBlock: 0n,
          },
        );

        const balance = await memecoin.read.balanceOf([sender.account.address]);
        expect(buys[0].args.amount).to.be.equal(balance);
        expect(buys[0].args.liquidity).to.be.equal(cap);
        expect(buys[0].args.newSupply).to.be.equal(balance);
      });

      it('Should not mint after listing', async function () {
        const [sender] = await viem.getWalletClients();
        const factory = await loadFixture(deployMemezFactory);
        const cap = parseEther('10');
        const memecoin = await deployMemeCoin(factory, 'Test', 'TST', cap);

        await memecoin.write.mint([0n], {
          value: cap,
          account: sender.account,
        });

        const mintAfterListing = memecoin.write.mint([0n], {
          value: parseEther('10'),
          account: sender.account,
        });

        await expect(mintAfterListing).to.be.revertedWith('Already listed');
      });

      it('Should not retire after listing', async function () {
        const [sender] = await viem.getWalletClients();
        const factory = await loadFixture(deployMemezFactory);
        const cap = parseEther('10');
        const memecoin = await deployMemeCoin(factory, 'Test', 'TST', cap);

        await memecoin.write.mint([0n], {
          value: cap,
          account: sender.account,
        });

        const mints = await memecoin.getEvents.Mint(
          {},
          {
            fromBlock: 0n,
          },
        );

        const retireAfterListing = memecoin.write.retire(
          [mints[0].args.amount!, 0n],
          {
            account: sender.account,
          },
        );

        await expect(retireAfterListing).to.be.revertedWith('Already listed');
      });
    });
  });
});
