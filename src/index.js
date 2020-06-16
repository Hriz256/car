import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders'
import {main} from './main';

const canvas = document.getElementById("renderCanvas");
const createDefaultEngine = () => new BABYLON.Engine(canvas, true, {preserveDrawingBuffer: true, stencil: true});

const createScene = () => {
    const scene = new BABYLON.Scene(engine);

    const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
    light.specular = new BABYLON.Color3(0,0,0); // убрать блики
    light.intensity = 1;

    const camera = new BABYLON.ArcRotateCamera("Camera", Math.PI / 1.4, Math.PI / 2.8, 30, new BABYLON.Vector3(0, 0, 0), scene);
    // camera.attachControl(canvas, true);

    scene.enablePhysics(new BABYLON.Vector3(0, -10, 0), new BABYLON.AmmoJSPlugin());

    main(scene, camera, canvas);

    return scene;
};

const engine = createDefaultEngine();
const scene = createScene();

if (!engine) throw 'engine should not be null.';

engine.runRenderLoop(() => scene && scene.render());
engine.loadingUIBackgroundColor = "Purple";
window.addEventListener("resize", () => engine.resize());
