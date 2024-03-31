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

    this.#drawAxes();

    ctx.globalAlpha = transparency;
    this.#drawSamples();
    ctx.globalAlpha = 1;
  }

  #drawAxes() {
    const { ctx, canvas, pixelBounds, dataBounds, axesLabels, margin } = this;
    const { left, right, top, bottom } = pixelBounds;

    // x-axis label
    Graphics.drawText(ctx, {
      text: axesLabels[0],
      loc: [canvas.width / 2, bottom + margin / 2],
      size: margin * 0.6,
    });

    ctx.save();
    ctx.translate(left - margin / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);

    // y-axis label
    Graphics.drawText(ctx, {
      text: axesLabels[1],
      loc: [0, 0],
      size: margin * 0.6,
    });

    ctx.restore();

    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(left, bottom);
    ctx.lineTo(right, bottom);
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "lightgray";
    ctx.stroke();
    ctx.setLineDash([]);

    {
      const dataMin = remapPoint(pixelBounds, dataBounds, [left, bottom]);

      Graphics.drawText(ctx, {
        text: formatNumber(dataMin[0], 2),
        loc: [left, bottom],
        size: margin * 0.3,
        align: "left",
        vAlign: "top",
      });

      ctx.save();
      ctx.translate(left, bottom);
      ctx.rotate(-Math.PI / 2);

      Graphics.drawText(ctx, {
        text: formatNumber(dataMin[1], 2),
        loc: [0, 0],
        size: margin * 0.3,
        align: "left",
        vAlign: "bottom",
      });

      ctx.restore();
    }

    {
      const dataMax = remapPoint(pixelBounds, dataBounds, [left, bottom]);

      Graphics.drawText(ctx, {
        text: formatNumber(dataMax[0], 2),
        loc: [right, bottom],
        size: margin * 0.3,
        align: "right",
        vAlign: "top",
      });

      ctx.save();
      ctx.translate(left, top);
      ctx.rotate(-Math.PI / 2);

      Graphics.drawText(ctx, {
        text: formatNumber(dataMax[1], 2),
        loc: [0, 0],
        size: margin * 0.3,
        align: "right",
        vAlign: "bottom",
      });

      ctx.restore();
    }
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
