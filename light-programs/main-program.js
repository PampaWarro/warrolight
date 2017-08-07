const warroStripes = require('./geometry-wchica')
const Geometry = require('./geometry')
const _ = require('lodash');

// const ProgramNames = [
//   'all-off', 'remote-test', 'debugSetup', 'debugShapes', 'all-white',
//   'aliveDots', 'aliveDotsSpeed', 'heart',
//   //'rainbow2', 'white-spear',  'rainbow-horizontal', 'rainbow-hourglass',
//   'rainbow', 'stars', 'musicFlow', 'musicFreqs',  'radial', // 'vertical',  'blink'
//   //'mixRainbowTriangulos', 'mixMusicW', 'mixMusicPsycho',
//   'PROGRAM_Main',  'musicVolumeDot', 'musicVolumeBars', 'speeding-spear', 'water-flood', 'sound-waves' //'fire',  'PROGRAM_Intro'
// ]

const programNames = ["musicFlow", "rainbow", "sound-waves", "musicVolumeDot", "radial", "stars", "debugShapes", "all-off", "all-white"]


module.exports = class LightController {
  constructor(setLightsCbk) {
    this.setLightsCbk = setLightsCbk

    const geometry = new Geometry(warroStripes)

    this.defaultConfig = {
      frequencyInHertz: 60
    }

    this.layout = {
      numberOfLeds: geometry.leds,
      geometry: geometry
    }

    this.leds = []

    this.getLeds = (index) => this.leds[index]

    this.programs = _.keyBy(_.map(programNames, this.loadProgram), 'name')
    this.setCurrentProgram(programNames[0])
  }

  getProgramsSchema() {
    return _.map(this.programs, p => {
      return {name: p.name, config: p.configSchema}
    })
  }

  getCurrentConfig() {
    return this.currentProgram ? this.currentProgram.config : {};
  }

  start() {
    if(this.currentProgram) {
      this.currentProgram.start(
        this.getConfig(this.programs[this.currentProgramName].configSchema),
        (leds) => this.updateLeds(leds),
        () => ({})
      )
      this.running = true;
    }
  }

  stop(){
    this.running = false;
    if(this.currentProgram){
      this.currentProgram.stop();
    }
  }

  getConfig(configSchema = {}) {
    let config = this.defaultConfig;
    for (let paramName in configSchema) {
      if (config[paramName] === undefined && configSchema[paramName].default !== undefined) {
        config[paramName] = configSchema[paramName].default;
      }
    }
    return config
  }

  setCurrentProgram(name) {
    let selectedProgram = this.programs[name];
    if(selectedProgram) {
      if(this.running && this.currentProgram) {
        this.currentProgram.stop();
      }
      this.currentProgramName = name
      let program = this.programs[name];
      let config = this.getConfig(program.configSchema);
      this.currentProgram = new (program.generator)(config, this.layout)
      if(this.running){
        this.start();
      }
    }
  }

  loadProgram(name) {
    const FunctionClass = require('./programs/' + name);
    return {
      name: name,
      configSchema: FunctionClass.configSchema(),
      generator: FunctionClass
    }
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