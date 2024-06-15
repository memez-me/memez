import React from 'react';
import PageHead from '../components/PageHead';
import Link from 'next/link';

export function Index() {
  return (
    <>
      <PageHead title="memez" description="memez memecoins app" />
      <div className="flex flex-col justify-center items-center">
        <Link
          href="/create"
          passHref
          rel="noreferrer"
          className="disabled:shadow hover:font-bold hover:text-main-light focus:text-main-light active:text-main-shadow"
        >
          [create memecoin]
        </Link>
      </div>
    </>
  );
}

export default Index;
