import * as BABYLON from 'babylonjs';
import {materials, mesh} from './materials';
import {car} from './car/car';

function getRandomInt(min, max) {
    return Math.floor(min + Math.random() * (max + 1 - min));
}

const getPoint = (min, max) => {
    const positiveZ = getRandomInt(min, max);
    const negativeZ = getRandomInt(-max, -min);

    return [positiveZ, negativeZ][getRandomInt(0, 1)];
};

// Запускаем анимацию бега
const run = (newHuman, speed, scene) => {
    const idleRange = newHuman.skeleton.getAnimationRange('YBot_Idle');
    const walkRange = newHuman.skeleton.getAnimationRange('YBot_Walk');
    const runRange = newHuman.skeleton.getAnimationRange('YBot_Run');

    newHuman.idleAnim = scene.beginWeightedAnimation(newHuman.skeleton, idleRange.from, idleRange.to, 0, true);
    newHuman.walkAnim = scene.beginWeightedAnimation(newHuman.skeleton, walkRange.from, walkRange.to, 0, true);
    newHuman.runAnim = scene.beginWeightedAnimation(newHuman.skeleton, runRange.from, runRange.to, speed, true);
};

class Body {
    constructor(index, scene, human) {
        this.scene = scene;
        this.bodyHeight = 2.3;
        this.human = human;
        this.isHuman = index < 10;
        this.mass = 50;
        this.x = getPoint(20, 45);
        this.z = getPoint(20, 45);
        this.body = null;
        this.isStop = false;
        this.sphereSpeed = 0.3;
    }

    createSkeleton() {
        const human = this.human.clone('human');
        human.skeleton = this.human.skeleton.clone('skeleton');

        human.scaling.set(1.3, 1.3, 1.3);
        human.position.y = -this.bodyHeight / 2;
        human.material = materials[this.isHuman ? 'green' : 'red'];
        human.parent = this.body;
        human.isVisible = true;

        run(human, 1, this.scene);
    }

    createBody() {
        // Создаём физическую коробку, которая является родителем человечка
        this.body = mesh.createBox({
            size: {x: this.bodyHeight * 0.6, y: this.bodyHeight, z: this.bodyHeight * 0.6},
            position: {x: this.x, y: 0, z: this.z},
            material: materials['lightColor'],
            visible: true
        });
        this.body.setPhysics({mass: this.mass, friction: 1, restitution: 0});

        // Создаём сферу коробку, за которой будет бегать человечек - надо для того, чтобы повороты не были резкими
        this.sphere = mesh.createSphere({
            diameter: 1,
            position: {x: this.x, y: this.bodyHeight / 2, z: this.z},
            material: materials['lightColor'],
        });

        this.createSkeleton();
    }

    updateBody() {
        this.changeCoords();

        this.body.dispose();
        this.sphere.dispose();
        this.isStop = false;

        this.createBody();
    }

    move() {
        // Если человечек попадает в квадратную зону вокруг машины - меняем направление (чтобы он не бежал на машину)
        if (this.scene.getMeshByName('intersectBox') && this.sphere.intersectsMesh(this.scene.getMeshByName('intersectBox'))) {
            this.x = this.sphere.position.x - car.chassisMesh.position.x;
            this.z = this.sphere.position.z - car.chassisMesh.position.z;

            this.sphere.translate(
                new BABYLON.Vector3(this.sphere.position.x - car.chassisMesh.position.x, 0, this.sphere.position.z - car.chassisMesh.position.z).normalize(),
                this.sphereSpeed,
                BABYLON.Space.WORLD
            );
        }

        this.sphere.translate(
            new BABYLON.Vector3(this.x - this.sphere.position.x, 0, this.z - this.sphere.position.z).normalize(),
            this.sphereSpeed,
            BABYLON.Space.WORLD
        );

        this.body.lookAt(this.sphere.position); // поворачиваем человечка в сторону движения
        this.setLinearVelocity();

        if (this.sphere.intersectsPoint(new BABYLON.Vector3(this.x, this.bodyHeight / 2, this.z))) {
            this.changeCoords();
        }
    }

    stopRun() {
        this.body.getChildren()[0].idleAnim.weight = 1; // руки вдоль туловища
        this.body.getChildren()[0].runAnim.speedRatio = 0; // останавливаем анимацию бега
    }

    setLinearVelocity() {
        const boxPosition = this.body.physicsImpostor.getObjectCenter();
        const vector = new BABYLON.Vector3(this.sphere.position.x - boxPosition.x, 0, this.sphere.position.z - boxPosition.z);

        this.body.physicsImpostor.setLinearVelocity(Math.hypot(vector.x, vector.z) > 0.5 ? vector.scale(5) : vector);
    }

    changeCoords() {
        this.x = getPoint(20, 45);
        this.z = getPoint(20, 45);
    }
}

const createEnemies = (scene, human) => {
    const enemiesCount = {
        'humans': 0,
        'zombies': 0
    };

    const newHuman = human.loadedMeshes[0];
    newHuman.isVisible = false;

    const enemies = Array.from({length: 20}, (item, index) => {
        const enemy = new Body(index, scene, newHuman);
        enemy.createBody();

        return enemy;
    });

    return {
        getEnemiesArray() {
            return enemies;
        },

        updateEnemiesCount(isHuman) {
            return ++enemiesCount[isHuman ? 'humans' : 'zombies'];
        },

        restart() {
            Array.from(enemies, item => item.updateBody());

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


