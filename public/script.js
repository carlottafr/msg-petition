(function () {
    console.log("Yup, everything runs!");

    const canvasContext = $("canvas")[0].getContext("2d");
    let mouseDown = false;
    let offset = $("canvas").offset();
    let startLeft;
    let startTop;
    let moveLeft;
    let moveTop;
    let coordinates = [];
    // maybe work with two sets of coordinates to prevent
    // one consistent line-drawing

    $("canvas").on("mousedown", (event) => {
        mouseDown = true;
        startLeft = event.clientX - offset.left;
        startTop = event.clientY - offset.top;
        console.log("Left and top mousedown: " + startLeft + ", " + startTop);
        coordinates.push({ startX: startLeft, startY: startTop });
        $("canvas").on("mousemove", (e) => {
            if (mouseDown) {
                e.stopPropagation();
                moveLeft = e.clientX - offset.left;
                moveTop = e.clientY - offset.top;
                coordinates.push({ x: moveLeft, y: moveTop });
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
        console.log("Coordinates: ", coordinates);
    });

    requestAnimationFrame(drawSignature);

    function drawSignature() {
        // if there is no signing going on, politely request
        // an AnimationFrame and do nothing
        if (coordinates.length == 0 || !mouseDown) {
            requestAnimationFrame(drawSignature);
            return;
        }
        // if there is signing going on, animate the signing
        canvasContext.beginPath();
        canvasContext.moveTo(coordinates[0].startX, coordinates[0].startY);
        for (let i = 0; i < coordinates.length; i++) {
            canvasContext.lineTo(coordinates[i].x, coordinates[i].y);
        }
        canvasContext.stroke();
        canvasContext.closePath(); // somehow this doesn't work
        requestAnimationFrame(drawSignature);
    }
})();
