import { Head, Html, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en" className="w-full h-full overflow-hidden">
      <Head />
      <body className="w-full h-full m-0 text-main-accent">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
