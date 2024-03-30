const N = 1000;

const samples = [];
for (let i = 1; i < N; i++) {
  const type = Math.random() < 0.5 ? "basic" : "sport";
  const km = lerp(3000, 300000, Math.random());
  const price =
    remap(3000, 300000, 9000, 900, km) +
    lerp(-2000, 2000, Math.random()) +
    (type == "basic" ? 0 : 5000);

  samples.push({
    id: i,
    label: type,
    point: [km, price],
  });
}
