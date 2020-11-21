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
    function ($) {
        /**
         * @alias module:mod_courseflow/flowmain
         */

        return {
            init: function (flow) {
                if (flow.flowheight == 0) {
                    return;
                }
                if (flow.role != 0) {
                    // Hide the link to the activity edit.
                    $(`li#module-${flow.mod} div.activityinstance a.aalink`).css("visibility", "hidden");
                }

                window.addEventListener("resize", function () {
                    drawShapes(flow);
                });
                window.addEventListener("orientationchange", function () {
                    drawShapes(flow);
                });

                drawShapes(flow);

                //======================================================================================
                // Once we have the sizing, work out the flow.placing and then draw the shapes.
                function drawShapes(flow) {
                    flow.container = `div#cf-container-${flow.mod}`;
                    $(flow.container).on("mousedown touchstart", function (e) {
                        e.preventDefault();
                    });
                    flow.floworder = Object.entries(flow.flowdata).sort(
                        (a, b) => { return a[1].preferred - b[1].preferred; });

                    flow.size = setSizes();
                    let maxrow = placelist();

                    // Set the size of the containing element based on the number of hex rows that have been used.
                    $(flow.container).css("height", (maxrow + 0.8) * flow.size.stackdown + "px");

                    // Set the size of the canvases containing the shapes.
                    $(`${flow.container} canvas.cf-inner-hex`).attr({
                        width: flow.size.innersizeX + "px",
                        height: flow.size.innersizeY + "px"
                    });
                    $(`${flow.container} .cf-outer-hex`).css("position", "absolute");
                    // Initialise marker for next suggested shape, only one up button can have this.
                    var nextsuggested = 0;
                    // Draw the shapes
                    for (const c of flow.floworder) {
                        const shape = c[0];
                        const placed = flow.flowdata[shape].placed;
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
                                newholder.children(".cf-hex-mid").attr("id", `cf-hex-mid-${flow.mod}-${shape}-${index}`);
                                newholder.find(".cf-hex-txt").attr("id", `cf-hex-txt-${flow.mod}-${shape}-${index}`);
                                newholder.appendTo($(`${flow.container}`));
                            }
                            drawhex(shape, index);
                            newholder.animate({
                                "left": (hexplacement.x * flow.size.stackright) + "px",
                                "top": (hexplacement.y * flow.size.stackdown) + "px"
                            }, { queue: false });
                        }
                        // Get rid of unused foldbacks. Continue from prev. index.
                        let oldouter = $(`#cf-outer-hex-${flow.mod}-${shape}-${index}`);
                        while (oldouter.length >= 1) {
                            oldouter.remove();
                            index++;
                            oldouter = $(`#cf-outer-hex-${flow.mod}-${shape}-${index}`);
                        }
                    }

                    function placelist() {
                        // Get relative placements.
                        // let maxfoldback = 0;
                        for (let c of flow.floworder) {
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
                                cp.placed[0].placing[1][0] = cp.id;
                                cp.baseparent = { id: cp.id, version: 0 };
                            } else {
                                let success = 0;
                                let version = -1;
                                while (!success) {
                                    version++;
                                    success = createplace(cp, version);
                                    // maxfoldback = Math.max(version, maxfoldback);
                                }
                            }
                        }
                        // Update to actual placements.
                        let realmax = 0;
                        for (let c of flow.floworder) {
                            let cp = flow.flowdata[c[0]];
                            for (let cpversion of cp.placed) {
                                if (cpversion.rw) {
                                    cpversion.base = realmax - cpversion.minusy;
                                    cpversion.y = cpversion.ry + cpversion.base;
                                    realmax += cpversion.plusy - cpversion.minusy + 2;
                                } else {
                                    cpversion.y = cpversion.ry +
                                        flow.flowdata[cp.baseparent.id].placed[cp.baseparent.version].base;
                                }
                            }
                        }
                        return realmax;
                    }
                    function createplace(cp1, foldback) {
                        let pp = flow.flowdata[cp1.parentid];
                        cp1.baseparent = (foldback == 0) ? pp.baseparent : { id: pp.id, version: foldback };
                        let bp = flow.flowdata[cp1.baseparent.id];
                        let baseplacements = bp.placed[cp1.baseparent.version];
                        let gotit = getplace(pp.placed[foldback].x, pp.placed[foldback].ry, baseplacements.placing);
                        if (gotit) {
                            cp1.placed[0] = { x: gotit[0], ry: gotit[1], rw: 0 };
                            baseplacements.placing[gotit[0]][gotit[1]] = cp1.id;
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
                                pp.placed[foldback + 1].placing[1][0] = pp.id;

                            }
                            return false;
                        }

                    }
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
                    // Funtion to set up the sizes of elements based on screen width.  Taken out of main for clarity.
                    function setSizes() {
                        // Work out the sizing of each shape.
                        let shapeholder = $(flow.container);
                        let width = $(`li#module-${flow.mod}`).css("width");
                        shapeholder.css("width", width); // Set this in case the theme has cut it down due to being empty initially.
                        let hexdata = {};
                        let font = "inherit";
                        width = parseInt(width, 10) - 10;
                        if (width < 300) {
                            shapeholder.parent().css("margin-left", 0);
                            hexdata.maxcol = 4;
                            font = "smaller";
                        } else if (width < 500) {
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
                        hexdata.shapemargin = (hexdata.stackright) * 0.1;  // Space between shapes.
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
                        return hexdata;
                    }


                    // Draw the shape on the canvas, and add the link if applicable.
                    function drawhex(id, copy) {
                        var buttonstate;
                        let canvas = $(`#cf-inner-hex-${flow.mod}-${id}-${copy}`);
                        let mid = $(`#cf-hex-mid-${flow.mod}-${id}-${copy}`);
                        let text = $(`p#cf-hex-txt-${flow.mod}-${id}-${copy}`);
                        var ctx = canvas.get(0).getContext('2d');

                        var activity = flow.flowdata[id];
                        let full = toHSL(activity.colouravail);
                        var parentcompletion = activity.parentid == 0 ? 1 : flow.flowdata[activity.parentid].completion;
                        if (!activity.deleted) {
                            if ((parentcompletion == 1) && (activity.completion == 0)) {
                                buttonstate = "up";
                                nextsuggested = nextsuggested == 0 ? 1 : 2;
                                text.addClass("ready");
                            } else if (activity.completion == 1) {
                                full.light += (100 - full.light) * 0.35;
                                full.sat = full.sat * 0.75;
                                buttonstate = "half";
                                text.addClass("available");
                            } else if (activity.completion == 0) {
                                full.light += (100 - full.light) * 0.3;
                                full.light = Math.max(full.light, 90);
                                full.sat = Math.min(20, full.sat * 0.8);
                                buttonstate = "down";
                                text.addClass("notavailable");
                            } else { // Hidden activity.
                                full.sat = 10;
                                full.light = 98;
                                buttonstate = "down";
                                text.addClass("notvisible");
                            }
                            hexit(buttonstate, full, copy, nextsuggested);
                        }
                        const nowsuggested = nextsuggested;
                        nextsuggested = nextsuggested > 0 ? 2 : 0;

                        // Now the link & text.
                        let textcolour = copy ? "black" : (full.light < 65) ? "white" : "black";
                        text.css("color", textcolour);
                        if (((flow.role == 0) || (buttonstate != "down")) && (!activity.deleted)) {
                            // Second option alternative: ((activity.completion >= 0) && (parentcompletion == 1))) {
                            mid.css("cursor", "pointer")
                                .on("click", function () {
                                    location.href = activity.link;
                                })
                                .on("mousedown touchstart", function (e) {
                                    e.preventDefault();
                                    hexit("down", full, copy, nowsuggested);
                                })
                                .on("mouseleave touchend mouseup", function () {
                                    hexit(buttonstate, full, copy, nowsuggested);
                                });
                        } else if (activity.completion == -1) {
                            mid.css("cursor", "not-allowed");
                            text.css("cursor", "not-allowed");
                        } else {
                            mid.css("cursor", "default");
                            text.css("cursor", "default");
                        }

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
                            const buttonheight = state == "down" ? flow.size.basebtn : state == "up" ? 0 : flow.size.basebtn / 2;
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
                                    ctx.fillRect( // x, y, width, height.
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
                            function drawpointer() {
                                if (activity.parentid == 0) {
                                    return;
                                }
                                var parentplaced;
                                if (activity.parentid == activity.baseparent.id) {
                                    parentplaced = flow.flowdata[activity.baseparent.id].placed[activity.baseparent.version];
                                } else {
                                    parentplaced = flow.flowdata[activity.parentid].placed[0];
                                }
                                const thisplaced = activity.placed[0]; // Want .x and .y properties.
                                const arrowleftish = (parentplaced.x - thisplaced.x > 0) ? 1 :
                                    (parentplaced.x - thisplaced.x == 0) ? 0 : -1;
                                const arrowupish = (parentplaced.y - thisplaced.y > 0) ? 1 : -1;
                                var arrowpointX, arrowpointY, arrowgrad;
                                if (arrowleftish == 0) {
                                    arrowpointX = (flow.size.x2 + flow.size.x1) / 2; // (x2-x1)/2 + x1
                                    arrowpointY = (arrowupish == 1) ? flow.size.y2 + flow.size.basebtn :
                                        flow.size.shapemargin;
                                    arrowgrad = (arrowupish == 1) ? Math.PI : 0;
                                } else if (arrowleftish == 1) {
                                    arrowpointX = (flow.size.x3 + flow.size.x2) / 2;
                                    arrowpointY = (arrowupish == 1) ? flow.size.y1 + flow.size.basebtn : flow.size.shapemargin;
                                    arrowpointY += (flow.size.x3 - flow.size.x2) / 2 * flow.size.grad;
                                    arrowgrad = Math.atan2(1 / 2, -arrowupish * 2 / 7); // function params (dy, dx).
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
                                //ctx.arc(arrowpointX, arrowpointY, flow.size.shapemargin / 2, 0, 2 * Math.PI);
                            }
                        }
                        function toHSL(H) {
                            // Copied from https://css-tricks.com/converting-color-spaces-in-javascript/
                            // Convert hex to RGB first
                            let r = 0, g = 0, b = 0;
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
                                h = 0, s = 0, l = 0;
                            // Calculate hue
                            if (delta == 0) {// No difference
                                h = 0;
                            } else if (cmax == r) {// Red is max
                                h = ((g - b) / delta) % 6;
                            } else if (cmax == g) {// Green is max
                                h = (b - r) / delta + 2;
                            } else {// Blue is max
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

                            return { "hue": h, "sat": s, "light": l };
                        }
                    }
                }
            }
        };
    }
);
