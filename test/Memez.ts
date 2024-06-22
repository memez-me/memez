import {
  time,
  loadFixture,
} from '@nomicfoundation/hardhat-toolbox-viem/network-helpers';
import { expect } from 'chai';
import hre, { ignition, viem } from 'hardhat';
import { parseEther, getContract, Address, zeroAddress } from 'viem';
import MemezFactory from '../ignition/modules/MemezFactory';
import MockERC20 from '../ignition/modules/MockERC20';
import { fraxswapRouterAbi } from '../contracts/fraxswapRouter.abi';
import { fraxswapFactoryAbi } from '../contracts/fraxswapFactory.abi';

describe('Memez', function () {
  async function deployMemezFactory() {
    const { memezFactory } = await ignition.deploy(MemezFactory);
    return memezFactory;
  }

  async function deployMemeCoin(
    factory: any,
    name: string,
    symbol: string,
    cap: bigint,
  ) {
    const [sender1] = await viem.getWalletClients();
    await factory.write.deploy([name, symbol, cap]);
    return await viem.getContractAt(
      'MemeCoin',
      await factory.read.getAddress([
        name,
        symbol,
        cap,
        sender1.account.address,
      ]),
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
    it('Should succesfully deploy formula and token factory', async function () {
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
        parseEther('0.003'),
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
        parseEther('0.003'),
      );
      const sameDeployment = deployMemeCoin(
        factory,
        'Test',
        'TST',
        parseEther('0.003'),
      );
      await expect(sameDeployment).to.be.revertedWith(
        'The token with such parameters has been already deployed',
      );
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
        parseEther('0.003'),
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
        parseEther('0.003'),
      );

      const [, , updatedUsersCount] = await factory.read.accounts([
        sender1.account.address,
      ]);
      const updatedAllCount = await factory.read.allMemecoinsCount();

      expect(updatedUsersCount).to.be.equal(initialUsersCount + 1n);
      expect(updatedAllCount).to.be.equal(initialAllCount + 1n);

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

  describe('Chat', function () {
    it('Should add message to deployed MemeCoin thread', async function () {
      const factory = await loadFixture(deployMemezFactory);
      const [sender1] = await viem.getWalletClients();
      const memecoin = await deployMemeCoin(
        factory,
        'Test',
        'TST',
        parseEther('0.003'),
      );

      const memecoinAddress = memecoin.address;

      const text = '*My text message*';

      await expect(factory.write.addMessage([memecoinAddress, text])).to.emit(
        factory,
        'MessageCreated',
      );

      const events = await factory.getEvents.MessageCreated(
        {},
        {
          fromBlock: 0n,
        },
      );

      expect(events.length).to.be.equal(1);

      expect(events[0].args.memecoinThread?.toLowerCase()).to.be.equal(
        memecoinAddress.toLowerCase(),
      );
      expect(events[0].args.sender?.toLowerCase()).to.be.equal(
        sender1.account.address.toLowerCase(),
      );
      expect(events[0].args.messageIndex).to.be.equal(0n);
    });

    it('Should not add message to invalid thread', async function () {
      const factory = await loadFixture(deployMemezFactory);

      const text = '*My text message*';

      await expect(
        factory.write.addMessage([factory.address, text]),
      ).to.be.revertedWith('Memecoin is not legit');
    });

    it('Should like message', async function () {
      const factory = await loadFixture(deployMemezFactory);
      const [sender1] = await viem.getWalletClients();
      const memecoin = await deployMemeCoin(
        factory,
        'Test',
        'TST',
        parseEther('0.003'),
      );

      const memecoinAddress = memecoin.address;

      const text = '*My text message*';

      await factory.write.addMessage([memecoinAddress, text]);

      await expect(factory.write.likeMessage([memecoinAddress, 0n])).to.emit(
        factory,
        'MessageLiked',
      );

      const events = await factory.getEvents.MessageLiked(
        {},
        {
          fromBlock: 0n,
        },
      );

      expect(events.length).to.be.equal(1);

      expect(events[0].args.memecoinThread?.toLowerCase()).to.be.equal(
        memecoinAddress.toLowerCase(),
      );
      expect(events[0].args.sender?.toLowerCase()).to.be.equal(
        sender1.account.address.toLowerCase(),
      );
      expect(events[0].args.messageIndex).to.be.equal(0n);

      const [, , , likesCount] = await factory.read.threads([
        memecoinAddress,
        0n,
      ]);

      expect(likesCount).to.be.equal(1);
    });

    it('Should not like message that does not exist', async function () {
      const factory = await loadFixture(deployMemezFactory);

      await expect(factory.write.likeMessage([factory.address, 0n])).to.be
        .reverted;
    });

    it('Should not like message twice', async function () {
      const factory = await loadFixture(deployMemezFactory);
      const memecoin = await deployMemeCoin(
        factory,
        'Test',
        'TST',
        parseEther('0.003'),
      );

      const memecoinAddress = memecoin.address;

      const text = '*My text message*';

      await factory.write.addMessage([memecoinAddress, text]);

      await factory.write.likeMessage([memecoinAddress, 0n]);
      await expect(
        factory.write.likeMessage([memecoinAddress, 0n]),
      ).to.be.revertedWith('Message is already liked');
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
          parseEther('0.03'),
        );
        const value = parseEther('0.01');
        await memecoin.write.mint({
          value,
          account: sender1.account,
        });
        await memecoin.write.mint({
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
          parseEther('0.03'),
        );
        const value = parseEther('0.01');
        await memecoin.write.mint({
          value,
          account: sender.account,
        });
        const balance = await memecoin.read.balanceOf([sender.account.address]);
        await memecoin.write.retire([balance], { account: sender.account });

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
        expect(sells[0].args.liquidity).to.be.approximately(value, 10000000000);
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
          parseEther('1.5'),
        );

        const balanceBefore = await client.getBalance({
          address: sender1.account.address,
        });

        await memecoin.write.mint({
          value: parseEther('0.01'),
          account: sender1.account,
        });
        await memecoin.write.mint({
          value: parseEther('1'),
          account: sender2.account,
        });
        const balance = await memecoin.read.balanceOf([
          sender1.account.address,
        ]);
        await memecoin.write.retire([balance], { account: sender1.account });

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
          parseEther('0.03'),
        );

        const [sender1, sender2] = await viem.getWalletClients();
        await memecoin.write.mint({
          value: parseEther('0.01'),
          account: sender1.account,
        });
        await memecoin.write.mint({
          value: parseEther('0.01'),
          account: sender2.account,
        });
        await memecoin.write.mint({
          value: parseEther('0.01'),
          account: sender2.account,
        });

        const client = await viem.getPublicClient();
        const router = await getContract({
          abi: fraxswapRouterAbi,
          address: await memecoin.read.fraxswapRouter(),
          client,
        });

        const fraxFactory = await getContract({
          abi: fraxswapFactoryAbi,
          address: (await router.read.factory()) as Address,
          client,
        });

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
    describe('Metadata updating', function () {
      it('Should update metadata if not listed yet', async function () {
        const [sender1] = await viem.getWalletClients();
        const factory = await loadFixture(deployMemezFactory);
        const memecoin = await deployMemeCoin(
          factory,
          'Test',
          'TST',
          parseEther('0.003'),
        );
        const description = '*description*';
        const image = '*image*';
        await expect(
          memecoin.write.updateMetadata([description, image], {
            account: sender1.account,
          }),
        ).to.emit(memecoin, 'MetadataUpdated');

        const onChainDescription = await memecoin.read.description();
        const onChainImage = await memecoin.read.image();

        expect(onChainDescription).to.be.equal(description);
        expect(onChainImage).to.be.equal(image);
      });
      it('Should not update metadata if already listed', async function () {
        const [sender1] = await viem.getWalletClients();
        const factory = await loadFixture(deployMemezFactory);
        const cap = parseEther('0.003');
        const memecoin = await deployMemeCoin(factory, 'Test', 'TST', cap);
        await memecoin.write.mint({ value: cap, account: sender1.account });
        const description = '*description*';
        const image = '*image*';
        await expect(
          memecoin.write.updateMetadata([description, image], {
            account: sender1.account,
          }),
        ).to.be.revertedWith('Already listed');
      });
      it('Should not update metadata if not owner', async function () {
        const [sender1, sender2] = await viem.getWalletClients();
        const factory = await loadFixture(deployMemezFactory);
        const cap = parseEther('0.003');
        const memecoin = await deployMemeCoin(factory, 'Test', 'TST', cap);
        const description = '*description*';
        const image = '*image*';
        await expect(
          memecoin.write.updateMetadata([description, image], {
            account: sender2.account,
          }),
        ).to.be.revertedWith('Ownable: caller is not the owner');
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
          parseEther('0.003'),
        );

        const nonLegitMemecoin = await deployMockERC20(
          'Fake Memecoin',
          'FMC',
          parseEther('0.003'),
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
        const [sender] = await viem.getWalletClients();
        const factory = await loadFixture(deployMemezFactory);
        const cap = parseEther('0.01');
        const memecoin = await deployMemeCoin(factory, 'Test', 'TST', cap);

        const balanceBefore = await publicClient.getBalance({
          address: sender.account.address,
        });
        const hash = await memecoin.write.mint({
          value: cap + parseEther('0.02'),
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
        const cap = parseEther('0.01');
        const memecoin = await deployMemeCoin(factory, 'Test', 'TST', cap);

        await memecoin.write.mint({
          value: cap,
          account: sender.account,
        });

        const mintAfterListing = memecoin.write.mint({
          value: parseEther('0.01'),
          account: sender.account,
        });

        await expect(mintAfterListing).to.be.revertedWith('Already listed');
      });

      it('Should not retire after listing', async function () {
        const [sender] = await viem.getWalletClients();
        const factory = await loadFixture(deployMemezFactory);
        const cap = parseEther('0.01');
        const memecoin = await deployMemeCoin(factory, 'Test', 'TST', cap);

        await memecoin.write.mint({
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
          [mints[0].args.amount!],
          {
            account: sender.account,
          },
        );

        await expect(retireAfterListing).to.be.revertedWith('Already listed');
      });
    });
  });
});
