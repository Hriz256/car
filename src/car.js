import * as BABYLON from 'babylonjs';
import {materials, mesh} from "./materials";
import {sounds} from "./sounds";

const car = {
    vehicle: null,
    wheelMeshes: [],
    vehicleReady: false,
    steeringIncrement: .25,
    steeringClamp: 0.5,
    maxEngineForce: 5000,
    maxBreakingForce: 60,
    engineForce: 0,
    vehicleSteering: 0,
    breakingForce: 0,
    chassisMesh: null,
    detectMesh: null,

    setCarOrigin({x = 0, y = 0, z = 0}) {
        const quat = new BABYLON.Quaternion();

        const transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(x, y, z));
        transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));

        this.vehicle.getRigidBody().setMotionState(new Ammo.btDefaultMotionState(transform));
    },

    wheelsAboveTheCenter() {
        return this.wheelMeshes.every(wheel => wheel.position.y > this.chassisMesh.position.y);
    }
};

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

const chassisWidth = 1.6;
const chassisHeight = 0.7;
const chassisLength = 3.9;
const massVehicle = 700;

const wheelAxisPositionBack = -1.13; // расположение оси задних колёс
const wheelRadiusBack = .36;
const wheelHalfTrackBack = 0.74;
const wheelAxisHeightBack = 0.4;

const wheelAxisFrontPosition = 1.33; // расположение оси передних колёс
const wheelRadiusFront = .36;
const wheelHalfTrackFront = 0.74;
const wheelAxisHeightFront = 0.4;

const suspensionStiffness = 30; // насколько сильно машина будет проседать при разгоне и торможении
const suspensionDamping = 0.3;
const suspensionCompression = 4.4; // как сильно машину "пружинит"
const suspensionRestLength = 0.6;
const rollInfluence = 0.0;

