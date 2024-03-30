class Graphics {
  static drawPoint(ctx, loc, color = "black", size = 5) {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(...loc, size / 2, 0, Math.PI * 2);
    ctx.fill();
  }
}
