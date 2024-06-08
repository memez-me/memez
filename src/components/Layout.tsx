import React, { ReactNode } from 'react';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="flex flex-col w-full h-full">
        <div className="flex flex-row self-end">
          <w3m-button />
        </div>
        <div className="flex flex-col">{children}</div>
      </div>
      <div id="modals-container" />
    </>
  );
}
