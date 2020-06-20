import {materials, mesh} from './materials';
import {timer} from './timer';
import {createPlayground} from './playground';
import {createPopup} from './popup';
import {createVehicle, car} from './car/car';
import {createEnemies} from './enemies';
import * as BABYLON from 'babylonjs';
import {sounds} from "./sounds";

const load = (scene) => {
    const assetsManager = new BABYLON.AssetsManager(scene);
    assetsManager.addMeshTask('car task', '', 'assets/', 'car2.obj');
    assetsManager.addMeshTask('wheel task', '', 'assets/', 'wheel.obj');
    assetsManager.addMeshTask('human task', '', 'assets/', 'human.babylon');

    assetsManager.load();

    return new Promise(resolve => {
        assetsManager.onFinish = tasks => resolve(tasks);
    });
};

const update = (scene, enemies, popup) => {
    scene.registerBeforeRender(() => {
        if (!timer.isStop) {
            const {ms, time} = timer.getTime();
            const isWin = enemies.checkVictory();

            if (isWin) {
                timer.isStop = true;
                popup.showPopup(isWin !== 'humans');
            }

            if (ms <= 0) {
                timer.isStop = true;
                popup.showPopup(false);
            }

            if (car.wheelsAboveTheCenter() && !Math.floor(car.vehicle.getCurrentSpeedKmHour())) {
                timer.isStop = true;
                popup.showPopup(false);
            }

            popup.updateTimer({ms, time});

            Array.from(enemies.getEnemiesArray(), item => {
                item.isStop && item.stopRun();
                !item.isStop && item.move();
            });
        }
    });
};

const main = async (scene, canvas) => {
    const tasks = await load(scene);

    sounds.setSounds(scene);
    materials.setColors(scene);
    mesh.scene = scene;

    createPlayground();

    const enemies = createEnemies(scene, tasks[2]);

    const restartGame = () => {
        enemies.restart();
        car.setCarOrigin({y: 10});
        timer.isStop = false;
        timer.restart(2);
    };

    const popup = createPopup(canvas, restartGame);
    scene.cameras[0].lockedTarget = createVehicle(scene, enemies, popup, {carTask: tasks[0], wheelTask: tasks[1]}); // камера будет двигаться за машиной

    update(scene, enemies, popup);
};

export {main};
