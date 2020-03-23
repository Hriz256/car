import * as BABYLON from 'babylonjs';
import * as Ammo from "ammo.js";
import 'babylonjs-loaders'

const canvas = document.getElementById("renderCanvas");

// const random = (min, max) => {
//     return Math.floor(min + Math.random() * (max + 1 - min));
// };

// function setVisibility(mesh, value) {
//     mesh.isVisible = value;
//
//     const children = mesh.getChildren();
//
//     for (let i = 0; i < children.length; i++) {
//         const child = children[i];
//
//         setVisibility(child, value);
//     }
// }

class Playground {
    constructor() {
        this.engine = this.createDefaultEngine();
        this.scene = this.createScene();
    }

    createScene() {
        const scene = new BABYLON.Scene(this.engine);
        scene.clearColor = BABYLON.Color3.Purple();

        this.camera = new BABYLON.ArcRotateCamera("Camera", Math.PI / -2, Math.PI / 2, 30, BABYLON.Vector3.Zero(), scene);
        this.camera.attachControl(canvas, true);

        // this.camera.lowerRadiusLimit = 30;
        // this.camera.upperRadiusLimit = 40;
        // this.camera.inputs.remove(this.camera.inputs.attached.keyboard);
        // this.camera.inputs.remove(this.camera.inputs.attached.pointers);

        this.light = new BABYLON.DirectionalLight("dir02", new BABYLON.Vector3(-1, -1, 0), scene);
        this.light.intensity = 0.75;

        scene.enablePhysics(new BABYLON.Vector3(0, -70, 0), new BABYLON.AmmoJSPlugin(null, Ammo));

        return scene;
    }

    createDefaultEngine() {
        return new BABYLON.Engine(canvas, true, {preserveDrawingBuffer: true, stencil: true});
    }
}

const playground = new Playground();

const scene = playground.scene;
const engine = playground.engine;
const camera = playground.camera;
const light = playground.light;

function room() {
    var shadowGenerator = new BABYLON.ShadowGenerator(1024, light);

    shadowGenerator.usePercentageCloserFiltering = true;
    shadowGenerator.lambda = 0.8;

    // Playground10
    var ground = BABYLON.Mesh.CreateBox("Ground", 1, scene);
    ground.scaling = new BABYLON.Vector3(100, 1, 100);
    ground.position.y = -1.1;
    ground.checkCollisions = true;

    var groundMat = new BABYLON.StandardMaterial("groundMat", scene);
    groundMat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    groundMat.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    groundMat.backFaceCulling = false;

    ground.material = groundMat;
    ground.receiveShadows = true;

    // Physics
    ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, {
        mass: 0,
        friction: 0.5,
        restitution: 0.7
    }, scene);
}

room();

