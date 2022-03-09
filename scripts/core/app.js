import {
  simple, util, Vector2, Vector3, Matrix4, math, ToolOp, PropTypes, NumberConstraints
} from '../path.ux/pathux.js';

import './editor.js';
import {Mesh, MeshTypes} from './mesh.js';
import {Workspace} from './editor.js';
import {FileArgs} from '../path.ux/scripts/simple/file.js';
import {PropertiesBag} from './property_templ.js';
import {Context} from './context.js';

export const STARTUP_FILE_KEY = "_startup_file_1";

export const Properties = {
  steps  : {type: "int", value: 1, min: 0, max: 10, slideSpeed : 5},
  boolVal: {type: "bool", value: true},
};

export class App extends simple.AppState {
  constructor() {
    super(Context);

    this.mesh = undefined;
    this.properties = undefined;

    this.createNewFile(true);

    this.saveFilesInJSON = true;
  }

  createNewFile(noReset = false) {
    if (!noReset) {
      this.reset();
      this.makeScreen();
    }

    this.properties = new PropertiesBag(Properties);

    this.mesh = new Mesh();
    let s = 50;
    let d = 200;
    let v1 = this.mesh.makeVertex([s, s, 0]);
    let v2 = this.mesh.makeVertex([s, s + d, 0]);
    let v3 = this.mesh.makeVertex([s + d, s + d, 0]);
    let v4 = this.mesh.makeVertex([s + d, s, 0]);

    this.mesh.makeFace([v1, v2, v3, v4]);
  }

  saveStartupFile() {
    this.saveFile().then((json) => {
      json = JSON.stringify(json);

      localStorage[STARTUP_FILE_KEY] = json;
      console.log("Saved startup file", (json.length/1024.0).toFixed(2) + "kb");
    });
  }

  loadStartupFile() {
    if (!(STARTUP_FILE_KEY in localStorage)) {
      return;
    }

    try {
      let json = JSON.parse(localStorage[STARTUP_FILE_KEY]);
      this.loadFile(json);
    } catch (error) {
      util.print_stack(error);
      console.warn("Failed to load startup file");
    }
  }

  saveFileSync(objects, args = {}) {
    if (args.useJSON === undefined) {
      args.useJSON = true;
    }

    return super.saveFileSync([
      this.mesh
    ], args);
  }

  saveFile(args = {}) {
    return new Promise((accept, reject) => {
      accept(this.saveFileSync([this.mesh, this.properties], args));
    });
  }

  loadFileSync(data, args = {}) {
    if (args.useJSON === undefined) {
      args.useJSON = true;
    }

    let file = super.loadFileSync(data, args);
    this.mesh = file.objects[0];
    this.properties = file.objects[1] ?? this.properties;

    window.redraw_all();

    return file;
  }

  loadFile(data, args = {}) {
    return new Promise((accept, reject) => {
      accept(this.loadFileSync(data, args));
    });
  }

  draw() {
    for (let sarea of this.screen.sareas) {
      if (sarea.area && sarea.area.draw) {
        sarea.area.draw();
      }
    }
  }

  start() {
    super.start({
      DEBUG: {
        modalEvents: true
      }
    });

    this.loadStartupFile();
  }
}

export function start() {
  console.log("start!");

  let animreq = undefined;

  function f() {
    animreq = undefined;

    _appstate.draw();
  }

  window.redraw_all = function () {
    if (animreq) {
      return;
    }

    animreq = requestAnimationFrame(f);
  }

  window._appstate = new App();
  _appstate.start();

  window.redraw_all();
}