import {materials, mesh} from "./materials";

const createPlayground = () => {
    const ground = mesh.createGround({
        width: 1000,
        height: 1000,
        material: materials['green']
    });
    ground.setPhysics({friction: 1});

    const border0 = mesh.createBox({
        size: {x: 1, y: 10, z: 100},
        position: {x: -50, y: 0, z: 0},
    });

    const border1 = mesh.createBox({
        size: {x: 1, y: 10, z: 100},
        position: {x: 50, y: 0, z: 0},
    });

    const border2 = mesh.createBox({
        size: {x: 100, y: 10, z: 1},
        position: {x: 0, y: 0, z: 50},
    });

    const border3 = mesh.createBox({
        size: {x: 100, y: 10, z: 1},
        position: {x: 0, y: 0, z: -50},
    });

    Array.from([border0, border1, border2, border3], item => {
        item.isVisible = false;
        item.setPhysics({});
    });


    mesh.createPlane({
        width: 100,
        height: 1,
        position: {x: -50, y: 0.05, z: 0},
        rotation: {x: Math.PI / 2, y: Math.PI / 2, z: 0},
        material: materials['white']
    });
    mesh.createPlane({
        width: 100,
        height: 1,
        position: {x: 50, y: 0.05, z: 0},
        rotation: {x: Math.PI / 2, y: Math.PI / 2, z: 0},
        material: materials['white']
    });
    mesh.createPlane({
        width: 101,
        height: 1,
        position: {x: 0, y: 0.05, z: 50},
        rotation: {x: Math.PI / 2, y: 0, z: 0},
        material: materials['white']
    });
    mesh.createPlane({
        width: 101,
        height: 1,
        position: {x: 0, y: 0.05, z: -50},
        rotation: {x: Math.PI / 2, y: 0, z: 0},
        material: materials['white']
    });
};

export {createPlayground};
