import {materials, mesh} from "../materials";
import * as BABYLON from "babylonjs";
import {car, wheels, wheelsIndex} from "./config";

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

const createBody = (carTask) => {
    car.chassisMesh = mesh.createBox({
        size: {x: car.chassisWidth, y: car.chassisHeight, z: car.chassisLength},
        position: {x: 0, y: 0, z: 0},
        rotation: {x: Math.PI / 2, y: 0, z: 0},
        material: materials['lightColor']
    });

    car.chassisMesh.rotationQuaternion = new BABYLON.Quaternion();

    Array.from(carTask.loadedMeshes, item => {
        item.parent = car.chassisMesh;
        item.position.set(0, 0.4, -0.1);
    });

    createIntersectPlane();
};

const addWheel = (isFront, wheel, index) => {
    const wheelInfo = car.vehicle.addWheel(
        new Ammo.btVector3(
            index === wheelsIndex.front_right || index === wheelsIndex.back_left ? -wheels.wheelHalfTrack : wheels.wheelHalfTrack,
            wheels.wheelAxisHeight,
            wheels[isFront ? 'wheelAxisPositionFront' : 'wheelAxisPositionBack']
        ),
        new Ammo.btVector3(0, -1, 0),
        new Ammo.btVector3(-1, 0, 0),
        wheels.suspensionRestLength,
        wheels.wheelRadius,
        new Ammo.btVehicleTuning(),
        isFront
    );

    wheelInfo.set_m_suspensionStiffness(wheels.suspensionStiffness);
    wheelInfo.set_m_wheelsDampingRelaxation(wheels.suspensionDamping);
    wheelInfo.set_m_wheelsDampingCompression(wheels.suspensionCompression);
    wheelInfo.set_m_maxSuspensionForce(600000);
    wheelInfo.set_m_frictionSlip(40);
    wheelInfo.set_m_rollInfluence(wheels.rollInfluence);

    car.wheelMeshes[index] = wheel;
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

    addWheel(true, frontLeft, wheelsIndex.front_left);
    addWheel(true, frontRight, wheelsIndex.front_right);
    addWheel(false, backLeft, wheelsIndex.back_left);
    addWheel(false, backRight, wheelsIndex.back_right);
};

export {createBody, createWheels};
