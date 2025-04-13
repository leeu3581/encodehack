import { PROGRAM_ID } from '../manifest/index';
import { PublicKey } from '@solana/web3.js';
export function getGlobalAddress(mint) {
    const [globalAddress, _unusedBump] = PublicKey.findProgramAddressSync([Buffer.from('global'), mint.toBuffer()], PROGRAM_ID);
    return globalAddress;
}
export function getGlobalVaultAddress(mint) {
    const [globalVaultAddress, _unusedBump] = PublicKey.findProgramAddressSync([Buffer.from('global-vault'), mint.toBuffer()], PROGRAM_ID);
    return globalVaultAddress;
}
