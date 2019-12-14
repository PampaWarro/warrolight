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
      <div className="perband-btn">
        <button className="btn btn-sm btn-outline-secondary mb-2" onClick={e => this.toggleMetric(e)}>
          {this.props.config.metric}
        </button>
        <br />
        <button className="btn btn-sm btn-outline-secondary" onClick={e => this.togglePerBandMode(e)}>
          {this.state.perBand ? "Global" : "Per band"}
        </button>
      </div>
    );
  }

  render() {
    return (
      <div className="mic-client text-right">
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

  draw(canvas: HTMLCanvasElement, samples: MicSample[], perBand: boolean) {
    let ctx = canvas.getContext("2d")!;

    for (let sample of samples) {
      const { bass, mid, high, all } = sample;

      let rms = Math.round(all * 255);
      let max = 0;
      let level = Math.min(1, (bass + mid + high) / 3);

      let w = 2;
      let HEIGHT = canvas.height / 3;
      let h;
      if (perBand) {
        ctx.globalCompositeOperation = "screen";

        ctx.fillStyle = "#FF4C4C";
        h = Math.round(bass * HEIGHT);
        ctx.fillRect(canvas.width - 130, HEIGHT - h, w, h);

        h = Math.round(mid * HEIGHT);
        ctx.fillStyle = "#34BF49";
        ctx.fillRect(canvas.width - 130, HEIGHT - h + HEIGHT, w, h);

        h = Math.round(high * HEIGHT);
        ctx.fillStyle = "#0099E5";
        ctx.fillRect(canvas.width - 130, HEIGHT - h + HEIGHT * 2, w, h);

        ctx.globalCompositeOperation = "source-over";
      } else {
        ctx.fillStyle = `rgba(100,100,100)`;
        h = Math.round((rms / 255) * HEIGHT * 3);
        ctx.fillRect(canvas.width - 130, HEIGHT - h + HEIGHT * 2, w, h);
      }

      // ctx.fillStyle = `#ff5500`;
      // Move all left
      let imageData = ctx.getImageData(w, 0, canvas.width - 1, canvas.height);
      ctx.putImageData(imageData, 0, 0);
      // now clear the right-most pixels:
      ctx.clearRect(canvas.width - w, 0, w, canvas.height);

      ctx.fillStyle = "white";
      ctx.font = "12px sans-serif";
      ctx.clearRect(canvas.width - 100, 0, 100, canvas.height);
      ctx.fillText(`MAX Vol: ${Math.round(max * 100)}`, canvas.width - 80, 30);
      // ctx.fillText(`    Vol: ${Math.round(this.averageVolume*100)}`, 310, 30);
      ctx.fillText(`REL Vol: ${Math.round(level * 100)}`, canvas.width - 80, 50);
    }
  }
}
