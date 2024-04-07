class Chart {
  constructor(container, samples, options, onClick = null) {
    this.samples = samples;

    this.axesLabels = options.axesLabels;
    this.styles = options.styles;
    this.icon = options.icon;
    this.onClick = onClick;

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

    this.hoveredSample = null;
    this.selectedSample = null;

    this.defaultDataBounds = this.#getDataBounds();
    this.dataBounds = this.#getDataBounds();
    this.pixelBounds = this.#getPixelBounds();

    this.#draw();

    this.#addEventListeners();
  }

  #addEventListeners() {
    const { canvas, dataTrans, dragInfo, samples, dataBounds, pixelBounds } =
      this;

    canvas.onmousedown = (evt) => {
      const dataLoc = this.#getMouse(evt, true);

      dragInfo.start = dataLoc;
      dragInfo.dragging = true;
      dragInfo.end = [0, 0];
      dragInfo.offset = [0, 0];
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
      }

      {
        const pLoc = this.#getMouse(evt);
        const pPoints = samples.map((s) =>
          remapPoint(dataBounds, pixelBounds, s.point)
        );

        const nearestIndex = getNearestIndex(pLoc, pPoints);
        const nearest = samples[nearestIndex];
        const dist = distance(pLoc, pPoints[nearestIndex]);

        this.hoveredSample = dist < this.margin / 2 ? nearest : null;
      }

      this.#draw();
    };

    canvas.onmouseup = () => {
      dataTrans.offset = add(dataTrans.offset, dragInfo.offset);

      dragInfo.dragging = false;
    };

    canvas.onwheel = (evt) => {
      const direction = Math.sign(evt.deltaY);
      const step = 0.02;

      dataTrans.scale += direction * step;
      // set scale min, max
      dataTrans.scale = Math.max(step, Math.min(2, dataTrans.scale));

      this.#updateDataBounds(dataTrans.offset, dataTrans.scale);

      this.#draw();
      evt.preventDefault();
    };

    canvas.onclick = () => {
      if (!equals(dragInfo.offset, [0, 0])) {
        return;
      }

      if (this.hoveredSample) {
        if (this.selectedSample == this.hoveredSample) {
          this.selectedSample = null;
        } else {
          this.selectedSample = this.hoveredSample;
        }
      } else {
        this.selectedSample = null;
      }

      if (this.onClick) {
        this.onClick(this.selectedSample);
      }

      this.#draw();
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
    const { canvas, pixelBounds, defaultDataBounds } = this;

    const rect = canvas.getBoundingClientRect();
    const pixelLoc = [evt.clientX - rect.left, evt.clientY - rect.top];

    if (dataSpace) {
      const dataLoc = remapPoint(pixelBounds, defaultDataBounds, pixelLoc);
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
    const {
      ctx,
      canvas,
      transparency,
      hoveredSample,
      selectedSample,
      samples,
    } = this;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.globalAlpha = transparency;

    this.#drawSamples(samples);

    ctx.globalAlpha = 1;

    if (hoveredSample) {
      this.#emphasizeSample(hoveredSample);
    }

    if (selectedSample) {
      this.#emphasizeSample(selectedSample, "yellow");
    }

    this.#drawAxes();
  }

  selectSample(sample) {
    this.selectedSample = sample;
    this.#draw();
  }

  #emphasizeSample(sample, color = "white") {
    const { ctx, dataBounds, pixelBounds, margin } = this;
    const pLoc = remapPoint(dataBounds, pixelBounds, sample.point);

    const gradient = ctx.createRadialGradient(...pLoc, 0, ...pLoc, margin);

    gradient.addColorStop(0, color);
    // white: rgb(0,0,0), black: rgb(255,255,255)
    // alpha: 0: 완전투명 ~ 1: 완전불투명
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    Graphics.drawPoint(ctx, pLoc, gradient, margin * 2);

    this.#drawSamples([sample]);
  }

  #drawAxes() {
    const { ctx, canvas, pixelBounds, dataBounds, axesLabels, margin } = this;
    const { left, right, top, bottom } = pixelBounds;

    // clear outside points
    {
      ctx.clearRect(0, 0, canvas.width, margin);
      ctx.clearRect(0, 0, margin, canvas.height);
      ctx.clearRect(canvas.width - margin, 0, margin, canvas.height);
      ctx.clearRect(0, canvas.height - margin, canvas.width, margin);
    }

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
      const dataMax = remapPoint(pixelBounds, dataBounds, [right, top]);

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

  #drawSamples(samples) {
    const { ctx, dataBounds, pixelBounds, styles, icon } = this;
    for (const sample of samples) {
      const { point, label } = sample;

      // -------- x
      // |  x: left=>right
      // |  y: top=>bottom
      // y
      const pixelLoc = remapPoint(dataBounds, pixelBounds, point);

      switch (icon) {
        case "image":
          Graphics.drawImage(ctx, {
            image: styles[label].image,
            loc: pixelLoc,
          });
          break;
        case "text":
          Graphics.drawText(ctx, {
            text: styles[label].text,
            loc: pixelLoc,
          });
          break;
        default:
          Graphics.drawPoint(ctx, pixelLoc, styles[label].color);
          break;
      }
    }
  }
}
