import * as BABYLON from 'babylonjs';
import {sounds} from "../sounds";
import {car, wheelsIndex} from './config';
import {createBody, createWheels} from "./carDetails";

const collisions = {};

const acceleration = {
    timeStart: null,
    allow: false,

    setAllow(value) {
        this.allow = value;

        if (value) {
            this.timeStart = Date.now();
        }
    }
};

const actions = {
    accelerate: false,
    brake: false,
    right: false,
    left: false
};

const keysActions = {
    "KeyW": 'acceleration',
    "KeyS": 'braking',
    "KeyA": 'left',
    "KeyD": 'right'
};

// применяем гравитацию, направленную противоположно движению, чтобы быстрее остановить / разогнать машину
const setGravity = (speedZ, speedX) => {
    let z = 0;
    let x = 0;

    if (Math.floor(speedZ) >= 0) {
        z = -50
    } else if (Math.floor(speedZ) < 0) {
        z = 50;
    }

    if (Math.floor(speedX) >= 0) {
        x = -50
    } else if (Math.floor(speedX) < 0) {
        x = 50;
    }

    car.vehicle.getRigidBody().setGravity(new Ammo.btVector3(x, -10, z));
};

const update = (scene) => {
    scene.registerBeforeRender(() => {
        const speed = car.vehicle.getCurrentSpeedKmHour();
        car.breakingForce = 0;
        car.engineForce = 0;

        sounds.setVolume({sound: 'drive', volume: Math.min(Math.abs(speed) / 200, 0.2)});

        if (Date.now() - acceleration.timeStart > 2000 && acceleration.allow) {
            acceleration.setAllow(false);
        }

        const speedZ = Math.floor(car.vehicle.getRigidBody().getLinearVelocity().z());
        const speedX = Math.floor(car.vehicle.getRigidBody().getLinearVelocity().x());

        if (actions.acceleration) {
            if (Math.floor(speed) < 0) {
                setGravity(speedZ, speedX);
            } else if (Math.floor(speed) >= 0 && Math.floor(speed) <= 70) {
                car.vehicle.getRigidBody().setGravity(new Ammo.btVector3(0, -10, 0));
                car.engineForce = car.maxEngineForce;
            }
        } else if (actions.braking) {
            if (Math.floor(speed) > 0) {
                setGravity(speedZ, speedX);
            } else if (Math.floor(speed) <= 0 && Math.floor(speed) > -70) {
                car.vehicle.getRigidBody().setGravity(new Ammo.btVector3(0, -10, 0));
                car.engineForce = -car.maxEngineForce;
            }
        }


        if (!actions.acceleration && !actions.braking) {
            speed > 0 ? car.breakingForce = car.maxBreakingForce : car.engineForce = car.maxEngineForce;

            if (speed < 1 && speed > -1) {
                car.engineForce = 0;
                car.breakingForce = 0;
            }
        }

        if (actions.right) {
            if (car.vehicleSteering < car.steeringClamp) {
                car.vehicleSteering += car.steeringIncrement;
            }
        } else if (actions.left) {
            if (car.vehicleSteering > -car.steeringClamp) {
                car.vehicleSteering -= car.steeringIncrement;
            }
        } else {
            car.vehicleSteering = 0;
        }

        car.vehicle.applyEngineForce(car.engineForce, wheelsIndex.front_left);
        car.vehicle.applyEngineForce(car.engineForce, wheelsIndex.front_right);

        car.vehicle.setBrake(car.breakingForce / 2, wheelsIndex.front_left);
        car.vehicle.setBrake(car.breakingForce / 2, wheelsIndex.front_right);
        car.vehicle.setBrake(car.breakingForce, wheelsIndex.back_left);
        car.vehicle.setBrake(car.breakingForce, wheelsIndex.back_right);

        car.vehicle.setSteeringValue(car.vehicleSteering, wheelsIndex.front_left);
        car.vehicle.setSteeringValue(car.vehicleSteering, wheelsIndex.front_right);

        let tm, p, q;

        Array.from({length: car.vehicle.getNumWheels()}, (i, index) => {
            car.vehicle.updateWheelTransform(index, true);
            tm = car.vehicle.getWheelTransformWS(index);
            p = tm.getOrigin();
            q = tm.getRotation();
            car.wheelMeshes[index].position.set(p.x(), p.y(), p.z());
            car.wheelMeshes[index].rotationQuaternion.set(q.x(), q.y(), q.z(), q.w());
            car.wheelMeshes[index].rotate(BABYLON.Axis.Z, Math.PI / 2);
        });


        tm = car.vehicle.getChassisWorldTransform();
        p = tm.getOrigin();
        q = tm.getRotation();
        car.chassisMesh.position.set(p.x(), p.y(), p.z());
        car.chassisMesh.rotationQuaternion.set(q.x(), q.y(), q.z(), q.w());
        car.chassisMesh.rotate(BABYLON.Axis.X, Math.PI);
    });
};


