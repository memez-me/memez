export default function isValidHttpUrl(
  string: string,
  hostnamesToCheck?: string[],
  checkSubdomains = false,
) {
  try {
    const url = new URL(string);
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      (!hostnamesToCheck ||
        hostnamesToCheck.includes(url.hostname) ||
        (checkSubdomains &&
          hostnamesToCheck.some((domain) =>
            url.hostname.endsWith('.' + domain),
          )))
    );
  } catch (_) {
    return false;
  }
}
