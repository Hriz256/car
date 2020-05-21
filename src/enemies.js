import * as BABYLON from 'babylonjs';
import {materials, mesh} from './materials';
import {car} from './car';

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

const run = (newHuman, speed, scene) => {
    const idleRange = newHuman.skeleton.getAnimationRange('YBot_Idle');
    const walkRange = newHuman.skeleton.getAnimationRange('YBot_Walk');
    const runRange = newHuman.skeleton.getAnimationRange('YBot_Run');

    newHuman.idleAnim = scene.beginWeightedAnimation(newHuman.skeleton, idleRange.from, idleRange.to, 0, true);
    newHuman.walkAnim = scene.beginWeightedAnimation(newHuman.skeleton, walkRange.from, walkRange.to, 0, true);
    newHuman.runAnim = scene.beginWeightedAnimation(newHuman.skeleton, runRange.from, runRange.to, speed, true);
};

class Body {
    constructor(index, scene) {
        this.scene = scene;
        this.bodyHeight = 2.5;
        this.isHuman = index < 10;
        this.mass = 10;
        this.x = getX(20, 45);
        this.z = getZ(20, 45);
        this.body = null;
        this.isStop = false;
        this.sphereSpeed = 0.3;
    }

    createSkeleton() {
        new BABYLON.SceneLoader.ImportMesh('', 'assets/', 'human.babylon', this.scene, newMeshes => {
            const human = newMeshes[0];
            Array.from(newMeshes, item => item.scaling.set(1.3, 1.3, 1.3));

            human.position.y = -this.bodyHeight / 2;
            human.material = materials[this.isHuman ? 'green' : 'red'];
            human.parent = this.body;

            run(human, 1, this.scene);
        });
    }

    createBody() {
        this.body = mesh.createBox({
            size: {x: 0.8, y: this.bodyHeight, z: 0.8},
            position: {x: this.x, y: 0, z: this.z},
            material: materials['lightColor']
        });
        this.body.setPhysics({mass: this.mass});
        this.body.isVisible = false;

        this.sphere = mesh.createSphere({
            diameter: 1,
            position: {x: this.x, y: this.bodyHeight / 2, z: this.z},
            material: materials['lightColor']
        });
        // this.sphere.isVisible = false;

        this.createSkeleton();
    }

    updateBody() {
        this.changeCoords();

        this.body.rotationQuaternion = new BABYLON.Quaternion();
        this.body.position.set(this.x, 0, this.z);
        this.sphere.position.set(this.x, this.bodyHeight / 2, this.z)
        this.body.isStop = false;

        run(this.body.getChildren()[0], 1, this.scene);
    }

    move() {
        this.sphere.translate(
            new BABYLON.Vector3(this.x - this.sphere.position.x, this.bodyHeight / 2, this.z - this.sphere.position.z).normalize(),
            this.sphereSpeed,
            BABYLON.Space.WORLD
        );

        this.body.lookAt(this.sphere.position);
        this.setLinearVelocity();

        if (this.sphere.intersectsPoint(new BABYLON.Vector3(this.x, this.bodyHeight / 2, this.z))) {
            this.changeCoords();
        }

        if (this.scene.getMeshByName('intersectBox') && this.sphere.intersectsMesh(this.scene.getMeshByName('intersectBox'))) {
            this.x = this.sphere.position.x - car.chassisMesh.position.x;
            this.z = this.sphere.position.z - car.chassisMesh.position.z;

            this.sphere.translate(
                new BABYLON.Vector3(this.sphere.position.x - car.chassisMesh.position.x, this.bodyHeight / 2, this.sphere.position.z - car.chassisMesh.position.z).normalize(),
                this.sphereSpeed,
                BABYLON.Space.WORLD
            );
        }
    }

    setLinearVelocity() {
        const boxPosition = this.body.physicsImpostor.getObjectCenter();
        const vector = new BABYLON.Vector3((this.sphere.position.x - boxPosition.x) * 5, 0, (this.sphere.position.z - boxPosition.z) * 5);

        this.body.physicsImpostor.setLinearVelocity(vector);
    }

    changeCoords() {
        this.x = getX(20, 45);
        this.z = getZ(20, 45);
    }
}

const createEnemies = (scene) => {
    const enemiesCount = {
        'humans': 0,
        'zombies': 0
    };

    const getEnemies = () => {
        return Array.from({length: 20}, (item, index) => {
            const enemy = new Body(index, scene);
            enemy.createBody();

            return enemy;
        });
    };

    let enemies = getEnemies();

    return {
        getEnemiesArray() {
            return enemies;
        },

        updateEnemiesCount(isHuman) {
            return ++enemiesCount[isHuman ? 'humans' : 'zombies'];
        },

        restart() {
            Array.from(enemies, item => {
                item.updateBody();
            });

            enemiesCount['humans'] = 0;
            enemiesCount['zombies'] = 0;
        },

        checkVictory() {
            if (enemiesCount['zombies'] === 10) {
                return 'zombies';
            }

            if (enemiesCount['humans'] === 10) {
                return 'humans';
            }

            return false;
        }
    }
};

export {createEnemies};


