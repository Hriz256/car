import {materials, mesh} from "./materials";
import {timer} from './timer';
import {createPlayground} from "./playground";
import {createFinishPopup, createUpdatePopup} from "./popup";
import {createVehicle, car} from "./car";
import {createEnemies} from './erratic';
import * as BABYLON from "babylonjs";

const main = (scene, camera, canvas) => {
    mesh.scene = scene;

    materials.scene = scene;
    materials.createColor('red', '#c7583f');
    materials.createColor('green', '#92C74F');
    materials.createColor('lightColor', '#feff7f');
    materials.createColor('white', '#ffffff');
    materials.createTexture('tyre2', 'png');

    createPlayground(scene);
    // const finishPopup = createFinishPopup(canvas);
    const updatePopup = createUpdatePopup();

    // requestAnimationFrame(timer.run);

    const enemies = createEnemies(scene);
    camera.lockedTarget = createVehicle(scene, enemies, updatePopup);

    scene.registerBeforeRender(() => {
        // const time = timer.getTime();
        //
        // updatePopup.updateTimer(timer.getTime());

        Array.from(enemies.getEnemiesArray(), item => {
            if (!item.isStop) {
                item.sphere.translate(
                    new BABYLON.Vector3(item.x - item.sphere.position.x, 0, item.z - item.sphere.position.z).normalize(),
                    item.sphereSpeed,
                    BABYLON.Space.WORLD
                );

                item.body.lookAt(item.sphere.position);
                item.setLinearVelocity();

                if (item.sphere.intersectsPoint(new BABYLON.Vector3(item.x, item.bodyHeight / 2, item.z))) {
                    item.changeCoords();
                }

                if (scene.getMeshByName('intersectBox') && item.sphere.intersectsMesh(scene.getMeshByName('intersectBox'))) {
                    item.x = item.sphere.position.x - car.chassisMesh.position.x;
                    item.z = item.sphere.position.z - car.chassisMesh.position.z;

                    item.sphere.translate(
                        new BABYLON.Vector3(item.sphere.position.x - car.chassisMesh.position.x, 0, item.sphere.position.z - car.chassisMesh.position.z).normalize(),
                        item.sphereSpeed,
                        BABYLON.Space.WORLD
                    );
                }
            } else {
                this.body.getChildren()[0].idleAnim.weight = 1;
                this.body.getChildren()[0].runAnim.speedRatio = 0;
            }
        });
    })
};

export {main};
