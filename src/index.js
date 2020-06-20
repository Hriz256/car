import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders'
import {main} from './main';

const canvas = document.getElementById('renderCanvas');
const createDefaultEngine = () => new BABYLON.Engine(canvas, true, {preserveDrawingBuffer: true, stencil: true});

const createScene = async (engine) => {
    const scene = new BABYLON.Scene(engine);

    const sunLight = new BABYLON.HemisphericLight('sun', new BABYLON.Vector3(0, 1, 0), scene);
    sunLight.specular = new BABYLON.Color3(0,0,0); // убрать блики
    sunLight.intensity = 1;

    const camera = new BABYLON.ArcRotateCamera('Camera', Math.PI / 1.4, Math.PI / 2.8, 30, new BABYLON.Vector3(0, 0, 0), scene);
    // camera.attachControl(canvas, true);

    scene.enablePhysics(new BABYLON.Vector3(0, -10, 0), new BABYLON.AmmoJSPlugin());

    await main(scene, canvas);

    return scene;
};

(async () => {
    const engine = createDefaultEngine();
    engine.loadingUIBackgroundColor = 'Purple';

    const scene = await createScene(engine);

    engine.runRenderLoop(() => scene && scene.render());
    window.addEventListener('resize', () => engine.resize());
})();
