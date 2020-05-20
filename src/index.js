import * as BABYLON from 'babylonjs';
// import './ammo.js';
import 'babylonjs-loaders'
import {main} from './main';
import {createVehicle} from "./car";
import erratic from './erratic';
import {materials, mesh} from "./materials";
import {createPlayground} from './playground';
import {createFinishPopup} from './popup';
import timer from "./timer";

const canvas = document.getElementById("renderCanvas");
let scene = null;

const createDefaultEngine = () => new BABYLON.Engine(canvas, true, {preserveDrawingBuffer: true, stencil: true});

const updateScene = () => {
    erratic.update();
    scene.dispose();
    scene = createScene();
    erratic.createBodies(scene);
    timer.update();
};

const createScene = function () {
    const scene = new BABYLON.Scene(engine);

    const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;

    const camera = new BABYLON.ArcRotateCamera("Camera", Math.PI / 1.4, Math.PI / 2.8, 30, new BABYLON.Vector3(0, 0, 0), scene);
    camera.attachControl(canvas, true);

    scene.enablePhysics(new BABYLON.Vector3(0, -10, 0), new BABYLON.AmmoJSPlugin());

    main(scene, camera, canvas);

    return scene;
};

const engine = createDefaultEngine();
scene = createScene();

if (!engine) throw 'engine should not be null.';

engine.runRenderLoop(() => scene && scene.render());
engine.loadingUIBackgroundColor = "Purple";
window.addEventListener("resize", () => engine.resize());
