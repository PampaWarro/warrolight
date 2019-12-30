import React from "react";
import { MicConfig, MicSample } from "./types";

interface Props {
  config: MicConfig;

  onSetConfig(config: Partial<MicConfig>): void;
}

interface State {
  perBand: boolean;
}

export class MicrophoneViewer extends React.Component<Props, State> {
  canvas: React.RefObject<HTMLCanvasElement>;
  renderer: HistogramRenderer;

  constructor(props: Props) {
    super(props);
    this.state = { perBand: false };
    this.canvas = React.createRef();
    this.renderer = new HistogramRenderer();
  }

  toggleMic() {
    const { onSetConfig } = this.props;

    if (this.props.config.sendingMicData) {
      onSetConfig({ sendingMicData: false });
    } else {
      onSetConfig({ sendingMicData: true });
    }
  }

  update(samples: MicSample[]) {
    this.renderer.draw(this.canvas.current!, samples, this.state.perBand);
  }

  togglePerBandMode(e: React.SyntheticEvent) {
    e.preventDefault();

    this.setState({ perBand: !this.state.perBand });
    return false;
  }

  toggleMetric(e: React.SyntheticEvent) {
    e.preventDefault();

    const { onSetConfig } = this.props;
    let current = this.props.config.metric;

    switch (current) {
      case "Rms":
        onSetConfig({ metric: "FastPeakDecay" });
        return;
      case "FastPeakDecay":
        onSetConfig({ metric: "PeakDecay" });
        return;
      case "PeakDecay":
        onSetConfig({ metric: "Rms" });
        return;
    }
  }

  renderButtons() {
    if (!this.props.config.sendingMicData) {
      return null;
    }

    return (
      <div className="mic-btns">
        <button className="btn btn-sm btn-outline-secondary mb-2" onClick={e => this.toggleMetric(e)}>
          {this.props.config.metric}
        </button>
        <br/>
        <button className="btn btn-sm btn-outline-secondary" onClick={e => this.togglePerBandMode(e)}>
          {this.state.perBand ? "Global" : "Per band"}
        </button>
      </div>
    );
  }

  render() {
    return (
      <div className="mic-client">
        {this.renderButtons()}

        <canvas
          id="music"
          ref={this.canvas}
          onClick={this.toggleMic.bind(this)}
          height="200"
          width="800"
          style={{ opacity: this.props.config.sendingMicData ? "1" : "0.5" }}
        />

        {this.props.config.sendingMicData ? null : (
          <div className={"preview-btn"}>
            Click to TURN ON / OFF server Mic input viz
          </div>
        )}
      </div>
    );
  }
}


class HistogramRenderer {
  pendingAnimationFrame: number | null = null;

  draw(canvas: HTMLCanvasElement, samples: MicSample[], perBand: boolean) {
    if (this.pendingAnimationFrame) {
      window.cancelAnimationFrame(this.pendingAnimationFrame);
    }
    const that = this;
    this.pendingAnimationFrame = window.requestAnimationFrame(() => {
      that.pendingAnimationFrame = null;
      let ctx = canvas.getContext("2d")!;

      let samplesCount = samples.length;

      let minBrightness = 30;
      let barWidth = 2;

      let imageData = ctx.getImageData(barWidth * samplesCount, 0, canvas.width - 1, canvas.height);
      ctx.putImageData(imageData, 0, 0);
      ctx.clearRect(canvas.width - barWidth * samplesCount - 100, 0, barWidth * samplesCount, canvas.height);

      let maxLevel = 0;
      for (let sample of samples) {
        samplesCount--;
        const { bass, mid, high, all } = sample;

        maxLevel = Math.max(all, maxLevel);
        let positionToDraw = canvas.width - 130 - samplesCount * barWidth;

        if (perBand) {
          let r = Math.round(bass * 255);
          let g = Math.round(mid * 255);
          let b = Math.round(high * 255);

          ctx.globalCompositeOperation = "screen";
          let bandHeight = canvas.height / 3;
          ctx.fillStyle = `rgba(${Math.max(minBrightness, r)}, ${0}, ${0})`;
          let barHeight = Math.round(bass * bandHeight);
          ctx.fillRect(positionToDraw, bandHeight - barHeight, barWidth, barHeight);

          barHeight = Math.round(mid * bandHeight);
          ctx.fillStyle = `rgba(${0}, ${Math.max(minBrightness, g)}, ${0})`;
          ctx.fillRect(positionToDraw, bandHeight - barHeight + bandHeight, barWidth, barHeight);

          barHeight = Math.round(high * bandHeight);
          ctx.fillStyle = `rgba(${0}, ${0}, ${Math.max(minBrightness, b)})`;
          ctx.fillRect(positionToDraw, bandHeight - barHeight + bandHeight * 2, barWidth, barHeight);

          ctx.globalCompositeOperation = "source-over";
        } else {
          let bandHeight = canvas.height;
          let barHeight = Math.round(all * bandHeight);

          let brightness = Math.max(60, Math.round(all * 255));
          ctx.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness})`;
          ctx.fillRect(positionToDraw, bandHeight - barHeight, barWidth, barHeight);
        }
      }

      ctx.fillStyle = "white";
      ctx.font = "12px sans-serif";
      ctx.clearRect(canvas.width - 100, 0, 100, canvas.height);
      ctx.fillText(`Max Vol: ${Math.round(maxLevel * 100)}`, canvas.width - 80, 30);
    })
  }
}
