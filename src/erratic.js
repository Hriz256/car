import * as BABYLON from 'babylonjs';
import {materials, createBox} from "./materials";
import timer from "./timer";

function getRandomInt(min, max) {
    return Math.floor(min + Math.random() * (max + 1 - min));
}

const getZ = (min, max) => {
    const positiveZ = getRandomInt(min, max);
    const negativeZ = getRandomInt(-max, -min);

    return [positiveZ, negativeZ][getRandomInt(0, 1)];
};

const getX = (min, max) => {
    const positiveX = getRandomInt(min, max);
    const negativeX = getRandomInt(-max, -min);

    return [positiveX, negativeX][getRandomInt(0, 1)];
};

function vecToLocal(vector, mesh) {
    const m = mesh.getWorldMatrix();
    return BABYLON.Vector3.TransformCoordinates(vector, m);
}

function castRay(car) {
    const origin = car.position;
    const forward = vecToLocal(new BABYLON.Vector3(0, 0, 1), car);
    const direction = BABYLON.Vector3.Normalize(forward.subtract(origin));

    console.log(direction)
}

function Body(human, scene) {
    this.isHuman = human ? 'human' : 'zombie';
    this.mass = 10;
    this.x = getX(10, 20);
    this.z = getZ(10, 20);
    this.body = createBox(new BABYLON.Vector3(0.8, 2.5, 0.8), new BABYLON.Vector3(this.x, 0, this.z), new BABYLON.Vector3(0, 0, 0), this.mass, scene);
    this.sphere = BABYLON.MeshBuilder.CreateSphere('', {diameter: 1}, scene);
    this.sphere.position = new BABYLON.Vector3(this.x, 5, this.z);
    this.body.isStop = false;
    this.sphereSpeed = 0.3;
    this.allowExplosion = true;
    this.sphere.isVisible = false;
    this.isChangeDirection = false;

    this.changeDirection = () => {

        scene.registerBeforeRender(() => {
            // castRay(scene.getMeshByName('car'))
            //
            // if (this.sphere.intersectsMesh(scene.getMeshByName('intersectPlane'))) {
            //     this.x = this.sphere.position.x - scene.getMeshByName('intersectPlane').parent.position.x;
            //     this.z = this.sphere.position.z - scene.getMeshByName('intersectPlane').parent.position.z;
            //     // this.sphere.translate(
            //     //     new BABYLON.Vector3(this.sphere.position.x - scene.getMeshByName('intersectPlane').parent.position.x, 0, this.sphere.position.z - scene.getMeshByName('intersectPlane').parent.position.z).normalize(),
            //     //     this.sphereSpeed,
            //     //     BABYLON.Space.WORLD
            //     // );
            // }

            // if (!this.sphere.intersectsMesh(scene.getMeshByName('intersectPlane')) && this.isChangeDirection) {
            //     this.isChangeDirection = false;
            // }

            if (this.sphere.intersectsPoint(new BABYLON.Vector3(this.x, 5, this.z))) {
                this.changeCoords();
            }

            if (!this.body.isStop) {
                // if (this.sphere.intersectsMesh(scene.getMeshByName('intersectPlane'))) {
                //     // this.sphere.translate(
                //     //     new BABYLON.Vector3(this.sphere.position.x - scene.getMeshByName('intersectPlane').parent.position.x, 0, this.sphere.position.z - scene.getMeshByName('intersectPlane').parent.position.z).normalize(),
                //     //     this.sphereSpeed,
                //     //     BABYLON.Space.WORLD
                //     // );
                //
                //     this.x = this.sphere.position.x + (this.sphere.position.x - scene.getMeshByName('intersectPlane').parent.position.x);
                //
                //     this.x = this.x > 45 ? 45 : this.x;
                //     this.x = this.x < -45 ? -45 : this.x;
                //
                //     this.z = this.sphere.position.z + (this.sphere.position.z - scene.getMeshByName('intersectPlane').parent.position.z);
                //
                //     this.z = this.z > 45 ? 45 : this.z;
                //     this.z = this.z < -45 ? -45 : this.z
                // }

                this.sphere.translate(
                    new BABYLON.Vector3(this.x - this.sphere.position.x, 0, this.z - this.sphere.position.z).normalize(),
                    this.sphereSpeed,
                    BABYLON.Space.WORLD
                );

                this.body.lookAt(this.sphere.position);

                const boxPosition = this.body.physicsImpostor.getObjectCenter();
                const vector = new BABYLON.Vector3((this.sphere.position.x - boxPosition.x) * 5, 0, (this.sphere.position.z - boxPosition.z) * 5);
                this.body.physicsImpostor.setLinearVelocity(vector);
            }

            if (this.allowExplosion && this.body.isStop) {
                // this.body.getChildren()[0].runAnim.weight = 0.1;
                this.body.getChildren()[0].idleAnim.weight = 1;
                this.body.getChildren()[0].runAnim.speedRatio = 0;
                this.allowExplosion = false;

                // setTimeout(() => this.body.getChildren()[0].dispose(), 3000);
                // const radius = 6;
                // const strength = 20;
                //
                // new BABYLON.PhysicsHelper(scene).applyRadialExplosionImpulse(
                //     new BABYLON.Vector3(this.body.position.x, 3, this.body.position.z),
                //     {
                //         radius: radius,
                //         strength: strength,
                //         falloff: BABYLON.PhysicsRadialImpulseFalloff.Linear
                //         // BABYLON.PhysicsRadialImpulseFalloff.Linear, // or
                //         //     BABYLON.PhysicsRadialImpulseFalloff.Constant
                //     }
                // );
            }
        });
    };

    this.changeCoordsByIntersect = () => {
        const plane = scene.getMeshByName('intersectPlane').parent;

        this.x = this.sphere.position.x > plane.position.x ? getRandomInt(plane.position.x + 10, 45) : getRandomInt(plane.position.x - 10, -45);
        this.z = this.sphere.position.z > plane.position.z ? getRandomInt(plane.position.z + 10, 45) : getRandomInt(plane.position.z - 10, -45);
    };

    this.changeCoords = () => {
        this.x = getX(20, 45);
        this.z = getZ(20, 45);
    };

    this.body.isOtherBody = this.isHuman;
    this.body.isVisible = false;
    setTimeout(() => this.changeDirection(), 5000);

    return this.body;
}

