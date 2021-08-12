// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/*
 * Provides interface for users to edit courseflow activity flow on the
 * courseflow mod editing form.
 *
 * @package    mod_courseflow
 * @copyright  2020 Naomi Quirke
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
*/
/**
 * @module mod_courseflow/flowmain
 */
// import * as Str from 'core/str';
export const init = (coursestream) => {
    coursestream.containernode = document.getElementById(`cf-container-${coursestream.mod}`);
    coursestream.containernode.onmousedown = function(e) {
        e.preventDefault();
    };

    window.addEventListener("resize", function() {
        drawShapes(coursestream);
    });
    window.addEventListener("orientationchange", function() {
        drawShapes(coursestream);
    });
    coursestream.hexclicked = 0;
    drawShapes(coursestream);

    /** Once we have the sizing, work out the flow.placing and then draw the shapes.
     * @param {object} flow - All the details of this hex flow.
    */
    function drawShapes(flow) {
        flow.size = setSizes();
        placelist();
        // Set the size of the containing element based on the number of hex rows that have been used.
        let grdtemp = 'repeat(' + flow.maxrow + ', ' // + flow.size.heightmargin + 'px '
            + flow.size.halfshapeheight + 'px ' + flow.size.heightmargin + 'px)';
        flow.containernode.style.gridTemplateRows = grdtemp;
        grdtemp = 'repeat(' + flow.size.maxcol + ', '
            + flow.size.shapemargin + 'px ' + flow.size.shapebody + 'px) ' + flow.size.shapemargin + 'px';
        flow.containernode.style.gridTemplateColumns = grdtemp;

        // Initialise marker for next suggested shape, only one up button can have this.
        // Draw the shapes
        Object.keys(coursestream.flowdata).forEach(c => {
            const shape = flow.flowdata[c].modid;
            const placed = flow.flowdata[c].placed;
            let index = 0;
            for (; index < placed.length; index++) {
                const hexplacement = placed[index];
                let newholder = document.getElementById(`cf-outer-hex-${flow.mod}-${shape}-${index}`);

                if (newholder === null) {
                    // This must be drawn from scratch.
                    newholder = document.getElementById(`cf-outer-hex-${flow.mod}-${shape}-0`).cloneNode(true);
                    newholder.id = `cf-outer-hex-${flow.mod}-${shape}-${index}`;
                    newholder.classList.add("cf-clone");
                    flow.containernode.append(newholder);
                }
                hexplacement.x = (hexplacement.x) * 2 + 1;
                hexplacement.y = (hexplacement.y) * 2 + 1;
                newholder.style.gridArea = (hexplacement.y) + ' / ' + (hexplacement.x)
                    + ' / ' + (hexplacement.y + 3) + ' / ' + (hexplacement.x + 3);
//                Drawhex(c, index, newholder);
            }
            // Get rid of unused foldbacks. Continue from prev. index.
            let oldouter = document.getElementById(`cf-outer-hex-${flow.mod}-${shape}-${index}`);
            while (oldouter !== null) {
                oldouter.remove();
                index++;
                oldouter = document.getElementById(`cf-outer-hex-${flow.mod}-${shape}-${index}`);
            }
        });
        /** Get relative placements.
        */
        function placelist() {
            Object.keys(coursestream.flowdata).forEach(c => {
                let cp = flow.flowdata[c];
                cp.placed = [];
                if (cp.parentid == 0) {
                    cp.placed[0] = {
                        x: 1, ry: 0, rw: 1, minusy: 0, plusy: 0,
                        placing: [],
                        version: 0
                    };
                    for (let i = 0; i < flow.size.maxcol; i++) {
                        cp.placed[0].placing[i] = [];
                    }
                    cp.placed[0].placing[1][0] = c;
                    cp.baseparent = {identity: c, version: 0};
                } else {
                    let success = 0;
                    let version = -1;
                    while (!success) {
                        version++;
                        success = createplace(cp, version);
                    }
                }
            });
            // Update to actual placements.
            flow.maxrow = 0;
            Object.keys(coursestream.flowdata).forEach(c => {
                let cp = flow.flowdata[c];
                cp.placed.forEach((cpversion, index) => {
                    if (cpversion.rw) {
                        cp.placed[index].base = flow.maxrow - cpversion.minusy;
                        cp.placed[index].y = cpversion.ry + cp.placed[index].base;
                        flow.maxrow += cpversion.plusy - cpversion.minusy + 2;
                    } else {
                        cp.placed[index].y = cpversion.ry +
                            flow.flowdata[cp.baseparent.identity].placed[cp.baseparent.version].base;
                    }
                });
            });
        }
        /** Set up a position.
         * @param {object} cp1
         * @param {number} foldback giving version of hex on page
         * @returns {boolean}
        */
        function createplace(cp1, foldback) {
            let pp = flow.flowdata[cp1.parentid];
            cp1.baseparent = (foldback == 0) ? pp.baseparent : {identity: pp.preferred, version: foldback};
            let bp = flow.flowdata[cp1.baseparent.identity];
            let baseplacements = bp.placed[cp1.baseparent.version];
            let gotit = getplace(pp.placed[foldback].x, pp.placed[foldback].ry, baseplacements.placing);
            if (gotit) {
                cp1.placed[0] = {x: gotit[0], ry: gotit[1], rw: 0};
                baseplacements.placing[gotit[0]][gotit[1]] = cp1.preferred;
                baseplacements.rw = Math.max(cp1.placed[0].x, baseplacements.rw);
                baseplacements.minusy = Math.min(cp1.placed[0].ry, baseplacements.minusy);
                baseplacements.plusy = Math.max(cp1.placed[0].ry, baseplacements.plusy);
                return true;
            } else {
                if (!pp.placed[foldback + 1]) {
                    // Need to make a new base node so that next time through createplace there is somewhere to go.
                    pp.placed[foldback + 1] = {
                        x: 1, ry: 0, rw: 1, minusy: 0, plusy: 0,
                        placing: [],
                        version: foldback + 1
                    };
                    for (let i = 0; i < flow.size.maxcol; i++) {
                        pp.placed[foldback + 1].placing[i] = [];
                    }
                    pp.placed[foldback + 1].placing[1][0] = pp.preferred;

                }
                return false;
            }

        }
        /** Find an empty spot to place the new hex.
         * @param {number} x position of parent
         * @param {number} y position of parent
         * @param {array} placing table of which hex is where
         * @returns {array} place of new hex with reference to old, or null if cannot be placed.
        */
        function getplace(x, y, placing) {
            // Check next to the right down.
            if ((x + 1 < flow.size.maxcol) && (placing[x + 1][y + 1] === undefined)) {
                return ([x + 1, y + 1]);
            }
            // Check next to the right up.
            if ((x + 1 < flow.size.maxcol) && (placing[x + 1][y - 1] === undefined)) {
                return ([x + 1, y - 1]);
            }
            // Check next to the left down.
            if ((x - 1 >= 0) && (placing[x - 1][y + 1] === undefined)) {
                return ([x - 1, y + 1]);
            }
            // Check below.
            if ((x >= 0) && (placing[x][y + 2] === undefined)) {
                return ([x, y + 2]);
            }
            // Check above.
            if ((x >= 0) && (placing[x][y - 2] === undefined)) {
                return ([x, y - 2]);
            }
            // Check next to the left up.
            if ((x - 1 >= 0) && (placing[x - 1][y - 1] === undefined)) {
                return ([x - 1, y - 1]);
            }
            return null;
        }
        /** Set up the sizes of each shape based on screen width.
         * @returns {object} hexdata.
        */
        function setSizes() {
            let width = document.getElementById(`module-${flow.mod}`).clientWidth;
            let hexdata = {};
            hexdata.font = "inherit";
            width = parseInt(width, 10) - 10;
            if (width < 577) {
                flow.containernode.parentElement.style.marginLeft = 0;
                hexdata.maxcol = 4;
                hexdata.font = "smaller";
            } else if (width < 641) {
                flow.containernode.parentElement.style.marginLeft = 0;
                hexdata.maxcol = 5;
                hexdata.font = "smaller";
            } else if (width < 750) {
                hexdata.maxcol = 6;
            } else if (width < 1000) {
                hexdata.maxcol = 7;
            } else {
                hexdata.maxcol = 8;
                if (width > 1200) {
                    width = 1200; // Overwhelming after this width.
                }
            } // Issue with following in that we don't take into account the very last shapemargin.
            hexdata.stackright = width / hexdata.maxcol; // Size of small & large grid cells together.
            hexdata.shapemargin = (hexdata.stackright) * 0.25; // Size of small grid cell.
            hexdata.shapebody = hexdata.stackright - hexdata.shapemargin; // Size of large grid cell width.
            let halfshapeheight = hexdata.shapebody * 0.87; // Size of large grid cell height.
            hexdata.heightmargin = halfshapeheight * 0.1; // Size of large grid cell margin.
            hexdata.halfshapeheight = halfshapeheight - hexdata.heightmargin; // Corrected height taking into account margin.

            return hexdata;
        }
        /** Set up sizes to draw the shape on the canvas.
        */
        function drawhexouter() {
            flow.size.innersize = flow.size.stackright * 7 / 5 + flow.size.shapemargin;
            flow.size.basebtn = flow.size.innersize * 0.1; // Height of button.
            let shapeheight = flow.size.innersize;
            // Let hexdata.y0 = 0;
            flow.size.y1 = (shapeheight - flow.size.basebtn) / 2; // Placement of shape middle y.
            flow.size.y2 = shapeheight - flow.size.basebtn;
            flow.size.grad = 7 / 4;
            flow.size.x2 = 1 + flow.size.innersize / 2;
            flow.size.x1 = 1 + flow.size.innersize * 2 / 7;
            flow.size.x0 = 1;
            flow.size.x3 = 1 + flow.size.innersize * 5 / 7;
        }

        /** Set up to draw the shape on the canvas, getting the colours etc.
         * @param {number} preferred the hex id
         * @param {number} copy version of hex
         * @param {element} outerholder the outerhex element
        */
        function drawhex(preferred, copy, outerholder) {
            let buttonstate = "down";
            let canvas = outerholder.querySelector("canvas");
            canvas.style.width = canvas.style.height = flow.size.innersize + "px";

            let textholder = outerholder.querySelector(".cf-txtholder");
            let text = textholder.querySelector("p");
            var ctx = canvas.getContext('2d');
            let essentialclass = canvas.classList[1];
            var activity = flow.flowdata[preferred];
            let full = toHSL(activity.colouravail);
            switch (essentialclass) {
                case "cf-available":
                    full.light += (100 - full.light) * 0.35;
                    full.sat = full.sat * 0.75;
                    buttonstate = "half";
                    break;
                case "cf-hidden":
                    full.sat = 10;
                    full.light = 98;
                    break;
                case "cf-notavailable":
                    full.light += (100 - full.light) * 0.3;
                    full.light = Math.max(full.light, 90);
                    full.sat = Math.min(20, full.sat * 0.8);
                    break;
                case "cf-next":
                    buttonstate = "up";
                    break;
                default:
                    full.light = 100;
            }
            hexit(buttonstate, full, copy);

            // Now the link & text.
            let whitemaybe = (full.light < 65) ? "white" : "black";
            let textcolour = copy ? "black" : whitemaybe;
            text.style.color = textcolour;
            text.style.fontSize = flow.size.font;
            if ((flow.role == 0) || (buttonstate != "down")) {
                textholder.onmousedown = function(e) { // Do touchstart later.
                        e.preventDefault();
                        flow.hexclicked = preferred;
                        hexit("down", full, copy);
                        e.currentTarget.addEventListener("mouseleave", function() {
                            flow.hexclicked = 0;
                            hexit(buttonstate, full, copy);
                        }, {once: true});
                        e.currentTarget.addEventListener("touchmove", function() {
                            flow.hexclicked = 0;
                            hexit(buttonstate, full, copy);
                        }, {once: true});
                    };
                    textholder.onmousedown = function() { // Do click touchend later.
                        if (flow.hexclicked != preferred) {
                            flow.hexclicked = 0;
                            return;
                        }
                        hexit(buttonstate, full, copy);
                    };
            }

            /** Draw the shape on the canvas.
             * @param {string} state whether the button is up, down, or in the middle
             * @param {object} shapefill colour given in HSL.
             * @param {number} copy the version of the hex, if 0 then original else not.
            */
            function hexit(state, shapefill, copy) {
                ctx.clearRect(0, 0, flow.size.innersize, flow.size.innersize);
                const statenotdownsize = state == "up" ? 0 : flow.size.basebtn / 2;
                const buttonheight = state == "down" ? flow.size.basebtn : statenotdownsize;
                if (copy) {
                    ctx.setLineDash([4, 2]);
                    ctx.strokeStyle = "black";
                } else {
                    ctx.setLineDash([]);
                    drawpointer();
                    ctx.strokeStyle = `hsl(${shapefill.hue},${shapefill.sat}%,${shapefill.light * 0.8}%)`;
                }
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(flow.size.x0, flow.size.y1 + buttonheight);
                ctx.lineTo(flow.size.x1, flow.size.shapemargin + buttonheight);
                ctx.lineTo(flow.size.x2, flow.size.shapemargin + buttonheight);
                ctx.lineTo(flow.size.x3, flow.size.y1 + buttonheight);
                ctx.lineTo(flow.size.x2, flow.size.y2 + buttonheight);
                ctx.lineTo(flow.size.x1, flow.size.y2 + buttonheight);
                ctx.closePath();
                ctx.stroke();
                ctx.fillStyle = copy ? "white" : `hsl(${shapefill.hue},${shapefill.sat}%,${shapefill.light}%)`;
                ctx.fill();
                if (state != "down") {
                    // Draw button sides.
                    const topbtn = buttonheight + ctx.lineWidth;
                    const botbtn = flow.size.basebtn;
                    let toner1 = Math.min(90, shapefill.light + (100 - shapefill.light) * 0.3);
                    let toner2 = shapefill.sat * 0.5;
                    ctx.fillStyle = copy ? "white" : `hsl(${shapefill.hue},${toner2}%,${toner1}%)`;
                    toner1 += (100 - toner1) * 0.6;
                    ctx.strokeStyle = copy ? "black" : `hsl(${shapefill.hue},${toner2}%,${toner1}%)`;

                    ctx.beginPath();
                    ctx.moveTo(flow.size.x0, flow.size.y1 + topbtn);
                    ctx.lineTo(flow.size.x0, flow.size.y1 + botbtn);
                    ctx.lineTo(flow.size.x1, flow.size.y2 + botbtn);
                    ctx.lineTo(flow.size.x1, flow.size.y2 + topbtn);
                    ctx.closePath();
                    ctx.stroke();
                    ctx.fill();
                    if (!copy) {
                        ctx.fillRect( // X, y, width, height.
                            flow.size.x1, flow.size.y2 + topbtn,
                            flow.size.x2 - flow.size.x1, botbtn - topbtn);
                    }
                    ctx.beginPath();
                    ctx.moveTo(flow.size.x1, flow.size.y2 + botbtn);
                    ctx.lineTo(flow.size.x2, flow.size.y2 + botbtn);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(flow.size.x2, flow.size.y2 + topbtn);
                    ctx.lineTo(flow.size.x2, flow.size.y2 + botbtn);
                    ctx.lineTo(flow.size.x3, flow.size.y1 + botbtn);
                    ctx.lineTo(flow.size.x3, flow.size.y1 + topbtn);
                    ctx.closePath();
                    ctx.stroke();
                    ctx.fill();
                }
                /** Add the pointers into the hex.
                */
                function drawpointer() {
                    if (activity.parentid == 0) {
                        return;
                    }
                    var parentplaced;
                    if (activity.parentid == activity.baseparent.identity) {
                        parentplaced = flow.flowdata[activity.baseparent.identity].placed[activity.baseparent.version];
                    } else {
                        parentplaced = flow.flowdata[activity.parentid].placed[0];
                    }
                    const thisplaced = activity.placed[0]; // Want .x and .y properties.
                    const whenarrownotleftish = (parentplaced.x - thisplaced.x == 0) ? 0 : -1;
                    const arrowsideways = (parentplaced.x - thisplaced.x > 0) ? 1 : whenarrownotleftish;
                    const arrowupish = (parentplaced.y - thisplaced.y > 0) ? 1 : -1;
                    var arrowpointX, arrowpointY, arrowgrad;
                    if (arrowsideways == 0) {
                        arrowpointX = (flow.size.x2 + flow.size.x1) / 2; // (x2-x1)/2 + x1
                        arrowpointY = (arrowupish == 1) ? flow.size.y2 + flow.size.basebtn :
                            flow.size.shapemargin;
                        arrowgrad = (arrowupish == 1) ? Math.PI : 0;
                    } else if (arrowsideways == 1) {
                        arrowpointX = (flow.size.x3 + flow.size.x2) / 2;
                        arrowpointY = (arrowupish == 1) ? flow.size.y1 + flow.size.basebtn : flow.size.shapemargin;
                        arrowpointY += (flow.size.x3 - flow.size.x2) / 2 * flow.size.grad;
                        arrowgrad = Math.atan2(1 / 2, -arrowupish * 2 / 7); // Function params (dy, dx).
                    } else {
                        arrowpointX = (flow.size.x1 + flow.size.x0) / 2;
                        arrowpointY = (arrowupish == 1) ? flow.size.y1 + flow.size.basebtn : flow.size.shapemargin;
                        arrowpointY += (flow.size.x1 - flow.size.x0) / 2 * flow.size.grad;
                        arrowgrad = Math.atan2(-1 / 2, -arrowupish * 2 / 7);
                    }
                    ctx.save();
                    ctx.translate(arrowpointX, arrowpointY);
                    ctx.rotate(arrowgrad);
                    ctx.fillStyle = "silver";
                    ctx.beginPath();
                    ctx.moveTo(0, 0); // The point.
                    ctx.lineTo(-flow.size.shapemargin / 2, -flow.size.shapemargin);
                    ctx.lineTo(flow.size.shapemargin / 2, -flow.size.shapemargin);
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                    // Ctx.arc(arrowpointX, arrowpointY, flow.size.shapemargin / 2, 0, 2 * Math.PI);
                }
            }
            /** Convert hex to HSL.
                * Copied from https://css-tricks.com/converting-color-spaces-in-javascript/
                * @param {string} H hex colour
                * @return {object} HSL colour
            */
            function toHSL(H) {
                // Convert hex to RGB first
                let r = 0,
                    g = 0,
                    b = 0;
                if (H.length == 4) {
                    r = "0x" + H[1] + H[1];
                    g = "0x" + H[2] + H[2];
                    b = "0x" + H[3] + H[3];
                } else if (H.length == 7) {
                    r = "0x" + H[1] + H[2];
                    g = "0x" + H[3] + H[4];
                    b = "0x" + H[5] + H[6];
                }
                // Then to HSL. First make r, g, and b fractions of 1
                r /= 255;
                g /= 255;
                b /= 255;

                // Find greatest and smallest channel values
                let cmin = Math.min(r, g, b),
                    cmax = Math.max(r, g, b),
                    delta = cmax - cmin,
                    h = 0,
                    s = 0,
                    l = 0;
                // Calculate hue
                if (delta == 0) { // No difference
                    h = 0;
                } else if (cmax == r) { // Red is max
                    h = ((g - b) / delta) % 6;
                } else if (cmax == g) { // Green is max
                    h = (b - r) / delta + 2;
                } else { // Blue is max
                    h = (r - g) / delta + 4;
                }
                h = Math.round(h * 60);

                // Make negative hues positive behind 360°
                if (h < 0) {
                    h += 360;
                }
                // Calculate lightness
                l = (cmax + cmin) / 2;

                // Calculate saturation
                s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

                // Multiply l and s by 100
                s = +(s * 100).toFixed(1);
                l = +(l * 100).toFixed(1);

                return {"hue": h, "sat": s, "light": l};
            }
        }
    }
};
