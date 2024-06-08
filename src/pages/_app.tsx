import type { AppProps } from 'next/app';
import { Web3Provider } from '../providers';
import { Layout } from '../components/Layout';
import '../../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Web3Provider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </Web3Provider>
  );
}
