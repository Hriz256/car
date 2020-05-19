const timer = {
    update() {
        timer.countdown = new Date();
        timer.responseTime = new Date(Date.now() + (1000 * 60 * 3))
    },
    restartFunc: null,
    countdown: new Date(),
    responseTime: new Date(Date.now() + (1000 * 60 * 3)),
    run() {
        timer.countdown.setTime(timer.responseTime - Date.now());
        document.getElementById('timer').textContent = `${timer.countdown.getUTCMinutes()}:${timer.countdown.getUTCSeconds()}:${timer.countdown.getUTCMilliseconds()}`;

        if (timer.countdown.getUTCMinutes() > 0 || timer.countdown.getUTCSeconds() > 0 || timer.countdown.getUTCMilliseconds() > 100) {
            requestAnimationFrame(timer.run);
        } else {
            confirm('Проигрыш. Некоторые зомби остались живы. Повторить?') && timer.restartFunc();
        }
    }
};

export default timer;

