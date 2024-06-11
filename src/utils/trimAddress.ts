import { Address, zeroAddress } from 'viem';

export default function trimAddress(
  address: Address,
  startLength = 7,
  endLength = 5,
) {
  address ??= zeroAddress;
  let startPart = address.substring(0, startLength);
  let endPart = address.slice(-endLength);
  return `${startPart}...${endPart}`;
}
