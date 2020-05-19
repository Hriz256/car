import * as BABYLON from 'babylonjs';
import erratic from "./erratic";
import {materials} from "./materials";
import timer from "./timer";

function setVisibility(mesh, value) {
    mesh.isVisible = value;

    const children = mesh.getChildren();

    for (let i = 0; i < children.length; i++) {
        const child = children[i];

        setVisibility(child, value);
    }
}

var vehicle;
var wheelMeshes = [];
const actions = {accelerate: false, brake: false, right: false, left: false};

const keysActions = {
    "ArrowUp": 'acceleration',
    "ArrowDown": 'braking',
    "ArrowLeft": 'left',
    "ArrowRight": 'right'
};

var vehicleReady = false;

var ZERO_QUATERNION = new BABYLON.Quaternion();

var chassisWidth = 1.8;
var chassisHeight = .8;
var chassisLength = 4.6;
var massVehicle = 400;

var wheelAxisPositionBack = -1.77;
var wheelRadiusBack = .4;
var wheelWidthBack = .3;
var wheelHalfTrackBack = 0.95;
var wheelAxisHeightBack = 0.42;

var wheelAxisFrontPosition = 1.32;
var wheelHalfTrackFront = 0.95;
var wheelAxisHeightFront = 0.38;
var wheelRadiusFront = .4;
var wheelWidthFront = .3;

var friction = 5;
var suspensionStiffness = 10;
var suspensionDamping = 0.3;
var suspensionCompression = 4.4;
var suspensionRestLength = 0.6;
var rollInfluence = 0.0;

var steeringIncrement = .02;
var steeringClamp = 0.4;
var maxEngineForce = 2000;
var maxBreakingForce = 30;
var incEngine = 10.0;

var FRONT_LEFT = 0;
var FRONT_RIGHT = 1;
var BACK_LEFT = 2;
var BACK_RIGHT = 3;

var engineForce = 0;
var vehicleSteering = 0;
var breakingForce = 0;

const createCar = (scene) => {
    const chassisMesh = createVehicle(new BABYLON.Vector3(0, 4, -20), ZERO_QUATERNION, scene);

    // window.addEventListener('deviceorientation', (e) => {
    //     const x = e.beta;
    //     const y = e.gamma;
    //
    //     if (x < 0) {
    //         actions['left'] = true;
    //         actions['right'] = false;
    //     } else {
    //         actions['left'] = false;
    //         actions['right'] = true;
    //     }
    //
    //     if (y < 0) {
    //         actions['acceleration'] = true;
    //         actions['braking'] = false;
    //     } else {
    //         actions['acceleration'] = false;
    //         actions['braking'] = true;
    //     }
    // });

    window.addEventListener('keydown', (e) => {
        if (keysActions[e.code]) {
            actions[keysActions[e.code]] = true;
        }
    });

    window.addEventListener('keyup', (e) => {
        if (keysActions[e.code]) {
            actions[keysActions[e.code]] = false;
        }
    });

    scene.registerBeforeRender(function () {
        if (vehicleReady) {
            let speed = vehicle.getCurrentSpeedKmHour();
            breakingForce = 0;
            engineForce = 0;

            if (actions.acceleration) {
                if (speed < -1) {
                    breakingForce = maxBreakingForce;
                } else if (speed >= -1 && speed < 110) {
                    engineForce = maxEngineForce;
                }

            } else if (actions.braking) {
                if (speed > 1) {
                    breakingForce = maxBreakingForce;
                } else if (speed <= 1 && speed > -40) {
                    engineForce = -maxEngineForce;
                }
            }

            if (!actions.acceleration && !actions.braking) {
                speed > 0 ? breakingForce = maxBreakingForce : engineForce = maxEngineForce;

                if (speed < 1 && speed > -1) {
                    engineForce = 0;
                }
            }

            if (actions.right) {
                if (vehicleSteering < steeringClamp) {
                    vehicleSteering += steeringIncrement;
                }

            } else if (actions.left) {
                if (vehicleSteering > -steeringClamp) {
                    vehicleSteering -= steeringIncrement;
                }

            } else {
                vehicleSteering = 0;
            }

            vehicle.applyEngineForce(engineForce, FRONT_LEFT);
            vehicle.applyEngineForce(engineForce, FRONT_RIGHT);

            vehicle.setBrake(breakingForce / 2, FRONT_LEFT);
            vehicle.setBrake(breakingForce / 2, FRONT_RIGHT);
            vehicle.setBrake(breakingForce, BACK_LEFT);
            vehicle.setBrake(breakingForce, BACK_RIGHT);

            vehicle.setSteeringValue(vehicleSteering, FRONT_LEFT);
            vehicle.setSteeringValue(vehicleSteering, FRONT_RIGHT);


            let tm, p, q, i;

            for (i = 0; i < vehicle.getNumWheels(); i++) {
                vehicle.updateWheelTransform(i, true);
                tm = vehicle.getWheelTransformWS(i);
                p = tm.getOrigin();
                q = tm.getRotation();
                wheelMeshes[i].position.set(p.x(), p.y(), p.z());
                wheelMeshes[i].rotationQuaternion.set(q.x(), q.y(), q.z(), q.w());
                wheelMeshes[i].rotate(BABYLON.Axis.Z, Math.PI / 2);
            }

            tm = vehicle.getChassisWorldTransform();
            p = tm.getOrigin();
            q = tm.getRotation();
            chassisMesh.position.set(p.x(), p.y(), p.z());
            chassisMesh.rotationQuaternion.set(q.x(), q.y(), q.z(), q.w());
            chassisMesh.rotate(BABYLON.Axis.X, Math.PI);
        }
    });

    return chassisMesh;
};

