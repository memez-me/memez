import React from 'react';
import PageHead from '../components/PageHead';
import { LinkButton } from '../components/buttons';
import { chains } from '../wagmi';
import {
  useMemeCoinListingManagerConfig,
  useMemezConfig,
  useMemezFactoryConfig,
} from '../hooks';
import { trimAddress } from '../utils';

const chainExplorerUrl = chains[0].blockExplorers?.default?.url;

export function About() {
  const { address: memezFactoryAddress } = useMemezFactoryConfig();
  const { address: listingManagerAddress } = useMemeCoinListingManagerConfig();
  const { address: memezAddress } = useMemezConfig();

  return (
    <>
      <PageHead
        title="memez"
        subtitle="About"
        description="How memez platform works"
      />
      <div className="flex flex-col gap-x2 justify-center items-center max-w-[560px] mx-auto text-title font-medium">
        <h1 className="font-bold text-headline text-shadow text-center mb-x2">
          How it works
        </h1>
        <p>You run a token and set a bonding curve parameters.</p>
        <p>
          Once a bonding curve reaches its cap, 95% of liquidity is used to
          create X/frxETH pool.
        </p>
        <p>Another 2% is used to buy MEMEZ and create MEMEZ/X pool.</p>
        <p>
          All the liquidity is non-ruggable and you are free to choose the
          initial token params.
        </p>
        <p>The platform takes humble 3% fee to support the team.</p>
        {chainExplorerUrl && (
          <div className="flex flex-col gap-x2 w-full">
            <h1 className="font-bold text-headline-2 text-shadow text-center my-x2">
              Our contracts
            </h1>
            <p>
              Memez Factory:{' '}
              <LinkButton
                href={`${chainExplorerUrl}/address/${memezFactoryAddress}`}
                target="_blank"
              >
                {trimAddress(memezFactoryAddress)}
              </LinkButton>
            </p>
            <p>
              Memecoin Listing Manager:{' '}
              <LinkButton
                href={`${chainExplorerUrl}/address/${listingManagerAddress}`}
                target="_blank"
              >
                {trimAddress(listingManagerAddress)}
              </LinkButton>
            </p>
            <p>
              MEMEZ token:{' '}
              <LinkButton
                href={`${chainExplorerUrl}/address/${memezAddress}`}
                target="_blank"
              >
                {trimAddress(memezAddress)}
              </LinkButton>
            </p>
          </div>
        )}
        <LinkButton className="text-headline-2 mt-x2" href="/create">
          Create coin
        </LinkButton>
      </div>
    </>
  );
}

export default About;
