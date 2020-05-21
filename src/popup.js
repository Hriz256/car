import * as GUI from 'babylonjs-gui';

const setShadow = (item) => {
    item.shadowColor = '#808080';
    item.shadowBlur = 5;
    item.shadowOffsetY = 3;
};

const createButton = ({text, width, height}) => {
    const button = new GUI.Button.CreateSimpleButton(text, text);
    button.width = `${width}px`;
    button.height = `${height}px`;
    button.thickness = 4;
    button.top = `${height * 0.7}px`;
    button.color = 'white';
    button.fontSize = '26px';
    button.fontWeight = 'bold';
    button.hoverCursor = 'pointer';
    button.isPointerBlocker = true;
    setShadow(button);

    return button;
};

const createText = ({text, size, top}) => {
    const textBlock = new GUI.TextBlock();
    textBlock.height = size;
    textBlock.text = text;
    textBlock.color = '#ffffff';
    textBlock.top = top;
    textBlock.fontSize = size;
    textBlock.fontWeight = 'bold';
    setShadow(textBlock);

    return textBlock;
};

const createRect = ({height, width, top, left, thickness = 0}) => {
    const rect = new GUI.Rectangle('rect');
    rect.thickness = thickness;
    rect.color = '#ffffff';
    rect.top = top;
    rect.width = width;
    rect.height = height;
    rect.left = left;
    setShadow(rect);

    return rect;
};

const createPopup = (canvas, restartFunc) => {
    const advancedTexture = new GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI');
    const buttonWidth = 370;
    const buttonHeight = 110;

    // Видимые постоянно элементы

    const timer = createText({text: '03:00:00', size: '46px', top: '50px'});
    timer.width = '210px';
    timer.fontStyle = 'italic';
    timer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    timer.textHorizontalAlignment = 'left';
    timer.zIndex = 10;

    const quantityRect = createRect({top: '37px', left: '-100px', width: '200px', height: '75px', thickness: 4});
    quantityRect.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    quantityRect.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    quantityRect.zIndex = 10;

    const humansText = createText({text: 'HUMANS: 0/10', size: '20px', top: '50px'});
    const zombiesText = createText({text: 'ZOMBIES: 0/10', size: '20px', top: '80px'});

    Array.from([humansText, zombiesText], item => {
        item.width = '220px';
        item.left = '-50px';
        item.zIndex = 10;
        item.textHorizontalAlignment = 'left';
        item.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        item.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    });

    Array.from([timer, quantityRect, humansText, zombiesText], item => advancedTexture.addControl(item));

    // Скрываемые элементы

    const backgroundRect = createRect({top: '0px', left: '0px', width: canvas.width, height: canvas.height});
    backgroundRect.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    backgroundRect.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    backgroundRect.background = '#92C74F';

    const message = createText({
        size: '130px',
        text: '',
        top: `${-buttonHeight * 0.7}px`
    });

    const buttonRestart = createButton({text: 'RESTART', width: buttonWidth, height: buttonHeight});
    buttonRestart.left = `${-buttonWidth / 2 - 25}px`;
    buttonRestart.background = '#22b61f';
    buttonRestart.onPointerUpObservable.add(() => {
        restartFunc();
        humansText.text = 'HUMANS: 0/10';
        zombiesText.text = 'ZOMBIES: 0/10';
        showPopupElems(false);
    });

    const buttonExit = createButton({text: 'EXIT GAME', width: buttonWidth, height: buttonHeight});
    buttonExit.left = `${buttonWidth / 2 + 25}px`;
    buttonExit.background = '#ec5050';

    function showPopupElems(show) {
        Array.from([backgroundRect, buttonRestart, buttonExit, message], item => {
            show ? advancedTexture.addControl(item) : advancedTexture.removeControl(item);
        });
    }

    return {
        showPopup(isWin) {
            showPopupElems(true);

            message.text = isWin ? 'YOU WIN!' : 'GAME OVER!';
        },

        updateCounter(isHuman, count) {
            isHuman ? humansText.text = `HUMANS: ${count}/10` : zombiesText.text = `ZOMBIES: ${count}/10`;
        },

        updateTimer({ms, time}) {
            const sec = time.getUTCSeconds();
            const min = time.getUTCMinutes();

            timer.text = ms > 0 ?
                `${min > 9 ? '' : '0'}${min}:${sec > 9 ? '' : '0'}${sec}:${time.getUTCMilliseconds()}` :
                `00:00:00`;
        },
    }
};

export {createPopup};
