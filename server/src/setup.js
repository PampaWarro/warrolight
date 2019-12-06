const _ = require("lodash");
const DeviceMultiplexer = require("./DeviceMultiplexer");
const LightController = require("./LightController");
const { Geometry } = require("./geometry");

exports.loadSetup = function loadSetup(setup) {
  const geometryDefinition = require(`../setups/geometries/${setup.geometry}`);
  const geometry = new Geometry(geometryDefinition);

  const shapeMapping = require(`../setups/shapeMappings/${setup.shapeMapping}`);
  const multiplexer = new DeviceMultiplexer(setup);

  return new LightController(multiplexer, geometry, shapeMapping);
};
