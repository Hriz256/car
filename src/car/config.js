import * as BABYLON from "babylonjs";

const car = {
    vehicle: null,
    wheelMeshes: [],
    steeringIncrement: .25,
    steeringClamp: 0.5,
    maxEngineForce: 5000,
    maxBreakingForce: 60,
    engineForce: 0,
    vehicleSteering: 0,
    breakingForce: 0,
    chassisMesh: null,
    chassisWidth: 1.6,
    chassisHeight: 1,
    chassisLength: 3.9,
    massVehicle: 700,
    quat: new BABYLON.Quaternion(),

    // перемещаем машину в центр игрового поля
    setCarOrigin({x = 0, y = 0, z = 0}) {
        const transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(x, y, z));
        transform.setRotation(new Ammo.btQuaternion(this.quat.x, this.quat.y, this.quat.z, this.quat.w));

        this.vehicle.getRigidBody().setMotionState(new Ammo.btDefaultMotionState(transform));
    },

    // проверяем выше ли колёса, чем тело самой машины. Если да - она перевернулась
    wheelsAboveTheCenter() {
        return this.wheelMeshes.every(wheel => wheel.position.y > this.chassisMesh.position.y);
    }
};

const wheels = {
    wheelRadius: .36,
    wheelHalfTrack: 0.74, // ось колеса относительно центра по x
    wheelAxisHeight: 0.4, // расположение колёс по y
    wheelAxisPositionBack: -1.13, // ось задних колёс относительно центра по z
    wheelAxisPositionFront: 1.33, // ось передних колёс относительно центра по z
    suspensionStiffness: 30, // насколько сильно машина будет проседать при разгоне и торможении
    suspensionDamping: 0.3,
    suspensionCompression: 4.4, // как сильно машину "пружинит"
    suspensionRestLength: 0.6, // расстояние между колёсами и кузовом
    rollInfluence: 0.0 // с какой силой колёса будут отталкиваться от земли
};

const wheelsIndex = {
    front_left: 0,
    front_right: 1,
    back_left: 2,
    back_right: 3,
};

export {wheels, car, wheelsIndex};
