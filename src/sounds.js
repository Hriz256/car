const sounds = {
    scene: null,

    setSound({name, autoplay = false, loop = false}) {
        this[name] = new BABYLON.Sound(name, `sounds/${name}.mp3`, this.scene, null, {
            loop,
            autoplay
        });
    },

    setVolume({volume, sound}) {
        this[sound].setVolume(volume.toFixed(2));
    },
};

export {sounds};
