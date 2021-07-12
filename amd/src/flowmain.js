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
                if (coursestream.flowheight == 0) {
                    return;
                }
                if (coursestream.role != 0) {
                    // Hide the link to the activity edit.
                    $(`li#module-${coursestream.mod} div.activityinstance a`).css("visibility", "hidden");
                }

                coursestream.container = `div#cf-container-${coursestream.mod}`;
                $(coursestream.container).on("mousedown", function(e) {
                    e.preventDefault();
                });
//                $(`${coursestream.container} .cf-outer-hex`).css("position", "absolute");
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
                drawShapes(coursestream);

                /** Once we have the sizing, work out the flow.placing and then draw the shapes.
                 * @param {object} flow - All the details of this flow.
                */
                function drawShapes(flow) {
                    flow.size = setSizes(flow.mod, flow.container);
                    let maxrow = placelist();

                    // Set the size of the containing element based on the number of hex rows that have been used.
                    $(flow.container).css("height", (maxrow + 0.8) * flow.size.stackdown + "px");

                    // Initialise marker for next suggested shape, only one up button can have this.
                    let nextsuggested = 0;
                    // Draw the shapes
                    flow.floworder.forEach(c => {
                        const shapeid = c[0];
                        const placed = flow.flowdata[shapeid].placed;
                        let shapeversion = 0;
                        for (; shapeversion < placed.length; shapeversion++) {
                            const hexplacement = placed[shapeversion];
                            let shapeholder = $(`#cf-outer-hex-${flow.mod}-${shapeid}-${shapeversion}`);

                            if (shapeholder.length == 0) {
                                // This must be drawn from scratch.
                                shapeholder = $(`#cf-outer-hex-${flow.mod}-${shapeid}-0`).clone(true, true);
                                shapeholder
                                    .attr("id", `cf-outer-hex-${flow.mod}-${shapeid}-${shapeversion}`)
                                    .addClass("cf-clone");
                                shapeholder.children(".cf-inner-hex")
                                    .attr("id", `cf-inner-hex-${flow.mod}-${shapeid}-${shapeversion}`);
                                shapeholder.children(".cf-img")
                                    .attr("id", `cf-img-${flow.mod}-${shapeid}-${shapeversion}`);
                                shapeholder.children(".cf-hex-mid")
                                    .attr("id", `cf-hex-mid-${flow.mod}-${shapeid}-${shapeversion}`);
                                shapeholder.find(".cf-hex-txt").attr("id", `cf-hex-txt-${flow.mod}-${shapeid}-${shapeversion}`);
                                shapeholder.appendTo($(`${flow.container}`));
                            }
                            drawhex(shapeid, shapeversion);
/*                            Updatelinks(shapeid, shapeversion);*/
                            shapeholder.animate({
                                "left": (hexplacement.x * flow.size.stackright) + "px",
                                "top": (hexplacement.y * flow.size.stackdown) + "px"
                            }, {queue: false});
                        }
                        // Get rid of unused foldbacks. Continue from prev. shapeversion.
                        let oldouter = $(`#cf-outer-hex-${flow.mod}-${shapeid}-${shapeversion}`);
                        while (oldouter.length >= 1) {
                            oldouter.remove();
                            shapeversion++;
                            oldouter = $(`#cf-outer-hex-${flow.mod}-${shapeid}-${shapeversion}`);
                        }
                    });

                    /** Get placements.
                     * @returns {number} realmax = number of lines.
                    */
                    function placelist() {
                        // First get relative placements.
                        // Maxfoldback = 0;
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
                                cp.placed[0].placing[1][0] = cp.id;
                                cp.baseparent = {id: cp.id, version: 0};
                            } else {
                                let success = 0;
                                let version = -1;
                                while (!success) {
                                    version++;
                                    success = createplace(cp, version);
                                    // Maxfoldback = Math.max(version, maxfoldback);
                                }
                            }
                        });
                        // Update to actual placements.
                        let realmax = 0;
                        flow.floworder.forEach(c => {
                            let cp = flow.flowdata[c[0]];
                            cp.placed.forEach(cpversion => {
                                if (cpversion.rw) {
                                    cpversion.base = realmax - cpversion.minusy;
                                    cpversion.y = cpversion.ry + cpversion.base;
                                    realmax += cpversion.plusy - cpversion.minusy + 2;
                                } else {
                                    cpversion.y = cpversion.ry +
                                        flow.flowdata[cp.baseparent.id].placed[cp.baseparent.version].base;
                                }
                            });
                        });
                        return realmax;
                    }
                    /** Set up a position.
                     * @param {object} cp1
                     * @param {number} foldback giving version of hex on page
                     * @returns {boolean}
                    */
                    function createplace(cp1, foldback) {
                        let pp = flow.flowdata[cp1.parentid];
                        cp1.baseparent = (foldback == 0) ? pp.baseparent : {id: pp.id, version: foldback};
                        let bp = flow.flowdata[cp1.baseparent.id];
                        let baseplacements = bp.placed[cp1.baseparent.version];
                        let gotit = getplace(pp.placed[foldback].x, pp.placed[foldback].ry, baseplacements.placing);
                        if (gotit) {
                            cp1.placed[0] = {x: gotit[0], ry: gotit[1], rw: 0};
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
                    /** Set up the sizes of each shape based on screen width and returns stats for ordering.
                     * @param {number} module id of flow
                     * @param {string} container jquery element
                     * @returns {object} hexdata.
                    */
                    function setSizes(module, container) {
                        let shapeholder = $(container);
                        let width = $(`li#module-${module}`).css("width");
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

                        $(`${container} div.cf-hex-mid`).css({
                            height: hexdata.x2 + "px",
                            width: hexdata.x2 + "px",
                            top: hexdata.x1 / 2 + "px",
                            left: hexdata.x1 / 2 + "px",
                            position: "absolute"
                        });
                        $(`${container} div.cf-txtholder`).css({
                            fontSize: font,
                        });
                        // Set the size of the shape images.
                        const allimages = document.querySelectorAll(`${container} img.cf-img`);
                        allimages.forEach(element => {
                            element.width = hexdata.innersizeX;
                            element.height = hexdata.innersizeY;
                        });
                        // Set the size of the canvases containing the corona and arrows.
                        $(`${container} canvas.cf-inner-hex`).attr({
                            width: hexdata.innersizeX + "px",
                            height: hexdata.innersizeY + "px"
                        });
                        return hexdata;
                    }

                    /** Set up to draw the shape on the canvas, getting the colours etc, and add the link if applicable.
                     * @param {number} id of activity associated with hex
                     * @param {number} copy version of hex
                    */
                    function drawhex(id, copy) {
//                        Let heximage = $(`#cf-img-${flow.mod}-${id}-${copy}`);
                        let canvas = $(`#cf-inner-hex-${flow.mod}-${id}-${copy}`).get(0).getContext('2d');
                        let text = $(`p#cf-hex-txt-${flow.mod}-${id}-${copy}`);
                        let activity = flow.flowdata[id];
                        if (!activity.deleted) {
                            if (activity.cfclass == "cf-next") {
                                nextsuggested = nextsuggested == 0 ? 1 : 2;
                            }
                            hexit(canvas, copy, nextsuggested);
                        }
                        nextsuggested = nextsuggested > 0 ? 2 : 0;

                        // Now the link & text.
                        let textcolour = copy ? "black" : "white";
                        text.css("color", textcolour);

                        /** Draw the shape on the canvas.
                         * @param {object} ctx canvas
                         * @param {number} copy the version of the hex, if 0 then original else not.
                         * @param {boolean} suggested if this hex has been suggested as the next activity.
                        */
                        function hexit(ctx, copy, suggested) {
                            ctx.clearRect(0, 0, flow.size.innersizeX, flow.size.innersizeY);
                            if (suggested == 1) {
                                // Then this is the suggested next activity.  Add corona.
                                let grd = ctx.createRadialGradient(flow.size.innersizeX / 2, flow.size.innersizeY / 2
                                    , flow.size.innersizeX * 0.4, flow.size.innersizeX / 2, flow.size.innersizeY / 2
                                    , flow.size.innersizeY / 2);
                                grd.addColorStop(0, 'rgba(255,215, 0, 0.5)');
                                grd.addColorStop(1, 'rgba(255, 215, 0, 0)');
                                ctx.fillStyle = grd;
                                ctx.fillRect(0, 0, flow.size.innersizeX, flow.size.innersizeY);
                            }
                            if (!copy) {
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
                            }
                        }
                    }
                }
            }
        };
    }
);
