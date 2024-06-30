import Uint256Power from './Uint256Power';

const DECIMALS = 10n ** 18n;

// price = factor * supply ^ power =
// (factorN / factorD) * supply ^ (powerN / powerD)
export function getPrice(
  supply: bigint,
  powerN: bigint,
  powerD: bigint,
  factorN: bigint,
  factorD: bigint,
) {
  if (supply === 0n) return 0n;
  const { result, precision } = Uint256Power.power(
    supply,
    DECIMALS,
    powerN,
    powerD,
  );
  return ((result >> precision) * factorN) / factorD;
}

// cap = (factor * supply ^ (power + 1)) / (power + 1) =
// ((factorN / factorD) * supply ^ ((powerN + powerD) / powerD)) / ((powerN + powerD) / powerD) =
// (supply ^ ((powerN + powerD) / powerD)) * (factorN * powerD / factorD / (powerN + powerD))
export function getCap(
  supply: bigint,
  powerN: bigint,
  powerD: bigint,
  factorN: bigint,
  factorD: bigint,
) {
  const powerNOfPowerPlus1 = powerN + powerD;
  const { result, precision } = Uint256Power.power(
    supply,
    DECIMALS,
    powerNOfPowerPlus1,
    powerD,
  );
  return (
    ((result >> precision) * factorN * powerD) / factorD / powerNOfPowerPlus1
  );
}

// supply = (cap * (power + 1) / factor) ^ (1 / (power + 1)) =
// (cap * ((powerN + powerD) / powerD) / (factorN / factorD)) ^ (1 / ((powerN + powerD) / powerD)) =
// (cap * (powerN + powerD) * factorD / factorN / powerD) ^ (powerD / (powerN + powerD))
export function getSupply(
  cap: bigint,
  powerN: bigint,
  powerD: bigint,
  factorN: bigint,
  factorD: bigint,
) {
  const powerNOfPowerPlus1 = powerN + powerD;
  const baseN = cap * powerNOfPowerPlus1 * factorD;
  const baseD = factorN * powerD;
  const { result, precision } = Uint256Power.power(
    baseN,
    baseD,
    powerD,
    powerNOfPowerPlus1,
  );
  return (result >> precision) * DECIMALS;
}
