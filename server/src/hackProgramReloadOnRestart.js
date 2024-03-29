const _ = require("lodash");
const ProgramScheduler = require("./ProgramScheduler");
module.exports = function hackLightControllerRestart(controller) {
  controller.restart = function() {
    try {
      const name = this.currentProgramName;

      if (this.running && this.programScheduler) {
        this.programScheduler.stop();
      }

      _.each(require.cache, (v, key) => {
        if (key.match(/light-programs[\/\\]programs[\/\\]/i)) {
          delete require.cache[key];
        }
      })

      this.programs = _.keyBy(_.map(Object.keys(this.programs), this.loadProgram), "name");

      let config = this.getConfig(this.currentConfig);
      this.programScheduler = new ProgramScheduler(
        new this.programs[name].generator(
          config,
          this.geometry,
          this.shapeMapping,
          this
        ),
        config,
        this.leds,
        this.updateLeds.bind(this)
      );

      this.programScheduler.start();
    } catch(err) {
      console.log(err);
    }
  }
}
