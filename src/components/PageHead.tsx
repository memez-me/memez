import Head from 'next/head';
import { useAbsoluteUrl } from '../hooks';

type PageHeadProps = {
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
};

function PageHead({ title, subtitle, description, image }: PageHeadProps) {
  const url = useAbsoluteUrl();
  const extendedTitle = subtitle ? `${title} - ${subtitle}` : title;
  description = description ?? extendedTitle;
  image = url(image || '/logo-icon.svg');
  return (
    <Head>
      <title>{extendedTitle}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {/*<meta property="og:image" content={image || url('/logo-icon.svg')} />*/}
      <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      {/*TODO: add normal icon*/}
      {/*<link rel="apple-touch-icon" href="/apple-touch-icon.png" />*/}
      {/*<link rel="manifest" href="/manifest.json" />*/}
      {/*<link*/}
      {/*  rel="apple-touch-icon"*/}
      {/*  sizes="180x180"*/}
      {/*  href="/apple-touch-icon.png"*/}
      {/*/>*/}
      {/*<link*/}
      {/*  rel="icon"*/}
      {/*  type="image/png"*/}
      {/*  sizes="32x32"*/}
      {/*  href="/favicon-32x32.png"*/}
      {/*/>*/}
      {/*<link*/}
      {/*  rel="icon"*/}
      {/*  type="image/png"*/}
      {/*  sizes="16x16"*/}
      {/*  href="/favicon-16x16.png"*/}
      {/*/>*/}
      {/*<link rel="mask-icon" href="/safari-pinned-tab.svg" color="#1b1d28" />*/}
      {/*<link rel="shortcut icon" href="/favicon.ico" />*/}
      <meta name="msapplication-TileColor" content="#1b1d28" />
      <meta name="theme-color" content="#1b1d28" />
    </Head>
  );
}

export default PageHead;
