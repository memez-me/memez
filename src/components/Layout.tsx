import React, { ReactNode } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';

export function Layout({ children }: { children: ReactNode }) {
  const { address } = useAccount();

  return (
    <>
      <div className="flex flex-col w-full h-full">
        <div className="flex flex-row self-end">
          <div className="flex flex-col gap-2">
            <w3m-button />
            {address && (
              <div className="ml-auto">
                <Link
                  href={`/profile?address=${address}`}
                  passHref
                  rel="noreferrer"
                  className="hover:font-bold hover:text-text-hovered"
                >
                  [my profile]
                </Link>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col">{children}</div>
      </div>
      <div id="modals-container" />
    </>
  );
}
