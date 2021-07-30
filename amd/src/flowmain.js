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
define(['jquery'],
    function($) {
        /**
         * @alias module:mod_courseflow/flowmain
         */

        return {
            init: function(coursestream) {
                coursestream.container = `div#cf-container-${coursestream.mod}`;
                $(coursestream.container).on("mousedown", function(e) {
                    e.preventDefault();
                });
                coursestream.floworder = Object.entries(coursestream.flowdata).sort(
                    (a, b) => {
                        return a[1].preferred - b[1].preferred;
                    });


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
                    $(flow.container).css("height", (flow.maxrow + 0.8) * flow.size.stackdown + "px");

                    // Initialise marker for next suggested shape, only one up button can have this.
                    // Draw the shapes
                    flow.floworder.forEach(c => {
                        const shape = c[1].modid;
                        const placed = flow.flowdata[c[0]].placed;
                        var index;
                        for (index = 0; index < placed.length; index++) {
                            const hexplacement = placed[index];
                            let newholder = $(`#cf-outer-hex-${flow.mod}-${shape}-${index}`);

                            if (newholder.length == 0) {
                                // This must be drawn from scratch.
                                newholder = $(`#cf-outer-hex-${flow.mod}-${shape}-0`).clone(true, true);
                                newholder
                                    .attr("id", `cf-outer-hex-${flow.mod}-${shape}-${index}`)
                                    .addClass("cf-clone");
                                newholder.children(".cf-inner-hex").attr("id", `cf-inner-hex-${flow.mod}-${shape}-${index}`);
                                newholder.appendTo($(`${flow.container}`));
                            }
                            drawhex(c[0], index, newholder);
                            newholder.css("position", "absolute");
                            newholder.animate({
                                "left": (hexplacement.x * flow.size.stackright) + "px",
                                "top": (hexplacement.y * flow.size.stackdown) + "px"
                            }, {queue: false});
                        }
                        // Get rid of unused foldbacks. Continue from prev. index.
                        let oldouter = $(`#cf-outer-hex-${flow.mod}-${shape}-${index}`);
                        while (oldouter.length >= 1) {
                            oldouter.remove();
                            index++;
                            oldouter = $(`#cf-outer-hex-${flow.mod}-${shape}-${index}`);
                        }
                    });
                    /** Get relative placements.
                    */
                    function placelist() {
                        flow.floworder.forEach(c => {
                            let cp = flow.flowdata[c[0]];
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
                                cp.placed[0].placing[1][0] = c[0];
                                cp.baseparent = {identity: c[0], version: 0};
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
                        flow.floworder.forEach(c => {
                            let cp = flow.flowdata[c[0]];
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
                        let shapeholder = $(flow.container);
                        let width = shapeholder.parents(`#module-${flow.mod}`).css("width");
                        let hexdata = {};
                        let font = "inherit";
                        width = parseInt(width, 10) - 10;
                        if (width < 577) {
                            shapeholder.parent().css("margin-left", 0);
                            hexdata.maxcol = 4;
                            font = "smaller";
                        } else if (width < 641) {
                            shapeholder.parent().css("margin-left", 0);
                            hexdata.maxcol = 5;
                            font = "smaller";
                        } else if (width < 750) {
                            hexdata.maxcol = 6;
                        } else if (width < 1000) {
                            hexdata.maxcol = 7;
                        } else {
                            hexdata.maxcol = 8;
                            if (width > 1200) {
                                width = 1200; // Overwhelming after this width.
                            }
                        }
                        hexdata.stackright = (width - 1) / (hexdata.maxcol * 1.1);
                        hexdata.shapemargin = (hexdata.stackright) * 0.1; // Space between shapes.
                        hexdata.basebtn = (hexdata.stackright) * 0.1; // Height of button.
                        let truex2 = hexdata.stackright - hexdata.shapemargin;
                        hexdata.innersize = truex2 * 7 / 5;
                        hexdata.y2 = hexdata.innersize - hexdata.basebtn; // Height of shape.
                        hexdata.y1 = hexdata.y2 / 2 + hexdata.shapemargin; // Placement of shape middle y.
                        hexdata.y2 += hexdata.shapemargin; // Placement of shape bottom y.
                        hexdata.grad = 7 / 4;
                        hexdata.stackdown = hexdata.y1;
                        hexdata.innersizeY = hexdata.innersize + hexdata.shapemargin * 2;
                        hexdata.innersizeX = hexdata.innersize + hexdata.shapemargin * 2;
                        hexdata.x2 = truex2 + hexdata.shapemargin;
                        hexdata.x1 = hexdata.innersize * 2 / 7 + hexdata.shapemargin;
                        hexdata.x0 = 1 + hexdata.shapemargin;
                        hexdata.x3 = hexdata.innersize - 1 + hexdata.shapemargin;

                        $(`${flow.container} div.cf-hex-mid`).css({
                            height: hexdata.x2 + "px",
                            width: hexdata.x2 + "px",
                            top: hexdata.x1 / 2 + "px",
                            left: hexdata.x1 / 2 + "px",
                            position: "absolute"
                        });
                        $(`${flow.container} div.cf-txtholder`).css({
                            fontSize: font,
                        });
                        // Set the size of the canvases containing the shapes.
                        $(`${flow.container} canvas.cf-inner-hex`).attr({
                            width: hexdata.innersizeX + "px",
                            height: hexdata.innersizeY + "px"
                        });

                        return hexdata;
                    }

                    /** Set up to draw the shape on the canvas, getting the colours etc, and add the link if applicable.
                     * @param {number} element associated with hex
                     * @param {number} copy version of hex
                     * @param {object} outerholder the jquery selection of outerhex
                    */
                    function drawhex(element, copy, outerholder) {
                        let buttonstate = "down";
                        let can = outerholder.find("canvas");
                        let canvas = can.get(0);
                        let mid = can.next();
                        let text = mid.find("p");
                        var ctx = canvas.getContext('2d');
                        let essentialclass = canvas.classList[1];
                        var activity = flow.flowdata[element];
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
                        hexit(buttonstate, full, copy, 0);

                        // Now the link & text.
                        let whitemaybe = (full.light < 65) ? "white" : "black";
                        let textcolour = copy ? "black" : whitemaybe;
                        text.css("color", textcolour);
                        if ((flow.role == 0) || (buttonstate != "down")) {
                            mid.on("mousedown touchstart", function(e) {
                                    e.preventDefault();
                                    flow.hexclicked = element;
                                    hexit("down", full, copy, 0);
                                    e.currentTarget.addEventListener("mouseleave", function() {
                                        flow.hexclicked = 0;
                                        hexit(buttonstate, full, copy, 0);
                                    }, {once: true});
                                    e.currentTarget.addEventListener("touchmove", function() {
                                        flow.hexclicked = 0;
                                        hexit(buttonstate, full, copy, 0);
                                    }, {once: true});
                                })
                                .on("click touchend mouseup", function() {
                                    if (flow.hexclicked != element) {
                                        flow.hexclicked = 0;
                                        return;
                                    }
                                    hexit(buttonstate, full, copy, 0);
                                });
                        }

                        /** Draw the shape on the canvas.
                         * @param {string} state whether the button is up, down, or in the middle
                         * @param {object} shapefill colour given in HSL.
                         * @param {number} copy the version of the hex, if 0 then original else not.
                         * @param {boolean} suggested if this hex has been suggested as the next activity.
                        */
                        function hexit(state, shapefill, copy, suggested) {
                            ctx.clearRect(0, 0, flow.size.innersizeX, flow.size.innersizeY);
                            if (suggested == 1) {
                                // Then this is the suggested next activity.  Add corona.
                                var grd = ctx.createRadialGradient(flow.size.innersizeX / 2, flow.size.innersizeY / 2
                                    , flow.size.innersizeX * 0.4, flow.size.innersizeX / 2, flow.size.innersizeY / 2
                                    , flow.size.innersizeY / 2);
                                grd.addColorStop(0, 'rgba(255,215, 0, 0.5)');
                                grd.addColorStop(1, 'rgba(255, 215, 0, 0)');
                                ctx.fillStyle = grd;
                                ctx.fillRect(0, 0, flow.size.innersizeX, flow.size.innersizeY);
                            }
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
            }
        };
    }
);
