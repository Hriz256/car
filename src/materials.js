import * as BABYLON from 'babylonjs';

const colors = {
    'red': '#c7583f',
    'green': '#92C74F',
    'lightColor': '#feff7f',
    'white': '#ffffff'
};

const materials = {
    scene: null,
    createColor(color, hex) {
        this[color] = new BABYLON.StandardMaterial(`${color}`, this.scene);
        this[color].diffuseColor = new BABYLON.Color3.FromHexString(hex);

        return this[color];
    },

    // Создать цвета
    setColors(scene) {
        this.scene = scene;

        Array.from(Object.entries(colors), color => this.createColor(color[0], color[1]))
    }
};

const mesh = {
    scene: null,

    createPlane({width, height, ...generalParams}) {
        const plane = BABYLON.MeshBuilder.CreatePlane('plane', {width, height}, this.scene);
        this._generalParams(plane, generalParams);

        return plane;
    },

    createSphere({diameter, ...generalParams}) {
        const sphere = BABYLON.MeshBuilder.CreateSphere('sphere', {diameter}, this.scene);
        this._generalParams(sphere, generalParams);

        return sphere;
    },

    createBox({size, name = 'box', ...generalParams}) {
        const box = new BABYLON.MeshBuilder.CreateBox(name, {
            width: size.x,
            depth: size.z,
            height: size.y
        }, this.scene);
        this._generalParams(box, generalParams);

        return box;
    },

    createGround({width, height, ...generalParams}) {
        const ground = BABYLON.MeshBuilder.CreateGround('ground', {width, height, subdivisions: 2}, this.scene);
        this._generalParams(ground, generalParams);

        return ground;
    },

    setPhysics({impostor = 'BoxImpostor', mass = 0, restitution = 0, friction = 0.7}) {
        this.physicsImpostor = new BABYLON.PhysicsImpostor(this, BABYLON.PhysicsImpostor[impostor], {
            mass,
            friction,
            restitution,
        }, this.scene);
    },

    _generalParams(mesh, {position = new BABYLON.Vector3(0, 0, 0), rotation = new BABYLON.Vector3(0, 0, 0), material, visible = false}) {
        mesh.position.set(position.x, position.y, position.z);
        mesh.rotation.set(rotation.x, rotation.y, rotation.z);
        mesh.material = material;
        mesh.isVisible = visible;
        mesh.setPhysics = this.setPhysics;
    },
};

export {materials, mesh};