class Erratic {
    constructor() {
        this.array = [];

        this.params = [
            {name: 'humans ', count: 0},
            {name: 'zombies ', count: 0}
        ];

        this.createScoreText();
    }

    createBodies(scene) {
        this.scene = scene;

        BABYLON.SceneLoader.ImportMesh("", "assets/", "human.babylon", scene, newMeshes => {
            newMeshes.forEach(i => i.scaling = new BABYLON.Vector3(1.3, 1.3, 1.3));

            const run = (newHuman, speed, scene) => {
                const idleRange = newHuman.skeleton.getAnimationRange("YBot_Idle");
                const walkRange = newHuman.skeleton.getAnimationRange("YBot_Walk");
                const runRange = newHuman.skeleton.getAnimationRange("YBot_Run");
                newHuman.idleAnim = scene.beginWeightedAnimation(newHuman.skeleton, idleRange.from, idleRange.to, 0, true);
                newHuman.walkAnim = scene.beginWeightedAnimation(newHuman.skeleton, walkRange.from, walkRange.to, 0, true);
                newHuman.runAnim = scene.beginWeightedAnimation(newHuman.skeleton, runRange.from, runRange.to, speed, true);
            };

            const human = newMeshes[0];
            const body = new Body(human, this.scene);
            this.array.push(body);
            human.position.y = -1.2;
            human.parent = body;
            human.material = materials['red'];
            run(human, 1, scene);

            for (let i = 0; i < 19; i++) {
                const body = new Body(i < 9, this.scene);
                this.array.push(body);

                const newHuman = human.clone('human');

                newHuman.material = materials[i < 9 ? 'red' : 'green'];
                newHuman.position.y = -1.2;
                newHuman.parent = body;
                newHuman.skeleton = human.skeleton.clone("clonedSkeleton");

                run(newHuman, 1, scene);
            }
        });
    }

    createScoreText() {
        this.texts = this.params.map((i, index) => {
            const div = document.createElement('div');
            div.style.position = 'absolute';
            div.style.fontSize = '20px';
            div.style.color = 'white';
            div.style.right = '200px';
            div.style.top = `${50 + index * 50}px`;
            div.textContent = `${i.name}: ${i.count}`;

            document.body.appendChild(div);

            return div;
        });
    }

    updateScore(isHuman) {
        const number = isHuman ? 0 : 1;
        this.texts[number].textContent = `${this.params[number].name}: ${++this.params[number].count}`;

        if (this.params[1].count === 10) {
            confirm('Выигрыш. Повторить?') && setTimeout(() => timer.restartFunc(), 4000)
        }

        if (this.params[0].count === 10) {
            confirm('Проигрыш. Повторить?') && setTimeout(() => timer.restartFunc(), 4000)
        }
    }

    update() {
        this.texts.forEach((i, index) => {
            this.params[index].count = 0;
            this.texts[index].textContent = `${this.params[index].name}: ${this.params[index].count}`
        });

        this.array.forEach(i => i.dispose());
        this.array.length = 0;
    }
}

const erratic = new Erratic();
export default erratic;


