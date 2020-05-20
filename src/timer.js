const timer = {
    countdown: new Date(),
    responseTime: new Date(Date.now() + (1000 * 60 * 3)),

    run() {
        timer.countdown.setTime(timer.responseTime - Date.now());

        if (timer.countdown.getUTCMinutes() > 0 || timer.countdown.getUTCSeconds() > 0 || timer.countdown.getUTCMilliseconds() > 100) {
            requestAnimationFrame(timer.run);
        }
    },

    getTime() {
        return timer.countdown;
    },

    update(minutes) {
        timer.countdown = new Date();
        timer.responseTime = new Date(Date.now() + (1000 * 60 * minutes));
    }
};

export {timer};

