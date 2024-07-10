import { getContractAddress, Hex, keccak256, toBytes } from 'viem';
import MemeCoinJSON from '../../artifacts/contracts/MemeCoin.sol/MemeCoin.json';
import { ADDRESSES } from '../constants';

export default function getMemeCoinAddress(symbol: string) {
  return getContractAddress({
    opcode: 'CREATE2',
    from: ADDRESSES.MEMEZ_FACTORY,
    bytecode: MemeCoinJSON.bytecode as Hex,
    salt: keccak256(toBytes(symbol)),
  });
}
