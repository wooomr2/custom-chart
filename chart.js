class Chart {
  constructor(container, samples, options) {
    this.samples = samples;

    this.axesLabels = options.axesLabels;
    this.styles = options.styles;
    this.icon = options.icon;

    this.canvas = document.createElement("canvas");
    this.canvas.width = options.size;
    this.canvas.height = options.size;
    this.canvas.style = "background-color: white;";
    container.appendChild(this.canvas);

    this.ctx = this.canvas.getContext("2d");

    this.margin = options.size * 0.1;
    this.transparency = 0.7;

    this.dataTrans = {
      offset: [0, 0],
      scale: 1,
    };
    this.dragInfo = {
      start: [0, 0],
      end: [0, 0],
      offset: [0, 0],
      dragging: false,
    };

    this.defaultDataBounds = this.#getDataBounds();
    this.dataBounds = this.#getDataBounds();
    this.pixelBounds = this.#getPixelBounds();

    this.#draw();

    this.#addEventListeners();
  }

  #addEventListeners() {
    const { canvas, dataTrans, dragInfo } = this;

    canvas.onmousedown = (evt) => {
      const dataLoc = this.#getMouse(evt, true);
      dragInfo.start = dataLoc;
      dragInfo.dragging = true;
      console.log(dataLoc);
    };

    canvas.onmousemove = (evt) => {
      if (dragInfo.dragging) {
        const dataLoc = this.#getMouse(evt, true);
        dragInfo.end = dataLoc;
        dragInfo.offset = scale(
          subtract(dragInfo.start, dragInfo.end),
          dataTrans.scale
        );

        const newOffset = add(dataTrans.offset, dragInfo.offset);

        this.#updateDataBounds(newOffset, dataTrans.scale);
        this.#draw();
      }
    };

    canvas.onmouseup = (evt) => {
      dataTrans.offset = add(dataTrans.offset, dragInfo.offset);
      dragInfo.dragging = false;
    };

    canvas.onwheel = (evt) => {
      const direction = Math.sign(evt.deltaY);
      const step = 0.02;

      dataTrans.scale += direction * step;
      // set scale min, max
      dataTrans.scale = Math.max(step, Math.min(1, dataTrans.scale));

      this.#updateDataBounds(dataTrans.offset, dataTrans.scale);

      this.#draw();
      evt.preventDefault();
    };
  }

  #updateDataBounds(offset, scale) {
    const { dataBounds, defaultDataBounds: defaults } = this;

    dataBounds.left = defaults.left + offset[0];
    dataBounds.right = defaults.right + offset[0];
    dataBounds.top = defaults.top + offset[1];
    dataBounds.bottom = defaults.bottom + offset[1];

    const center = [
      dataBounds.left + dataBounds.right / 2,
      dataBounds.top + dataBounds.bottom / 2,
    ];

    // R^2 Space이므로 scale^2
    dataBounds.left = lerp(center[0], dataBounds.left, scale ** 2);
    dataBounds.right = lerp(center[0], dataBounds.right, scale ** 2);
    dataBounds.top = lerp(center[1], dataBounds.top, scale ** 2);
    dataBounds.bottom = lerp(center[1], dataBounds.bottom, scale ** 2);
  }

  #getMouse(evt, dataSpace = false) {
    const rect = this.canvas.getBoundingClientRect();
    const pixelLoc = [evt.clientX - rect.left, evt.clientY - rect.top];

    if (dataSpace) {
      const dataLoc = remapPoint(
        this.pixelBounds,
        this.defaultDataBounds,
        pixelLoc
      );
      return dataLoc;
    }

    return pixelLoc;
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
      const { point, label } = sample;

      // -------- x
      // |  x: left=>right
      // |  y: top=>bottom
      // y
      const pixelLoc = remapPoint(dataBounds, pixelBounds, point);

      switch (this.icon) {
        case "image":
          Graphics.drawImage(ctx, {
            image: this.styles[label].image,
            loc: pixelLoc,
          });
          break;
        case "text":
          Graphics.drawText(ctx, {
            text: this.styles[label].text,
            loc: pixelLoc,
          });
          break;
        default:
          Graphics.drawPoint(ctx, pixelLoc, this.styles[label].color);
          break;
      }
    }
  }
}
