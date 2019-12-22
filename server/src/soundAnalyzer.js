const glob = require("glob");
const path = require("path");
const _ = require("lodash");

// Load and initialize modules from "soundmodules" dir.
function loadModules(config) {
  const modules = {};
  glob.sync(__dirname + "/soundmodules/*.js")
      .concat(glob.sync(__dirname + "/soundmodules/*.ts"))
      .forEach(function(file) {
        const id = path.parse(path.basename(file)).name;
        if (id in modules) {
          throw `Duplicate module name ${id}.`
        }
        const module = require(path.resolve(file));
        const moduleInstance = module.init(config);
        if (!moduleInstance.run) {
          console.warn(`Module '${id}' has no run function.`);
        }
        try {
          modules[id] = {
            id : id,
            deps : module.deps,
            instance : moduleInstance
          };
        } catch (e) {
          console.error(`Failed to initialize module '${id}'.`);
          throw e;
        }
      });
  checkModuleDeps(modules);
  return modules;
}

// Sort modules to satisfy dependency DAG.
function topologicalSort(modules) {
  const sorted = [];
  const satisfied = [];
  const edges = {};
  const reverseEdges = {};
  _.forOwn(modules, function(module, id) {
    if (!module.deps || !module.deps.length) {
      satisfied.push(module);
    } else {
      module.deps.forEach(function(dep) {
        edges[dep] = edges[dep] || new Set();
        edges[dep].add(id);
        reverseEdges[id] = reverseEdges[id] || new Set();
        reverseEdges[id].add(dep);
      });
    }
  });
  if (satisfied.length == 0) {
    throw new Error("No modules with 0 dependencies, nowhere to start.");
  }
  while (satisfied.length > 0) {
    const module = satisfied.pop();
    sorted.push(module);
    if (!_.has(edges, module.id)) {
      continue;
    }
    edges[module.id].forEach(function(e) {
      edges[module.id].delete(e);
      reverseEdges[e].delete(module.id);
      if (reverseEdges[e].size == 0) {
        satisfied.push(modules[e]);
      }
    });
  }
  _.forOwn(reverseEdges, function(deps, id) {
    if (deps && deps.size > 0) {
      throw `Module '${id}' has unsatisfiable deps '${
          Array.from(deps)}' (cycle).`;
    }
  });
  return sorted;
}

// Check if some module depends on an undefined module.
function checkModuleDeps(modules) {
  _.forOwn(modules, function(module, id) {
    _.forEach(module.deps, function(dep) {
      if (!_.has(modules, dep)) {
        throw `Module '${id}' has unsatisfiable dep '${dep}'.`;
      }
    });
  });
}

class SoundAnalyzer {
  constructor(config) {
    this.previousFrame = null;
    this.currentFrame = null;
    this._modules = topologicalSort(loadModules(config));
  }

  processAudioFrame(frame) {
    // Run all modules in order.
    this._modules.forEach(module => {
      if (module.instance.run) {
        module.instance.run(frame, this);
      }
    });
    return frame;
  }
}

module.exports = {SoundAnalyzer}
