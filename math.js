const lerp = (a, b, t) => {
  return a + (b - a) * t;
};

const invLerp = (a, b, v) => {
  return (v - a) / (b - a);
};

/** 0: old, 1: new */
const remap = (a0, b0, a1, b1, v) => {
  return lerp(a1, b1, invLerp(a0, b0, v));
};

const remapPoint = (oldBounds, newBounds, point) => {
  return [
    remap(
      oldBounds.left,
      oldBounds.right,
      newBounds.left,
      newBounds.right,
      point[0]
    ),
    remap(
      oldBounds.top,
      oldBounds.bottom,
      newBounds.top,
      newBounds.bottom,
      point[1]
    ),
  ];
};

const formatNumber = (n, decimal = 0) => {
  return n.toFixed(decimal);
};