const createVehicle = (scene, enemies, updatePopup, {carTask, wheelTask}) => {
    const physicsWorld = scene.getPhysicsEngine().getPhysicsPlugin().world;
    const localInertia = new Ammo.btVector3(0, 0, 0);

    const geometry = new Ammo.btBoxShape(new Ammo.btVector3(car.chassisWidth * .5, car.chassisHeight * .5, car.chassisLength * .5));
    geometry.calculateLocalInertia(car.massVehicle, localInertia);

    const transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(0, 10, 0));
    transform.setRotation(new Ammo.btQuaternion(car.quat.x, car.quat.y, car.quat.z, car.quat.w));

    const massOffset = new Ammo.btVector3(0, 0.4, 0);
    const transform2 = new Ammo.btTransform();
    transform2.setIdentity();
    transform2.setOrigin(massOffset);

    const motionState = new Ammo.btDefaultMotionState(transform);

    const compound = new Ammo.btCompoundShape();
    compound.addChildShape(transform2, geometry);

    const body = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(car.massVehicle, motionState, compound, localInertia));
    body.setActivationState(4);
    body.isCar = true;

    function collisionCallbackFunc(cp, colObj0, colObj1) {
        const bodyIndex = enemies.getEnemiesArray().findIndex(i => i.body.physicsImpostor.physicsBody.ptr === colObj1);
        colObj0 = Ammo.wrapPointer(colObj0, Ammo.btRigidBody);

        if (colObj0.isCar && bodyIndex === -1) {
            const collisionTime = collisions[colObj1] || 0;

            if (Date.now() - collisionTime > 400) {
                sounds.setVolume({
                    sound: 'drop',
                    volume: Math.min(Math.abs(car.vehicle.getCurrentSpeedKmHour()) / 200, 0.3)
                });
                sounds['drop'].play();
            }
        }

        collisions[colObj1] = Date.now();

        if (colObj0.isCar && bodyIndex !== -1 && !enemies.getEnemiesArray()[bodyIndex].isStop) {
            const isHuman = enemies.getEnemiesArray()[bodyIndex].isHuman;

            const x = car.vehicle.getRigidBody().getLinearVelocity().x() - enemies.getEnemiesArray()[0].body.physicsImpostor.getLinearVelocity().x;
            const z = car.vehicle.getRigidBody().getLinearVelocity().z() - enemies.getEnemiesArray()[0].body.physicsImpostor.getLinearVelocity().z;
            const y = car.vehicle.getRigidBody().getLinearVelocity().y() - enemies.getEnemiesArray()[0].body.physicsImpostor.getLinearVelocity().y;

            const vel = Math.hypot(x, z, y);
            console.log(vel)

            if (vel > 15) {
                enemies.getEnemiesArray()[bodyIndex].isStop = true;
                updatePopup.updateCounter(isHuman, enemies.updateEnemiesCount(isHuman));
            }

            sounds.setVolume({
                sound: 'drop',
                volume: Math.min(Math.abs(car.vehicle.getCurrentSpeedKmHour()) / 200, 0.3)
            });

            sounds['drop'].play();
        }
    }

    // функция обратного вызова. Регистрирует все столкновения между физ объектами
    physicsWorld.setContactProcessedCallback(Ammo.addFunction(collisionCallbackFunc));
    physicsWorld.addRigidBody(body);

    const rayCaster = new Ammo.btDefaultVehicleRaycaster(physicsWorld);

    car.vehicle = new Ammo.btRaycastVehicle(new Ammo.btVehicleTuning(), body, rayCaster);
    car.vehicle.setCoordinateSystem(0, 1, 2);
    physicsWorld.addAction(car.vehicle);

    createBody(carTask);
    createWheels(wheelTask, scene);

    update(scene);

    return car.chassisMesh;
};

window.addEventListener('keydown', (e) => {
    if (keysActions[e.code]) {
        actions[keysActions[e.code]] = true;
    }

    e.code === 'ShiftLeft' && acceleration.setAllow(true);
});

window.addEventListener('keyup', (e) => {
    if (keysActions[e.code]) {
        actions[keysActions[e.code]] = false;
    }

    e.code === 'ShiftLeft' && acceleration.setAllow(false);
});


export {createVehicle, car};
