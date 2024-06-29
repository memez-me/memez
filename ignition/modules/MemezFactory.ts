import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const MemezFactory = buildModule('MemezFactory', (m) => {
  const memezAddress = m.getParameter('memez');
  const treasuryAddress = m.getParameter('treasury');

  const formula = m.contract('Formula', []);
  m.call(formula, 'init');

  const listingManager = m.contract('MemeCoinListingManager', [
    memezAddress,
    treasuryAddress,
  ]);

  const memezFactory = m.contract('MemezFactory', [formula, listingManager]);

  return { memezFactory };
});

export default MemezFactory;
