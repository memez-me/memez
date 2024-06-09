import React from 'react';
import PageHead from '../components/PageHead';
import Link from 'next/link';

export function Index() {
  return (
    <>
      <PageHead title="memez" description="memez memecoins app" />
      <div className="flex flex-col h-full justify-center items-center">
        <Link
          href="/create"
          passHref
          rel="noreferrer"
          className="hover:font-bold hover:text-text-hovered"
        >
          [create memecoin]
        </Link>
      </div>
    </>
  );
}

export default Index;
