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
  // TODO: remove this from instance variable
  canvasCtx!: CanvasRenderingContext2D;

  constructor(props: Props) {
    super(props);
    this.state = { perBand: false };
  }

  toggleMic() {
    const { onSetConfig } = this.props;

    if (this.props.config.sendingMicData) {
      onSetConfig({ sendingMicData: false });
    } else {
      onSetConfig({ sendingMicData: true });
    }
  }

  componentDidMount() {
    this.createHistogramCanvas();
  }

  update(samples: MicSample[]) {
    for (let sample of samples) {
      this.plotPerBandHistogram(sample);
    }
  }

  createHistogramCanvas() {
    const canvas = document.getElementById("music") as HTMLCanvasElement;
    this.canvasCtx = canvas.getContext("2d")!;
    this.canvasCtx.clearRect(
      0,
      0,
      this.canvasCtx.canvas.width,
      this.canvasCtx.canvas.height
    );
  }

  plotPerBandHistogram({ bass, mid, high, all }: MicSample) {
    let r = Math.round(bass * 255);
    let g = Math.round(mid * 255);
    let b = Math.round(high * 255);
    let rms = Math.round(all * 255);
    let max = 0;
    let level = Math.min(1, (r + g + b) / (3 * 255));

    //
    let MIN = 50;
    let w = 2;
    let HEIGHT = this.canvasCtx.canvas.height / 3;
    let h;
    if (this.state.perBand) {
      this.canvasCtx.globalCompositeOperation = "screen";

      this.canvasCtx.fillStyle = `rgba(${Math.max(MIN, r)}, 0, 0)`;
      h = Math.round((r / 255) * HEIGHT);
      this.canvasCtx.fillRect(
        this.canvasCtx.canvas.width - 100,
        HEIGHT - h,
        w,
        h
      );

      h = Math.round((g / 255) * HEIGHT);
      this.canvasCtx.fillStyle = `rgba(0, ${Math.max(MIN, g)}, 0)`;
      this.canvasCtx.fillRect(
        this.canvasCtx.canvas.width - 100,
        HEIGHT - h + HEIGHT,
        w,
        h
      );

      h = Math.round((b / 255) * HEIGHT);
      this.canvasCtx.fillStyle = `rgba(0, 0, ${Math.max(MIN, b)})`;
      this.canvasCtx.fillRect(
        this.canvasCtx.canvas.width - 100,
        HEIGHT - h + HEIGHT * 2,
        w,
        h
      );

      this.canvasCtx.globalCompositeOperation = "source-over";
    } else {
      this.canvasCtx.fillStyle = `rgba(100,100,100)`;
      h = Math.round((rms / 255) * HEIGHT * 3);
      this.canvasCtx.fillRect(
        this.canvasCtx.canvas.width - 100,
        HEIGHT - h + HEIGHT * 2,
        w,
        h
      );
    }

    // this.canvasCtx.fillStyle = `#ff5500`;
    // Move all left
    let imageData = this.canvasCtx.getImageData(
      w,
      0,
      this.canvasCtx.canvas.width - 1,
      this.canvasCtx.canvas.height
    );
    this.canvasCtx.putImageData(imageData, 0, 0);
    // now clear the right-most pixels:
    this.canvasCtx.clearRect(
      this.canvasCtx.canvas.width - w,
      0,
      w,
      this.canvasCtx.canvas.height
    );

    this.canvasCtx.fillStyle = "white";
    this.canvasCtx.font = "12px sans-serif";
    this.canvasCtx.clearRect(
      this.canvasCtx.canvas.width - 100,
      0,
      100,
      this.canvasCtx.canvas.height
    );
    this.canvasCtx.fillText(
      `MAX Vol: ${Math.round(max * 100)}`,
      this.canvasCtx.canvas.width - 80,
      30
    );
    // this.canvasCtx.fillText(`    Vol: ${Math.round(this.averageVolume*100)}`, 310, 30);
    this.canvasCtx.fillText(
      `REL Vol: ${Math.round(level * 100)}`,
      this.canvasCtx.canvas.width - 80,
      50
    );
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

  render() {
    return (
      <div className="mic-client">
        <div className="perdband-btn">
          <a href="#" onClick={e => this.toggleMetric(e)}>
            {this.props.config.metric}
          </a>
          <br />
          <a href="#" onClick={e => this.togglePerBandMode(e)}>
            {this.state.perBand ? "Global" : "Per band"}
          </a>
        </div>

        <canvas
          id="music"
          width="800"
          onClick={this.toggleMic.bind(this)}
          height="200"
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