const wheelsIndex = {
    front_left: 0,
    front_right: 1,
    back_left: 2,
    back_right: 3,
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

const update = (scene) => {
    scene.registerBeforeRender(() => {
        const speed = car.vehicle.getCurrentSpeedKmHour();
        car.breakingForce = 0;
        car.engineForce = 0;

        // sounds.setVolume({sound: 'drive', volume: 1});

        if (Date.now() - acceleration.timeStart > 2000 && acceleration.allow) {
            acceleration.setAllow(false);
        }

        const speedZ = Math.floor(car.vehicle.getRigidBody().getLinearVelocity().z());
        const speedX = Math.floor(car.vehicle.getRigidBody().getLinearVelocity().x());

        if (actions.acceleration) {
            if (Math.floor(speed) < 0) {
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
            } else if (Math.floor(speed) >= 0 && Math.floor(speed) <= 70) {
                car.vehicle.getRigidBody().setGravity(new Ammo.btVector3(0, -10, 0));
                car.engineForce = car.maxEngineForce;
            }
        } else if (actions.braking) {
            if (Math.floor(speed) > 0) {
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

const createIntersectPlane = () => {
    const intersectBox = mesh.createBox({
        name: 'intersectBox',
        size: {x: 20, y: 20, z: 20},
        position: {x: 0, y: 0, z: 0},
        material: materials['red']
    });

    intersectBox.isVisible = false;
    intersectBox.material.wireframe = true;
    intersectBox.parent = car.chassisMesh;
};

const createCarBody = (carTask) => {
    car.chassisMesh = mesh.createBox({
        size: {x: chassisWidth, y: chassisHeight, z: chassisLength},
        position: {x: 0, y: 0, z: 0},
        rotation: {x: Math.PI / 2, y: 0, z: 0},
        material: materials['lightColor']
    });

    car.chassisMesh.rotationQuaternion = new BABYLON.Quaternion();
    car.chassisMesh.isVisible = false;

    Array.from(carTask.loadedMeshes, item => {
        item.parent = car.chassisMesh;
        item.position.set(0, 0.4, -0.1);
    });

    createIntersectPlane();
};

const createWheels = (wheelTask, scene) => {
    const frontLeft = new BABYLON.Mesh('wheel', scene);

    Array.from(wheelTask.loadedMeshes, item => {
        item.parent = frontLeft;
        item.rotation.z = Math.PI / 2;
    });

    frontLeft.rotationQuaternion = new BABYLON.Quaternion();

    const frontRight = frontLeft.clone('wheel2');
    const backLeft = frontLeft.clone('wheel3');
    const backRight = frontLeft.clone('wheel4');

    Array.from([...backRight.getChildren(), ...frontLeft.getChildren()], item => item.rotation.z = Math.PI / -2);

    return {frontLeft, frontRight, backLeft, backRight};
};

function createVehicle(scene, enemies, updatePopup, {carTask, wheelTask}) {
    const quat = new BABYLON.Quaternion();
    const wheelDirectionCS0 = new Ammo.btVector3(0, -1, 0);
    const wheelAxleCS = new Ammo.btVector3(-1, 0, 0);

    const physicsWorld = scene.getPhysicsEngine().getPhysicsPlugin().world;
    const localInertia = new Ammo.btVector3(0, 0, 0);

    const geometry = new Ammo.btBoxShape(new Ammo.btVector3(chassisWidth * .5, chassisHeight * .5, chassisLength * .5));
    geometry.calculateLocalInertia(massVehicle, localInertia);

    const transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(0, 10, 0));
    transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));

    const massOffset = new Ammo.btVector3(0, 0.4, 0);
    const transform2 = new Ammo.btTransform();
    transform2.setIdentity();
    transform2.setOrigin(massOffset);

    const motionState = new Ammo.btDefaultMotionState(transform);

    const compound = new Ammo.btCompoundShape();
    compound.addChildShape(transform2, geometry);

    const body = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(massVehicle, motionState, compound, localInertia));
    body.setActivationState(4);
    body.isCar = true;

    function collisionCallbackFunc(cp, colObj0, colObj1) {
        const bodyIndex = enemies.getEnemiesArray().findIndex(i => i.body.physicsImpostor.physicsBody.ptr === colObj1);
        colObj0 = Ammo.wrapPointer(colObj0, Ammo.btRigidBody);


        if (colObj0.isCar) {
            const collisionTime = collisions[colObj1] || 0;

            console.log(Date.now() - collisionTime)
            if (Date.now() - collisionTime > 400) {
                sounds.setVolume({
                    sound: 'drop',
                    volume: Math.min(Math.abs(car.vehicle.getCurrentSpeedKmHour()) / 200, 0.3)
                });
                sounds['drop'].play();
            }
        }

        collisions[colObj1] = Date.now();

        if (colObj0.isCar && bodyIndex !== -1 && !enemies.getEnemiesArray()[bodyIndex].temporaryStop && car.vehicle.getCurrentSpeedKmHour() < 50) {
            enemies.getEnemiesArray()[bodyIndex].temporaryStop = true;

            setTimeout(() => {
                enemies.getEnemiesArray()[bodyIndex].temporaryStop = false;
            }, 2000);
        }

        if (colObj0.isCar && bodyIndex !== -1 && !enemies.getEnemiesArray()[bodyIndex].isStop && car.vehicle.getCurrentSpeedKmHour() > 50) {
            const isHuman = enemies.getEnemiesArray()[bodyIndex].isHuman;

            enemies.getEnemiesArray()[bodyIndex].isStop = true;
            updatePopup.updateCounter(isHuman, enemies.updateEnemiesCount(isHuman));
        }
    }

    physicsWorld.setContactProcessedCallback(Ammo.addFunction(collisionCallbackFunc));
    physicsWorld.addRigidBody(body);

    const tuning = new Ammo.btVehicleTuning();
    const rayCaster = new Ammo.btDefaultVehicleRaycaster(physicsWorld);
    car.vehicle = new Ammo.btRaycastVehicle(tuning, body, rayCaster);
    car.vehicle.setCoordinateSystem(0, 1, 2);
    physicsWorld.addAction(car.vehicle);

    const addWheel = (isFront, pos, radius, wheel, index) => {
        const wheelInfo = car.vehicle.addWheel(
            pos,
            wheelDirectionCS0,
            wheelAxleCS,
            suspensionRestLength,
            radius,
            tuning,
            isFront
        );

        wheelInfo.set_m_suspensionStiffness(suspensionStiffness);
        wheelInfo.set_m_wheelsDampingRelaxation(suspensionDamping);
        wheelInfo.set_m_wheelsDampingCompression(suspensionCompression);
        wheelInfo.set_m_maxSuspensionForce(600000);
        wheelInfo.set_m_frictionSlip(40);
        wheelInfo.set_m_rollInfluence(rollInfluence);

        car.wheelMeshes[index] = wheel;
    };

    createCarBody(carTask);
    const {frontLeft, frontRight, backLeft, backRight} = createWheels(wheelTask, scene);

    addWheel(true, new Ammo.btVector3(wheelHalfTrackFront, wheelAxisHeightFront, wheelAxisFrontPosition), wheelRadiusFront, frontLeft, wheelsIndex.front_left);
    addWheel(true, new Ammo.btVector3(-wheelHalfTrackFront, wheelAxisHeightFront, wheelAxisFrontPosition), wheelRadiusFront, frontRight, wheelsIndex.front_right);
    addWheel(false, new Ammo.btVector3(-wheelHalfTrackBack, wheelAxisHeightBack, wheelAxisPositionBack), wheelRadiusBack, backLeft, wheelsIndex.back_left);
    addWheel(false, new Ammo.btVector3(wheelHalfTrackBack, wheelAxisHeightBack, wheelAxisPositionBack), wheelRadiusBack, backRight, wheelsIndex.back_right);

    update(scene);

    return car.chassisMesh;
}

window.addEventListener('keydown', (e) => {
    if (keysActions[e.code]) {
        actions[keysActions[e.code]] = true;
    }

    if (e.code === 'ShiftLeft') {
        acceleration.setAllow(true);
    }
});

window.addEventListener('keyup', (e) => {
    if (keysActions[e.code]) {
        actions[keysActions[e.code]] = false;
    }

    if (e.code === 'ShiftLeft') {
        acceleration.setAllow(false);
    }
});


export {createVehicle, car};
