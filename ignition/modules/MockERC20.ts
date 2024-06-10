import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const MockERC20 = buildModule('MockERC20', (m) => {
  const name = m.getParameter('name', 'MockERC20');
  const symbol = m.getParameter('symbol', 'MERC20');
  const amount = m.getParameter('amount', 0);

  const mockERC20 = m.contract('MockERC20', [name, symbol, amount]);
  return { mockERC20 };
});

export default MockERC20;
