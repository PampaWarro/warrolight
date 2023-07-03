const _ = require("lodash");
const DeviceMultiplexer = require("./DeviceMultiplexer");
const LightController = require("./LightController");
const { Geometry } = require("./geometry");

exports.loadSetup = function loadSetup(setup) {
  const geometryDefinition = require(`../setups/geometries/${setup.geometry}`);
  let stripes = geometryDefinition.stripes;
  if (!stripes) {
    // Old style geometry definiton, exports stripes array directly.
    stripes = geometryDefinition;
  }
  const geometry = new Geometry(stripes, geometryDefinition);

  const shapeMapping = require(`../setups/shape-mappings/${setup.shapeMapping}`);
  const multiplexer = new DeviceMultiplexer(setup);
  const presetsFile = setup.presetsFile || "default";

  return new LightController(multiplexer, geometry, shapeMapping, presetsFile);
};
