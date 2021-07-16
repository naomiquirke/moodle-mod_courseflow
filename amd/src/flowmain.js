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
define(['jquery', 'core/url'],
    function($, url) {
        /**
         * @alias module:mod_courseflow/flowmain
         */

        return {
            init: function(coursestream) {
                if (coursestream.flowheight == 0) {
                    return;
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
                    // Set the size of the divs.
                    $(`${flow.container} div.cf-outer-hex`).css({
                        position: "absolute",
                        width: (flow.size.innersize * 1.1) + "px",
                    });
                    $(`${flow.container} div.cf-hex-mid`).css({
                        height: flow.size.innersize + "px",
                    });
                    $(`${flow.container} div.cf-txtholder`).css({
                        fontSize: flow.size.font,
                    });
                    // Place the shapes
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
                                shapeholder.children(".cf-hex-mid")
                                    .attr("id", `cf-hex-mid-${flow.mod}-${shapeid}-${shapeversion}`);
                                shapeholder.find(".cf-hex-txt").attr("id", `cf-hex-txt-${flow.mod}-${shapeid}-${shapeversion}`);
                                shapeholder.appendTo($(`${flow.container}`));
                            }
                            shapeholder.attr('class').split(/\s+/).forEach(e => {
                                let place = e.search("arrow");
                                if (place > 0) {
                                    let arrowimages = shapeholder.css("background-image");
                                    let nextimage = url.imageUrl(e.substring(place), 'mod_courseflow');
                                    if (arrowimages == "none") {
                                        shapeholder.css("background-image", `url(${nextimage})`);
                                    } else {
                                        shapeholder.css("background-image", arrowimages + `, url(${nextimage})`);
                                    }
                                }
                            });
                            shapeholder.css({
                                "left": (hexplacement.x * flow.size.stackright) + "px",
                                "top": (hexplacement.y * flow.size.stackdown) + "px",
                                "zIndex": flow.floworder.length - flow.flowdata[shapeid].preferred
                            });
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
                            addarrows(cp); // Comparison with parent placing ok here because children are always done after parents.
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
                        hexdata.font = "inherit";
                        width = parseInt(width, 10) - 10;
                        if (width < 300) {
                            shapeholder.parent().css("margin-left", 0);
                            hexdata.maxcol = 4;
                            hexdata.font = "xx-small";
                        } else if (width < 500) {
                            shapeholder.parent().css("margin-left", 0);
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
                        }
                        hexdata.stackright = (width - 1) / (hexdata.maxcol * 1.1);
                        hexdata.shapemargin = (hexdata.stackright) * 0.1; // Space between shapes.
                        hexdata.basebtn = (hexdata.stackright) * 0.1; // Height of button.
                        let truex2 = hexdata.stackright - hexdata.shapemargin;
                        hexdata.innersize = truex2 * 7 / 5;
                        hexdata.y2 = hexdata.innersize - hexdata.basebtn; // Height of shape.
                        hexdata.y1 = hexdata.y2 / 2 + hexdata.shapemargin; // Placement of shape middle y.
                        hexdata.y2 += hexdata.shapemargin; // Placement of shape bottom y.
                        hexdata.stackdown = hexdata.y1;
                        hexdata.innersizeY = hexdata.innersize + hexdata.shapemargin * 2;
                        hexdata.innersizeX = hexdata.innersize + hexdata.shapemargin * 2;
                        hexdata.x2 = truex2 + hexdata.shapemargin;
                        hexdata.x1 = hexdata.innersize * 2 / 7 + hexdata.shapemargin;
                        hexdata.x0 = 1 + hexdata.shapemargin;
                        hexdata.x3 = hexdata.innersize - 1 + hexdata.shapemargin;
                        return hexdata;
                    }

                    /** Set up to add arrow classes.
                     * @param {object} activity associated with hex
                    */
                    function addarrows(activity) {
                        // Arrows.
                        if (!activity.deleted && activity.parentid != "0") {
                            var parentplaced;
                            if (activity.parentid == activity.baseparent.id) {
                                parentplaced = flow.flowdata[activity.baseparent.id].placed[activity.baseparent.version];
                            } else {
                                parentplaced = flow.flowdata[activity.parentid].placed[0];
                            }
                            const thisplaced = activity.placed[0]; // Want .x and .y properties.
                            const arrownotvert = (parentplaced.x - thisplaced.x == 0) ? 0 : 1;
                            const arrowsideways = (parentplaced.x - thisplaced.x > 0) ? -1 : arrownotvert;
                            const arrowupish = (parentplaced.y - thisplaced.y > 0) ? 1 : 0;
                            let arrowclass = 'cf-arrow-r' + arrowsideways + 'u' + arrowupish;
                            $(`#cf-outer-hex-${flow.mod}-${activity.parentid}-0`).addClass(arrowclass);
                        }
                    }
                }
            }
        };
    }
);
