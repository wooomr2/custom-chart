class Chart {
  constructor(container, samples, options) {
    this.samples = samples;

    this.axesLabels = options.axesLabels;
    this.styles = options.styles;

    this.canvas = document.createElement("canvas");
    this.canvas.width = options.size;
    this.canvas.height = options.size;
    this.canvas.style = "background-color: white;";
    container.appendChild(this.canvas);

    this.ctx = this.canvas.getContext("2d");

    this.margin = options.size * 0.1;
    this.transparency = 0.5;

    this.dataBounds = this.#getDataBounds();
    this.pixelBounds = this.#getPixelBounds();

    this.#draw();
  }

  #getDataBounds() {
    const { samples } = this;
    const xs = samples.map((s) => s.point[0]);
    const ys = samples.map((s) => s.point[1]);

    const bounds = {
      left: Math.min(...xs),
      right: Math.max(...xs),
      top: Math.max(...ys),
      bottom: Math.min(...ys),
    };

    return bounds;
  }

  #getPixelBounds() {
    const { canvas, margin } = this;
    const bounds = {
      left: margin,
      right: canvas.width - margin,
      top: margin,
      bottom: canvas.height - margin,
    };

    return bounds;
  }

  #draw() {
    const { ctx, canvas, transparency } = this;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = transparency;
    this.#drawSamples();
    ctx.globalAlpha = 1;
  }

  #drawSamples() {
    const { ctx, samples, dataBounds, pixelBounds } = this;
    for (const sample of samples) {
      const { point } = sample;

      // -------- x
      // |  x: left=>right
      // |  y: top=>bottom
      // y
      const pixelLoc = remapPoint(dataBounds, pixelBounds, point);

      Graphics.drawPoint(ctx, pixelLoc);
    }
  }
}
