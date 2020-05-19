import * as BABYLON from 'babylonjs';

const materials = {
    scene: null,
    createColor(color, {r, g, b}) {
        this[color] = new BABYLON.StandardMaterial('color', this.scene);
        this[color].diffuseColor = new BABYLON.Color3(r, g, b);
        this[color].emissiveColor = new BABYLON.Color3(r, g, b);
    },

    createTexture(texture, format = 'jpg') {
        this[texture] = new BABYLON.StandardMaterial(`${texture}`, this.scene);
        this[texture].diffuseTexture = new BABYLON.Texture(`assets/${texture}.${format}`, this.scene);
    }
};

const createBox = (size, position, rotation, mass, scene) => {
    const box = new BABYLON.MeshBuilder.CreateBox("box", {width: size.x, depth: size.z, height: size.y}, scene);
    box.position.set(position.x, position.y, position.z);
    box.rotation.set(rotation.x, rotation.y, rotation.z);

    if (!mass) {
        mass = 0;
        box.material = materials['red'];
    } else {
        box.position.y += 5;
        box.material =  materials['blue'];
    }

    box.physicsImpostor = new BABYLON.PhysicsImpostor(box, BABYLON.PhysicsImpostor.BoxImpostor, {
        mass: mass,
        friction: 0.4,
        restitution: 1
    }, scene);

    return box;
};

export {createBox, materials};
