import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const MockMEMEZ = buildModule('MockMEMEZ', (m) => {
  const amount = m.getParameter('amount', 10n ** (18n + 6n));
  const value = m.getParameter('value', 10n ** (18n + 1n));

  const mockMEMEZ = m.contract('MockMEMEZ');

  m.call(mockMEMEZ, 'list', [amount], { value: value });

  return { mockMEMEZ };
});

export default MockMEMEZ;
