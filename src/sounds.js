const loopSounds = ['drive'];
const disposableSounds = ['drop'];

const sounds = {
    scene: null,

    createSound({name, autoplay = false, loop = false}) {
        this[name] = new BABYLON.Sound(name, `sounds/${name}.mp3`, this.scene, null, {
            loop,
            autoplay
        });
    },

    // Установить громкоть звука
    setVolume({volume, sound}) {
        this[sound].setVolume(volume.toFixed(2));
    },

    // Создать звуки на основе массива
    setSounds(scene) {
        this.scene = scene;

        Array.from(loopSounds, sound => this.createSound({name: sound, autoplay: true, loop: true}));
        Array.from(disposableSounds, sound => this.createSound({name: sound, autoplay: false, loop: false}));
    }
};

export {sounds};