function createVehicle(pos, quat, scene) {
    const wheelDirectionCS0 = new Ammo.btVector3(0, -1, 0);
    const wheelAxleCS = new Ammo.btVector3(-1, 0, 0);
    const chassisMesh = createChassisMesh(chassisWidth, chassisHeight, chassisLength);

    const assetsManager = new BABYLON.AssetsManager(scene);
    const meshTask = assetsManager.addMeshTask("car task", "", "assets/", "car.gltf");

    meshTask.onSuccess = function ({loadedMeshes}) {
        // const carBody = new BABYLON.Mesh("car", scene);
        //
        // loadedMeshes.forEach(i => {
        //     // i.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5);
        //     // i.rotation.x = Math.PI / 2;
        //     i.position.y = 3;
        //     i.position.x = 0.2;
        //     i.rotation.y = Math.PI;
        // });
        //
        // // carBody.parent = chassisMesh;
        //
        // const planAABB = BABYLON.Mesh.CreatePlane("intersectPlane", 20, scene);
        // planAABB.parent = chassisMesh;
        // planAABB.position.y = -0.8;
        // planAABB.rotation.x = Math.PI / 2;
        // planAABB.material = materials['green'];
        // planAABB.material._backFaceCulling = false;
        //
        // setVisibility(chassisMesh, false);
        // setVisibility(carBody, true);
        // setVisibility(planAABB, false);
    };

    assetsManager.load();

    //Going Native
    const physicsWorld = scene.getPhysicsEngine().getPhysicsPlugin().world;

    const geometry = new Ammo.btBoxShape(new Ammo.btVector3(chassisWidth * .5, chassisHeight * .5, chassisLength * .5));
    const transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(0, 5, 0));
    transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
    const motionState = new Ammo.btDefaultMotionState(transform);
    const localInertia = new Ammo.btVector3(0, 0, 0);
    geometry.calculateLocalInertia(massVehicle, localInertia);

    const massOffset = new Ammo.btVector3(0, 0.4, 0);
    const transform2 = new Ammo.btTransform();
    transform2.setIdentity();
    transform2.setOrigin(massOffset);
    const compound = new Ammo.btCompoundShape();
    compound.addChildShape(transform2, geometry);

    const body = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(massVehicle, motionState, compound, localInertia));
    body.setActivationState(4);
    body.isCar = true;

    function collisionCallbackFunc(cp, colObj0, colObj1) {
        const bodyIndex = erratic.array.findIndex(i => i.physicsImpostor.physicsBody.ptr === colObj1);
        colObj0 = Ammo.wrapPointer(colObj0, Ammo.btRigidBody);

        if (colObj0.isCar && erratic.array[bodyIndex] && erratic.array[bodyIndex].isOtherBody) {
            erratic.array[bodyIndex].isStop = true;
            erratic.updateScore(erratic.array[bodyIndex].isOtherBody === 'human');
            erratic.array.splice(bodyIndex, 1);
        }
    }

    const collisionCallbackPointer = Ammo.addFunction(collisionCallbackFunc);
    physicsWorld.setContactProcessedCallback(collisionCallbackPointer);

    physicsWorld.addRigidBody(body);

    var tuning = new Ammo.btVehicleTuning();
    var rayCaster = new Ammo.btDefaultVehicleRaycaster(physicsWorld);
    vehicle = new Ammo.btRaycastVehicle(tuning, body, rayCaster);
    vehicle.setCoordinateSystem(0, 1, 2);
    physicsWorld.addAction(vehicle);

    function addWheel(isFront, pos, radius, width, index) {
        const wheelInfo = vehicle.addWheel(
            pos,
            wheelDirectionCS0,
            wheelAxleCS,
            suspensionRestLength,
            radius,
            tuning,
            isFront);

        wheelInfo.set_m_suspensionStiffness(suspensionStiffness);
        wheelInfo.set_m_wheelsDampingRelaxation(suspensionDamping);
        wheelInfo.set_m_wheelsDampingCompression(suspensionCompression);
        wheelInfo.set_m_maxSuspensionForce(600000);
        wheelInfo.set_m_frictionSlip(40);
        wheelInfo.set_m_rollInfluence(rollInfluence);

        wheelMeshes[index] = createWheelMesh(radius, width, scene);
    }

    addWheel(true, new Ammo.btVector3(wheelHalfTrackFront, wheelAxisHeightFront, wheelAxisFrontPosition), wheelRadiusFront, wheelWidthFront, FRONT_LEFT);
    addWheel(true, new Ammo.btVector3(-wheelHalfTrackFront, wheelAxisHeightFront, wheelAxisFrontPosition), wheelRadiusFront, wheelWidthFront, FRONT_RIGHT);
    addWheel(false, new Ammo.btVector3(-wheelHalfTrackBack, wheelAxisHeightBack, wheelAxisPositionBack), wheelRadiusBack, wheelWidthBack, BACK_LEFT);
    addWheel(false, new Ammo.btVector3(wheelHalfTrackBack, wheelAxisHeightBack, wheelAxisPositionBack), wheelRadiusBack, wheelWidthBack, BACK_RIGHT);

    vehicleReady = true;

    return chassisMesh;
}

function createChassisMesh(w, l, h, scene) {
    const mesh = new BABYLON.MeshBuilder.CreateBox("box", {width: w, depth: h, height: l}, scene);
    mesh.rotationQuaternion = new BABYLON.Quaternion();
    mesh.material = materials['green'];

    return mesh;
}


function createWheelMesh(radius, width, scene) {
    const faceColors = [];
    faceColors[1] = new BABYLON.Color3(0, 0, 0);

    //set texture for flat face of wheel
    const faceUV = [];
    faceUV[0] = new BABYLON.Vector4(0, 0, 1, 1);
    faceUV[2] = new BABYLON.Vector4(0, 0, 1, 1);

    const mesh = new BABYLON.MeshBuilder.CreateCylinder("Wheel", {
        diameter: 0.85,
        height: 0.3,
        tessellation: 24,
        faceColors: faceColors,
        faceUV: faceUV
    }, scene);
    mesh.rotationQuaternion = new BABYLON.Quaternion();
    mesh.material = materials['tyre2'];

    return mesh;
}


export default createCar;
