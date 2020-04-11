(function () {
    console.log("Yup, everything runs!");

    const canvasContext = $("canvas")[0].getContext("2d");
    let mouseDown = false;
    let offset = $("canvas").offset();
    let startLeft;
    let startTop;
    let moveLeft;
    let moveTop;
    let coordinatesMoveTo = [];
    let coordinatesDrawing = [];
    // trying to work with two sets of coordinates to prevent
    // one consistent line-drawing

    $("canvas").on("mousedown", (event) => {
        mouseDown = true;
        startLeft = event.clientX - offset.left;
        startTop = event.clientY - offset.top;
        console.log("Left and top mousedown: " + startLeft + ", " + startTop);
        coordinatesMoveTo.push({ startX: startLeft, startY: startTop });
        $("canvas").on("mousemove", (e) => {
            if (mouseDown) {
                e.stopPropagation();
                moveLeft = e.clientX - offset.left;
                moveTop = e.clientY - offset.top;
                coordinatesDrawing.push({ x: moveLeft, y: moveTop });
                console.log(
                    "Left and top mousemove: " + moveLeft + ", " + moveTop
                );
            }
        });
    });

    $("canvas").on("mouseup", (event) => {
        mouseDown = false;
        event.stopPropagation();
        $("canvas").off("mousemove");
        console.log("A mouse went up, the magic ends!");
        console.log("Coordinates mousedown: ", coordinatesMoveTo);
        console.log("Coordinates mousemove: ", coordinatesDrawing);
    });

    requestAnimationFrame(drawSignature);

    function drawSignature() {
        // if there is no signing going on, politely request
        // an AnimationFrame and do nothing
        if (coordinatesDrawing.length == 0 || !mouseDown) {
            requestAnimationFrame(drawSignature);
            return;
        }
        // if there is signing going on, animate the signing
        canvasContext.beginPath();
        for (let i = 0; i < coordinatesMoveTo.length; i++) {
            canvasContext.moveTo(
                coordinatesMoveTo[0].startX,
                coordinatesMoveTo[0].startY
            );
            for (let j = 0; j < coordinatesDrawing.length; j++) {
                canvasContext.lineTo(
                    coordinatesDrawing[j].x,
                    coordinatesDrawing[j].y
                );
            }
            if (!mouseDown) {
                canvasContext.stroke();
                canvasContext.closePath(); // somehow this doesn't work
            }
        }
        canvasContext.stroke();
        requestAnimationFrame(drawSignature);
    }
})();
