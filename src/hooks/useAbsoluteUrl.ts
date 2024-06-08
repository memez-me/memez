import { useRouter } from 'next/router';

const ORIGIN = 'https://qwadratic.github.io/memez';

export const useAbsoluteUrl = () => {
  const { basePath, locale } = useRouter();
  return (path?: string) =>
    path && path.startsWith('https://')
      ? path
      : `${ORIGIN}${basePath}${locale || ''}${path || ''}`;
};