BABYLON.SceneLoader.ImportMesh("", "assets/", "car.obj", scene, function (newMeshes) {
    const car = new BABYLON.Mesh("car", scene);
    car.position = new BABYLON.Vector3(0, 0, 0);

    const pivotFI = new BABYLON.Mesh("pivotFI", scene);
    pivotFI.parent = car;

    const pivotFO = new BABYLON.Mesh("pivotFO", scene);
    pivotFO.parent = car;

    newMeshes[16].parent = pivotFO;
    newMeshes[18].parent = pivotFI;

    const pivot = new BABYLON.Mesh("pivot", scene); //current centre of rotation
    pivot.position.x = -50;
    car.parent = pivot;
    car.position = new BABYLON.Vector3(50, 0, 0);

    const redMat = new BABYLON.StandardMaterial("redMat", scene);
    redMat.diffuseColor = new BABYLON.Color3(0.74, 0.73, 0.19);
    // redMat.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    redMat.backFaceCulling = false;

    const greenSphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 0.001}, scene);
    greenSphere.material = redMat;

    const hdrTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("assets/environment.dds", scene);
    const plastic = new BABYLON.PBRMaterial("plastic", scene);
    plastic.reflectionTexture = hdrTexture;
    plastic.microSurface = 0.96;
    plastic.backFaceCulling = false;
    plastic.alpha = 0.2;
    plastic.albedoColor = new BABYLON.Color3(0.206, 0.94, 1);
    plastic.reflectivityColor = new BABYLON.Color3(0.003, 0.003, 0.003);

    newMeshes.forEach(i => {
        i.parent = car;
        i.material = redMat
    });

    car.material = redMat;


    camera.target = car;
    // newMeshes[4] - ????? ?????? ??????
    // newMeshes[15] - ?????? ?????? ??????
    // newMeshes[16] - ????? ???????? ??????
    // newMeshes[18] - ?????? ???????? ??????

    const setPivotPointAtBBCenter = (name) => {
        const w = scene.getMeshByName(name);

        w.computeWorldMatrix();

        const bi = w.getBoundingInfo();
        const p = bi.boundingSphere.center.clone();

        w.setPivotPoint(p);
    };

    setPivotPointAtBBCenter("part 025");
    setPivotPointAtBBCenter("part 026");
    setPivotPointAtBBCenter("part 027");
    setPivotPointAtBBCenter("part 028");

    scene.getMeshByName("part 003")._material = plastic;

    var map = {}; //object for multiple key presses
    scene.actionManager = new BABYLON.ActionManager(scene);

    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {
        map[evt.sourceEvent.key] = evt.sourceEvent.type === "keydown";
    }));

    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
        map[evt.sourceEvent.key] = evt.sourceEvent.type === "keydown";
    }));

    var theta = 0;
    var deltaTheta = 0;
    var D = 0; //distance translated per second
    var R = 50; //turning radius, initial set at pivot z value
    var NR; //Next turning radius on wheel turn
    var A = 4; // axel length
    var L = 4; //distance between wheel pivots
    var r = 1.5; // wheel radius
    var psi, psiRI, psiRO, psiFI, psiFO; //wheel rotations
    var phi; //rotation of car when turning

    var F; // frames per second

    scene.registerAfterRender(function () {
        F = engine.getFps();

        if (map[" "] && D < 15) {
            D += 1;
        }

        if (D > 0.15) {
            D -= 0.15;
        } else {
            D = 0;
        }

        let distance = D / F;
        psi = D / (r * F);

        if ((map["a"] || map["A"]) && -Math.PI / 6 < theta) {
            deltaTheta = -Math.PI / 252;
            theta += deltaTheta;
            newMeshes[16].rotate(BABYLON.Axis.Y, deltaTheta, BABYLON.Space.LOCAL);
            newMeshes[18].rotate(BABYLON.Axis.Y, deltaTheta, BABYLON.Space.LOCAL);
            if (Math.abs(theta) > 0.00000001) {
                NR = A / 2 + L / Math.tan(theta);
            } else {
                theta = 0;
                NR = 0;
            }
            pivot.translate(BABYLON.Axis.X, R - NR, BABYLON.Space.LOCAL);
            car.translate(BABYLON.Axis.X, NR - R, BABYLON.Space.LOCAL);
            R = NR;
        }

        if ((map["d"] || map["D"]) && theta < Math.PI / 6) {
            deltaTheta = Math.PI / 252;
            theta += deltaTheta;
            newMeshes[16].rotate(BABYLON.Axis.Y, deltaTheta, BABYLON.Space.LOCAL);
            newMeshes[18].rotate(BABYLON.Axis.Y, deltaTheta, BABYLON.Space.LOCAL);
            if (Math.abs(theta) > 0.00000001) {
                NR = A / 2 + L / Math.tan(theta);
            } else {
                theta = 0;
                NR = 0;
            }
            pivot.translate(BABYLON.Axis.X, R - NR, BABYLON.Space.LOCAL);
            car.translate(BABYLON.Axis.X, NR - R, BABYLON.Space.LOCAL);
            R = NR;

        }

        if (D > 0) {
            phi = D / (R * F);
            if (Math.abs(theta) > 0) {
                pivot.rotate(BABYLON.Axis.Y, phi, BABYLON.Space.WORLD);
                psiRI = D / (r * F);
                psiRO = D * (R + A) / (r * F);
                psiFI = D * Math.sqrt(R * R + L * L) / (r * F);
                psiFO = D * Math.sqrt((R + A) * (R + A) + L * L) / (r * F);

                newMeshes[16].rotate(BABYLON.Axis.X, -psiFI, BABYLON.Space.LOCAL);
                newMeshes[18].rotate(BABYLON.Axis.X, -psiFO, BABYLON.Space.LOCAL);
                newMeshes[4].rotate(BABYLON.Axis.X, -psiRI, BABYLON.Space.LOCAL);
                newMeshes[15].rotate(BABYLON.Axis.X, -psiRO, BABYLON.Space.LOCAL);
            } else {
                pivot.translate(BABYLON.Axis.Z, -distance, BABYLON.Space.LOCAL);
                newMeshes[16].rotate(BABYLON.Axis.X, -psi, BABYLON.Space.LOCAL);
                newMeshes[18].rotate(BABYLON.Axis.X, -psi, BABYLON.Space.LOCAL);
                newMeshes[4].rotate(BABYLON.Axis.X, -psi, BABYLON.Space.LOCAL);
                newMeshes[15].rotate(BABYLON.Axis.X, -psi, BABYLON.Space.LOCAL);
            }
        }
    });
});


engine.runRenderLoop(function () {
    scene && scene.render();

    document.getElementById("fps").innerHTML = engine.getFps().toFixed() + " fps";
});

window.addEventListener("resize", () => engine.resize());



