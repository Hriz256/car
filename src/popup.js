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
    setShadow(button);

    return button;
};

const createText = ({text, size, top}) => {
    const textBlock = new GUI.TextBlock();
    textBlock.height = size;
    textBlock.text = text;
    textBlock.color = '#ffffff';
    textBlock.top = top;
    textBlock.fontSize = 'size';
    textBlock.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
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

const createUpdatePopup = () => {
    const advancedTexture = new GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI');

    const timer = createText({text: '03:00:00', size: '50px', top: '50px'});
    timer.fontSize = '46px';
    timer.fontStyle = 'italic';
    timer.fontWeight = 'bold';

    const quantityRect = createRect({top: '37px', left: '-100px', width: '200px', height: '75px', thickness: 4});
    quantityRect.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    quantityRect.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;

    const humansText = createText({text: 'HUMANS: 0/10', size: '20px', top: '50px'});
    const zombiesText = createText({text: 'ZOMBIES: 0/10', size: '20px', top: '80px'});

    Array.from([humansText, zombiesText], item => {
        item.width = '220px';
        item.left = '-50px';
        item.textHorizontalAlignment = 'left';
        item.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    });

    Array.from([timer, quantityRect, humansText, zombiesText], item => advancedTexture.addControl(item));

    return {
        updateCounter(isHuman, count) {
            isHuman ? humansText.text = `HUMANS: ${count}/10` : zombiesText.text = `ZOMBIES: ${count}/10`
        },

        updateTimer(time) {
            timer.text = `0${time.getUTCMinutes()}:${time.getUTCSeconds()}:${time.getUTCMilliseconds()}`;
        }
    }
};

const createFinishPopup = (canvas) => {
    const advancedTexture = new GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI');
    const buttonWidth = 370;
    const buttonHeight = 110;

    const backgroundRect = createRect({top: '0px', left: '0px', width: canvas.width, height: canvas.height});
    backgroundRect.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    backgroundRect.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    backgroundRect.background = '#92C74F';

    const message = new GUI.TextBlock();
    message.text = 'GAME OVER!';
    message.color = '#ffffff';
    message.top = `${-buttonHeight * 0.7}px`;
    message.fontSize = '130px';
    message.fontWeight = 'bold';
    setShadow(message);

    const buttonRestart = createButton({text: 'RESTART', width: buttonWidth, height: buttonHeight});
    buttonRestart.left = `${-buttonWidth / 2 - 25}px`;
    buttonRestart.background = '#22b61f';

    const buttonExit = createButton({text: 'EXIT GAME', width: buttonWidth, height: buttonHeight});
    buttonExit.left = `${buttonWidth / 2 + 25}px`;
    buttonExit.background = '#ec5050';

    Array.from([backgroundRect, buttonRestart, buttonExit, message], item => {
        advancedTexture.addControl(item);
        // item.alpha = 0
    });

    return {
        showPopup(isWin) {
            Array.from([backgroundRect, buttonRestart, buttonExit, message], item => {
                advancedTexture.addControl(item);
                item.alpha = 0
            });
        }
    }
};

export {createFinishPopup, createUpdatePopup};
