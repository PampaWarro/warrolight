import React from "react";
import { API } from "./api";
import _ from "lodash";

interface Props {
    api: API;
}

export class DJButtons extends React.Component<Props> {

    handleTouchStart(e: React.TouchEvent<HTMLCanvasElement>){
        console.log('touchstart');
    }

    handleTouchEnd(e: React.TouchEvent<HTMLCanvasElement>){
        console.log('touchend');
    }

    handleClick(e: React.MouseEvent<HTMLCanvasElement>){
        console.log('click')
        e.preventDefault();
        this.props.api.sendTap();
    }

    render(){
      return (
          <div>
              <h2>Buttons</h2>
              <div>
                  <canvas width='200px' height='200px'
                          onClick={(e) => this.handleClick(e)}
                          onTouchStart={(e) => this.handleTouchStart(e)}
                          onTouchEnd={(e) => {
                              this.handleTouchEnd(e);
                          }}>Your browser doesn't support canvas</canvas>
              </div>
          </div>
      );
  }
}