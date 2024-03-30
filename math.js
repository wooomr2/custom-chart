const lerp = (a, b, t) => {
  return a + (b - a) * t;
};

const invLerp = (a, b, v) => {
  return (v - a) / (b - a);
};

const remap = (a0, b0, a1, b1, v) => {
  return lerp(a1, b1, invLerp(a0, b0, v));
};

const formatNumber = (n, decimal = 0) => {
  return n.toFixed(decimal);
};
