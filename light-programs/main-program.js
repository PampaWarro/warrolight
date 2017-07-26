// import { default as warroStripes } from '../geometry/geometry-wchica'
// import { default as warroStripes } from '../geometry/geometry-wgrande'
const warroStripes = require('./geometry-wchica')
const Geometry = require('./geometry')

// const ProgramNames = [
//   'all-off', 'remote-test', 'debugSetup', 'debugShapes', 'all-white',
//   'aliveDots', 'aliveDotsSpeed', 'heart',
//   //'rainbow2', 'white-spear',  'rainbow-horizontal', 'rainbow-hourglass',
//   'rainbow', 'stars', 'musicFlow', 'musicFreqs',  'radial', // 'vertical',  'blink'
//   //'mixRainbowTriangulos', 'mixMusicW', 'mixMusicPsycho',
//   'PROGRAM_Main',  'musicVolumeDot', 'musicVolumeBars', 'speeding-spear', 'water-flood', 'sound-waves' //'fire',  'PROGRAM_Intro'
// ]

const programNames = ["radial", "stars"]


module.exports = class LightProgram {
  constructor(setLightsCbk) {
    this.setLightsCbk = setLightsCbk

    const geometry = new Geometry(warroStripes)

    this.config = {
      frequencyInHertz: 60
    }

    this.layout = {
      numberOfLeds: geometry.leds,
      geometry: geometry
    }

    const programs = this.programs = this.getPrograms();


    this.currentProgramName = 'radial'
    let initialConfig = this.getConfig(programs[this.currentProgramName].config);
    this.currentProgram = new (programs[this.currentProgramName].func)(initialConfig, this.layout)

    this.leds = []

    this.getLeds = (index) => this.leds[index]
  }

  startProgram() {
    this.currentProgram.start(
      this.getConfig(this.programs[this.currentProgramName].config),
      (leds) => this.updateLeds(leds),
      () => ({})
    )
  }

  getConfig(configDef = {}) {
    for (let paramName in configDef) {
      if (this.config[paramName] === undefined && configDef[paramName].default !== undefined) {
        this.config[paramName] = configDef[paramName].default;
      }
    }
    return this.config
  }

  setCurrentProgram(name) {
    let selectedProgram = this.programs[name];
    let updatedConfig = this.getConfig(selectedProgram.config);
  }

  loadProgram(name) {
    const FunctionClass = require('./' + name);
    return {
      name: name,
      config: FunctionClass.configSchema ? FunctionClass.configSchema() : FunctionClass.config,
      func: FunctionClass
    }
  }

  getPrograms() {
    const Programs = {}
    for (let program of programNames) {
      Programs[program] = this.loadProgram(program)
    }
    return Programs
  }

  updateLeds(leds) {
    this.setLightsCbk(leds)
  }

  // render() {
  //   let menuItems = [];
  //   for (let key in this.state.programs){
  //     if(key === this.state.selected){
  //       menuItems.push( <Item key={key} className="selected" onClick={e => this.handleProgramClick(key, e)}>{this.state.programs[key].name}</Item>)
  //     } else {
  //       menuItems.push( <Item key={key} onClick={e => this.handleProgramClick(key, e)}>{this.state.programs[key].name}</Item>)
  //     }
  //   }
  //
  //   let currentProgram = this.state.programs[this.state.selected];
  //
  //   let configOptions = [];
  //   for (let paramName in currentProgram.config){
  //     if(currentProgram.config[paramName].type === Boolean){
  //       configOptions.push(<BooleanParam key={paramName} configDefinition={currentProgram.config[paramName]} value={this.state.config[paramName]} updateConfig={ v => this.userUpdateConfigField(paramName, v) } field={paramName}/>);
  //     } else {
  //       configOptions.push(<NumberParam key={paramName} configDefinition={currentProgram.config[paramName]} value={this.state.config[paramName]} updateConfig={ v => this.userUpdateConfigField(paramName, v) } field={paramName}/>);
  //     }
  //   }
  //
  //   let state = "Desconectado del server";
  //   let stateClass = "state-danger"
  //   if(this.props.connected){
  //     state = this.props.serverState || "Connected";
  //     stateClass = this.props.serverState == "dj-action" ? "state-warning" : "state-ok"
  //
  //     if(state == "dj-action" && this.props.stateTimeRemaining){
  //       state += ` (quedan ${(this.props.stateTimeRemaining/1000).toFixed(1)}s)`
  //     }
  //   }
  //
  //   let simulatorPart = null;
  //   if(this.master){
  //     simulatorPart = <div className="simulator">
  //       <h3>Current Program: { currentProgram.name } </h3>
  //       <Lights ref="simulator" width="600" height="346" stripes={warroStripes} getColor={this.getLeds}/>
  //     </div>
  //   } else {
  //     simulatorPart = <div className="simulator">
  //       <h3>Current Program: { currentProgram.name } </h3>
  //     </div>
  //   }
  //
  //   {
  //     return (<div>
  //       <div className={"state "+stateClass}>{ state }</div>
  //       <div className="contain">
  //         {simulatorPart}
  //         <div className="controls">
  //           <div>
  //             <h2>Pampa Warro { this.master ? 'Master' : 'Slave' }</h2>
  //           </div>
  //           <div className="menuItems">{ menuItems }</div>
  //           <div className="configuration">
  //             <h3>Configuration</h3>
  //             {configOptions}
  //           </div>
  //         </div>
  //       </div>
  //     </div>)
  //   }
  // }
}
//
// class NumberParam {
//   constructor(props){
//     this.field = props.field;
//     this.min = (props.configDefinition || {}).min || 0;
//     this.max = (props.configDefinition || {}).max || 100;
//     this.step = (props.configDefinition || {}).step || 1;
//     this.state = {value: this.getVal()}
//     this.handleChange = this.handleChange.bind(this);
//     this.name = ""+Math.random();
//   }
//
//   handleChange(event) {
//     this.setVal(event.target.value);
//   }
//
//   getVal(){
//     return  this.props.value;
//   }
//
//   setVal(val){
//     let value = parseFloat(val);
//     this.setState({value: value});
//     this.props.updateConfig(value);
//   }
//
//   render() {
//     return (
//     <div className="config-item">
//       <span>{this.field}:&nbsp;</span>
//       <div>
//         <strong>{this.props.value}&nbsp;</strong>
//         <input type="range" name={this.name}
//         min={this.min} step={this.step} max={this.max} value={this.props.value} onChange={this.handleChange}/>
//       </div>
//     </div>
//     );
//   }
// }
//
//
// class BooleanParam  {
//   constructor(props){
//     this.field = props.field;
//     this.state = {value: this.getVal()}
//     this.handleChange = this.handleChange.bind(this);
//     this.name = ""+Math.random();
//   }
//
//   handleChange(event) {
//     this.setVal(event.target.checked);
//   }
//
//   getVal(){
//     return  this.props.value;
//   }
//
//   setVal(val){
//     let value = val;
//     this.props.updateConfig(value);
//   }
//
//   render() {
//     return (
//       <div className="config-item">
//         <span>{this.field}:&nbsp;</span>
//         <div>
//           <strong>{this.props.value}&nbsp;</strong>
//           <input type="checkbox" name={this.name} checked={this.props.value} onChange={this.handleChange}/>
//         </div>
//       </div>
//     );
//   }
// }