export default function getPrice(supply: bigint) {
  return (supply * supply) / 3000n; //TODO: use coefficients from smart contract
}
