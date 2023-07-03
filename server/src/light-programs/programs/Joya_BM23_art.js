const programsByShape = require("../base-programs/ProgramsByShape");
const createNowPlayingTrackProgram = require("../base-programs/NowPlayingTrackProgram");

const VertexGlow = require("./vertexGlow");
const CA = require("./CA");

const intro = programsByShape({
  all:
    [VertexGlow, { enableSound: false }],
});

module.exports = createNowPlayingTrackProgram({
  "Sidi": intro,
  "": CA,
});