const timer = {
    isStop: false,
    countdown: new Date(),
    responseTime: new Date(Date.now() + (1000 * 60 * 2)),

    getTime() {
        const ms = timer.responseTime - Date.now();
        this.countdown.setTime(ms);

        return {ms, time: timer.countdown};
    },

    restart(minutes) {
        this.countdown = new Date();
        this.responseTime = new Date(Date.now() + (1000 * 60 * minutes));
    }
};

export {timer};

