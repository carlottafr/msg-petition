(function () {
    console.log("Yup, everything runs!");

    const canvasContext = $("canvas")[0].getContext("2d");
    let mouseDown = false;

    $("canvas").on("mousedown", () => {
        console.log("Someone put a mouse down on the canvas!");
        mouseDown = true;
        $("canvas").on("mousemove", (ev) => {
            console.log("Someone is moving a mouse on here!");
            $("canvas").ready(drawMouseMove(ev));
            $("canvas").on("mouseup", (event) => {
                $("canvas").ready(captureMouseUp(event));
            });
        });
    });

    $("body").on("mousedown", "mousemove", "mouseup", (e) => {
        e.stopPropagation();
    });

    function startDrawMouseDown(event) {
        startX = newX;
        startY = newY;
        newX = event.clientX - event.offsetLeft;
        newY = event.clientY - event.offsetTop;
        canvasContext.beginPath();
        canvasContext.moveTo(newX, newY);
    }

    function drawMouseMove(event) {
        let left = event.pageX;
        let top = event.pageY;
        if (mouseDown) {
            canvasContext.lineTo(left, top);
            console.log("Left: ", left);
            console.log("Top: ", top);
        } else {
            canvasContext.stroke();
            canvasContext.endPath();
        }
    }

    function captureMouseUp(event) {
        event.stopPropagation();
        console.log("A mouse went up, the magic ends!");
        $("canvas").off("mousemove");
        mouseDown = false;
    }
})();
