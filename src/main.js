import {materials, mesh} from "./materials";
import {timer} from './timer';
import {createPlayground} from "./playground";
import {createFinishPopup, createUpdatePopup} from "./popup";
import {createVehicle, car} from "./car";
import {createEnemies} from './enemies';

const main = (scene, camera, canvas) => {
    mesh.scene = scene;

    materials.scene = scene;
    materials.createColor('red', '#c7583f');
    materials.createColor('green', '#92C74F');
    materials.createColor('lightColor', '#feff7f');
    materials.createColor('white', '#ffffff');

    createPlayground(scene);

    const enemies = createEnemies(scene);
    const updatePopup = createUpdatePopup();

    const restartGame = () => {
        enemies.restart();
        updatePopup.resetValues();
        timer.isStop = false;
        timer.restart(3);
    };

    const finishPopup = createFinishPopup(canvas, restartGame);

    camera.lockedTarget = createVehicle(scene, enemies, updatePopup);

    scene.registerBeforeRender(() => {
        if (!timer.isStop && car.vehicleReady) {
            const {ms, time} = timer.getTime();
            const isWin = enemies.checkVictory();

            if (ms <= 0) {
                timer.isStop = true;
                finishPopup.showPopup(false);
            }

            if (isWin) {
                timer.isStop = true;
                finishPopup.showPopup(isWin !== 'humans');
            }

            updatePopup.updateTimer({ms, time});

            Array.from(enemies.getEnemiesArray(), (item, index) => {
                if (!item.isStop) {
                    item.move();
                } else {
                    item.body.getChildren()[0].idleAnim.weight = 1;
                    item.body.getChildren()[0].runAnim.speedRatio = 0;
                }
            });
        }
    })
};

export {main};
