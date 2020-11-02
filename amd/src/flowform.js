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
 * @module mod_courseflow/flowform
 */
define(['jquery'],
    function ($) {
        /**
         * @alias module:mod_courseflow/flowform
         */

        return {
            init: function (flowInfo) {
                // Set up display and get information about activities and current flows.
                var flowlabel = $("#id_flow");
                flowlabel.after('<div class="flowdisplay" id="flowdisplay"></div>');
                flowlabel.hide();
                var data = JSON.parse(flowInfo);
                var activityinfo = data[0];

                //Set up parent selectors
                var parentselector = $("#id_parentselector");
                parentselector.attr("class", "parentselector custom-select");
                parentselector.hide();
                const activityselector = $("#id_activityselector");
                if (data[1]) {
                    $("#flowdisplay").text(data[1]).addClass("cf-teachermessage");
                    activityselector.hide();
                    return;
                }

                // Tidy up preferreds and set up display lines.
                let a = Object.keys(activityinfo).sort((a, b) => (activityinfo[a].preferred - activityinfo[b].preferred));
                var steps = 0;
                a.forEach(value => {
                    if (activityinfo[value].preferred != 0) {
                        steps++;
                        activityinfo[value].preferred = steps;
                        addline(value, activityinfo[value].name);
                        $(`#id_activityselector option[value = ${value}]`).appendTo(parentselector);
                        if (activityinfo[value].parentid > 0) {
                            $(`#sel-flowstep-${value} option[value = ${activityinfo[value].parentid}]`).prop('selected', true);
                        }
                    }
                }
                );

                // Update Flow with new preferred numbers & tidy.
                outputflow();

                // Set up activity selector.
                // When an activity is selected, its properties are updated, it's added to the flow display, and selectors added.
                activityselector.change(function () {
                    var activityselected = $("#id_activityselector option:selected");
                    var flower = activityselected.val();
                    if (flower == 0) { return; }
                    updaterecord(flower);
                    // Move chosen from activity to parent selector.
                    addline(flower, activityinfo[flower].name);
                    // We only want options added afterwards to have access to this as a parent.
                    activityselected.appendTo($("#id_parentselector"));
                    // Update flow.
                    outputflow();
                });

                // Changing the content of activity records.
                // Details are set in activityinfo so that colour etc choices persist within one session.
                function updaterecord(chosen) {
                    if (activityinfo[chosen].preferred > 0) { // Then we are deleting.
                        activityinfo[chosen].preferred = 0;
                    } else { // Then we are adding.
                        steps++;
                        activityinfo[chosen].preferred = steps;
                    }
                }

                // Tidy up then publish the changes into the textbox ready for form save.
                function outputflow() {
                    $(".btn-flowstep-down").attr('disabled', false).css({ opacity: 1 });
                    $(".btn-flowstep-down").last().attr('disabled', true).css({ opacity: 0.5 });
                    $(".btn-flowstep-up").attr('disabled', false).css({ opacity: 1 });
                    $(".btn-flowstep-up").first().attr('disabled', true).css({ opacity: 0.5 });

                    flowlabel.val(JSON.stringify(activityinfo, (name, value) => {
                        if (!name || !activityinfo[name]) {
                            return value;
                        }
                        return activityinfo[name].preferred == 0 ? undefined : value;
                    }
                    ));
                }

                // Add a line on to the flow display containing name, the remove, colour, reorder, buttons, and parent selector.
                // Updating parent selectors.
                function addline(index, value) {
                    // Now add the new line
                    $(`<div class="flowstep" id="flowstep-${index}">`).appendTo("#flowdisplay");
                    var me = $(`#flowstep-${index}`);
                    me.append(`<div class="stepname">${value}</div>`);

                    var removebutton = $('<input/>')
                        .attr({
                            type: "button",
                            class: "btn-flowstep-remove btn-secondary",
                            id: "btn-flowstep-" + index,
                            value: ' \u26CC '
                        })
                        .on("click", function () {
                            removestep(index);
                        })
                        ;
                    me.append(removebutton);

                    var upbutton = $('<input/>')
                        .attr({
                            type: "button",
                            class: "btn-flowstep-up btn-secondary",
                            id: "btn-stepup-" + index,
                            value: ' \u22C0 '
                        })
                        .on("click", function () {
                            movestep(index, "up");
                        })
                        ;
                    me.append(upbutton);

                    var downbutton = $('<input/>')
                        .attr({
                            type: "button",
                            class: "btn-flowstep-down btn-secondary",
                            id: "btn-stepdown-" + index,
                            value: ' \u22C1 '
                        })
                        .on("click", function () {
                            movestep(index, "down");
                        })
                        ;
                    me.append(downbutton);

                    // Add parent selector.
                    parentselector.clone().appendTo(me)
                        .attr({
                            id: `sel-flowstep-${index}`,
                        })
                        .on("click", function () {
                            activityinfo[index].parentid = $(this).val();
                            outputflow();
                        })
                        .show();

                    // Add colour selector.
                    var colourbutton = $('<input/>')
                        .attr({
                            type: "color",
                            class: "btn-flowstepcolour btn-secondary",
                            id: `btn-flowstepcolour-${index}`,
                        })
                        .val(activityinfo[index].colouravail)
                        .on("change", function () {
                            updateColour(index);
                        });
                    me.append(colourbutton);

                    // Add visibility selector.
                    var visiblitycheck = $('<input/>')
                        .attr({
                            type: "checkbox",
                            id: `chk-vis-${index}`,
                            class: "form-check-input checkboxgroup1"
                        })
                        .prop("checked", activityinfo[index].visible)
                        .on("change", function () {
                            updateVis(index);

                        });
                    me.append(visiblitycheck);
                }

                // Take off a selected activity from the flow.
                function removestep(removedid) {
                    // Find anything that has set this step as a parent.
                    $.each(activityinfo, function (index, value) {
                        if (value.parentid == removedid) {
                            activityinfo[index].parentid = "0";
                            $(`#sel-flowstep-${index}`).css("backgroundColor", "pink").animate({ "opacity": 0.5 }, "fast",
                                function () {
                                    $(this).css({ "backgroundColor": "initial", "opacity": 1 });
                                });
                        }
                    });

                    updaterecord(removedid);

                    // Move activity back into available activities.
                    $(`#id_parentselector option[value = ${removedid}]`).appendTo(activityselector);
                    // Update all parent selector clones to remove it as a possibility.
                    $(`.parentselector option[value = ${removedid}]`).remove();
                    // Remove the entire line from flowdisplay.
                    $(`#flowstep-${removedid}`).remove();
                    // Put the activity selector pointer back to 0.
                    activityselector.prop('selectedIndex', 0);
                    // Update Flow and tidy.
                    outputflow();
                }

                function updateColour(index) {
                    activityinfo[index].colouravail = $(`#btn-flowstepcolour-${index}`).val();
                    outputflow();
                }

                function updateVis(index) {
                    activityinfo[index].visibility = $(`#chk-flowstepcolour-${index}`).prop("checked");
                    outputflow();
                }

                function movestep(index, direction) {
                    var index1, index2;
                    const swap = (direction == "up") ? $(`#flowstep-${index}`).prev() : $(`#flowstep-${index}`).next();
                    if (swap.length == 0) {
                        return;
                    }
                    if (direction == "up") {
                        index1 = index;
                        index2 = swap.attr("id").slice(9);
                    } else {
                        index2 = index;
                        index1 = swap.attr("id").slice(9);
                    }
                    // Swap preferreds.
                    const oldpreferred = activityinfo[index1].preferred;
                    activityinfo[index1].preferred = activityinfo[index2].preferred;
                    activityinfo[index2].preferred = oldpreferred;
                    // Update parent select.
                    const thisselect = `#sel-flowstep-${index1}`;
                    const swapselect = `#sel-flowstep-${index2}`;
                    let currentselected = $(`${thisselect} option:selected`).val();
                    if (currentselected == index2) {
                        $(thisselect).val("0");
                        activityinfo[index1].parentid = "0";
                    }
                    $(`${thisselect} option[value = ${index2}]`).remove();
                    $(swapselect).append(`<option value=${index1}>${activityinfo[index1].name}</option>`);
                    // Move line.
                    $(`#flowstep-${index1}`).insertBefore(`#flowstep-${index2}`);
                    outputflow();
                }
            }
        };
    }
);

