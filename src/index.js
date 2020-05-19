import * as BABYLON from 'babylonjs';
// import './ammo.js';
import 'babylonjs-loaders'
import createCar from "./car";
import erratic from './erratic';
import {materials} from "./materials";
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

    // ground.material = gridmaterial

    materials.scene = scene;
    materials.createColor('red', {r: 0.8, g: 0.4, b: 0.5});
    materials.createColor('blue', {r: 0.5, g: 0.4, b: 0.8});
    materials.createColor('green', {r: 0.5, g: 0.8, b: 0.5});
    materials.createColor('black', {r: 0.1, g: 0.1, b: 0.1});
    materials.createTexture('human');
    materials.createTexture('zombie');
    materials.createTexture('grass');
    materials.createTexture('tyre2', 'png');

    // createBox(new BABYLON.Vector3(4, 1, 12), new BABYLON.Vector3(0, 0, 25), new BABYLON.Vector3(-Math.PI / 8, 0, 0), 0);
    // createBox(new BABYLON.Vector3(4, 1, 12), new BABYLON.Vector3(25, 0, 0), new BABYLON.Vector3(-Math.PI / 8, Math.PI / 2, 0), 0);
    // createBox(new BABYLON.Vector3(4, 1, 12), new BABYLON.Vector3(0, 0, -25), new BABYLON.Vector3(Math.PI / 8, 0, 0), 0);
    // createBox(new BABYLON.Vector3(4, 1, 12), new BABYLON.Vector3(-25, 0, 0), new BABYLON.Vector3(Math.PI / 8, Math.PI / 2, 0), 0);

    const ground = BABYLON.Mesh.CreateGround("ground", 100, 100, 2, scene);
    materials['grass'].diffuseTexture.uScale = 200.0;
    materials['grass'].diffuseTexture.vScale = 200.0;

    ground.material = materials['grass'];
    ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, {
        mass: 0,
        friction: 0.5,
        restitution: 0.7
    }, scene);

    ground.position.y = 3.5;

    const border0 = BABYLON.Mesh.CreateBox("border0", 1, scene);
    border0.scaling = new BABYLON.Vector3(1, 10, 100);
    border0.position.y = 3;
    border0.position.x = -50.0;
    border0.checkCollisions = true;

    const border1 = BABYLON.Mesh.CreateBox("border1", 1, scene);
    border1.scaling = new BABYLON.Vector3(1, 10, 100);
    border1.position.y = 3;
    border1.position.x = 50.0;
    border1.checkCollisions = true;

    const border2 = BABYLON.Mesh.CreateBox("border2", 1, scene);
    border2.scaling = new BABYLON.Vector3(100, 10, 1);
    border2.position.y = 3;
    border2.position.z = 50.0;
    border2.checkCollisions = true;

    const border3 = BABYLON.Mesh.CreateBox("border3", 1, scene);
    border3.scaling = new BABYLON.Vector3(100, 10, 1);
    border3.position.y = 3;
    border3.position.z = -50.0;
    border3.checkCollisions = true;

    [border0, border1, border2, border3].forEach(i => {
        i.physicsImpostor = new BABYLON.PhysicsImpostor(i, BABYLON.PhysicsImpostor.BoxImpostor, {
            mass: 0,
            restitution: 0.7
        }, scene);
    });

    timer.restartFunc = updateScene;
    requestAnimationFrame(timer.run);

    const car = createCar(scene);
    erratic.createBodies(scene);
    camera.lockedTarget = car;

    // const camera = new BABYLON.FollowCamera("FollowCam", new BABYLON.Vector3(0, 10, -10), scene);
    // camera.radius = 10;
    // camera.heightOffset = 4;
    // camera.rotationOffset = 0;
    // camera.cameraAcceleration = 0.05;
    // camera.maxCameraSpeed = 400;
    // camera.lockedTarget = car;
    // scene.activeCamera = camera;

    return scene;
};

const engine = createDefaultEngine();
scene = createScene();

if (!engine) throw 'engine should not be null.';

engine.runRenderLoop(() => scene && scene.render());
engine.loadingUIBackgroundColor = "Purple";
window.addEventListener("resize", () => engine.resize());
