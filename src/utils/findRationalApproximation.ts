//see https://www.johndcook.com/blog/2010/10/20/best-rational-approximation/

function farey(x: number, N: number): [number, number] {
  let a = 0;
  let b = 1;
  let c = 1;
  let d = 1;
  while (b <= N && d <= N) {
    const mediant = (a + c) / (b + d);
    if (x === mediant) {
      if (b + d <= N) {
        return [a + c, b + d];
      } else if (d > b) {
        return [c, d];
      } else {
        return [a, b];
      }
    } else if (x > mediant) {
      a = a + c;
      b = b + d;
    } else {
      c = a + c;
      d = b + d;
    }
  }
  if (b > N) {
    return [c, d];
  } else {
    return [a, b];
  }
}

// Iterative greatest common divisor
function gcd(a: number, b: number) {
  a = Math.abs(a);
  b = Math.abs(b);
  if (b > a) {
    const temp = a;
    a = b;
    b = temp;
  }
  while (true) {
    if (b == 0) return a;
    a %= b;
    if (a == 0) return b;
    b %= a;
  }
}

const limit = 1e4;
const precisionMultiplier = 1e2;

export default function findRationalApproximation(x: number, N: number) {
  if (N >= limit || x >= limit) {
    const [numerator, denominator] = [
      Math.round(x * N * precisionMultiplier),
      N * precisionMultiplier,
    ];
    const divider = gcd(numerator, denominator);
    return [Math.round(numerator / divider), Math.round(denominator / divider)];
  }

  const expX = Math.ceil(Math.abs(Math.log10(x)));
  const expN = Math.ceil(Math.log10(N));

  const integerPart = parseInt(x.toFixed(Math.max(expN, expX)));
  const [numerator, denominator] = farey(x - integerPart, N);
  return [
    Math.round(numerator + integerPart * denominator),
    Math.round(denominator),
  ];
}
