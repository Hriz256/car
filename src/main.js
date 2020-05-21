import {materials, mesh} from './materials';
import {timer} from './timer';
import {createPlayground} from './playground';
import {createPopup} from './popup';
import {createVehicle, car} from './car';
import {createEnemies} from './enemies';
import * as BABYLON from 'babylonjs';

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

const main = async (scene, camera, canvas) => {
    const tasks = await load(scene);

    mesh.scene = scene;

    materials.scene = scene;
    materials.createColor('red', '#c7583f');
    materials.createColor('green', '#92C74F');
    materials.createColor('lightColor', '#feff7f');
    materials.createColor('white', '#ffffff');

    createPlayground(scene);

    const enemies = createEnemies(scene, tasks[2]);

    const restartGame = () => {
        enemies.restart();
        timer.isStop = false;
        timer.restart(3);
    };

    const popup = createPopup(canvas, restartGame);

    camera.lockedTarget = createVehicle(scene, enemies, popup, {carTask: tasks[0], wheelTask: tasks[1]});

    scene.registerBeforeRender(() => {
        if (!timer.isStop) {
            const {ms, time} = timer.getTime();
            const isWin = enemies.checkVictory();

            if (ms <= 0) {
                timer.isStop = true;
                popup.showPopup(false);
            }

            if (isWin) {
                timer.isStop = true;
                popup.showPopup(isWin !== 'humans');
            }

            popup.updateTimer({ms, time});

            Array.from(enemies.getEnemiesArray(), item => {
                if (!item.isStop) {
                    item.move();
                } else {
                    item.body.getChildren()[0].idleAnim.weight = 1;
                    item.body.getChildren()[0].runAnim.speedRatio = 0;
                }
            });
        }
    });
};

export {main};
