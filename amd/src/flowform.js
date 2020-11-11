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
            init: function (flowInfo, allowstealth) {
                // Set up display and get information about activities and current flows.
                var flowlabel = $("#id_flow");
                $(flowlabel.parent()).before('<div class="flowdisplay" id="flowdisplay"></div>');
                flowlabel.hide();
                var activityinfo = JSON.parse(flowInfo);

                //Set up parent selectors
                var parentselector = $("#id_parentselector");
                parentselector.attr("class", "parentselector custom-select");
                parentselector.hide();

                const activityselector = $("#id_activityselector");

                // Do check to see if there are prepared activities ready.  Do after prev so it looks tidy.
                if ($.isEmptyObject(activityinfo)) {
                    $("#flowdisplay").text(M.str.courseflow.flowformalert).addClass("cf-teachermessage");
                    activityselector.hide();
                    return;
                }

                // Move activity selector.
                $("#flowdisplay").after(activityselector);
                activityselector.addClass("activityselector");

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
                function addheader(sizestyle, name) {
                    const headname = M.str.courseflow[name];
                    const helpname = M.str.courseflow[name + 'help'];
                    return $(`<div data-toggle="tooltip"
                    title = "${helpname}"
                    class = "${sizestyle} headerhelp">${headname}</div>`);
                }

                // Add a line on to the flow display.
                // Updating parent selectors.
                function addline(index, value) {
                    // First check if this is the first, if so then need to add column titles.
                    if (activityinfo[index].preferred == 1) {
                        $("#flowdisplay").prepend(`<div id="headerwrap"></div>`);
                        $("#headerwrap").append(
                            addheader('activitywrap', 'flowformactivity'),
                            addheader('btnset', 'flowformmove'),
                            addheader('activitywrap', 'flowformprereq'),
                            addheader('checkboxinfo', 'flowformsection'),
                            addheader('checkboxinfo', 'flowformvisiblecourse'),
                            addheader('checkboxinfo', 'flowformvisible'),
                            addheader('checkboxinfo', 'flowformcolour'),
                            addheader('checkboxinfo', 'flowformrestrictions'),
                            `<hr>`
                        );
                    }
                    // Now add the new line
                    $(`<div class="flowstep" id="flowstep-${index}">`).appendTo("#flowdisplay");
                    var me = $(`#flowstep-${index}`);
                    me.append(`<div class="stepname">${value}</div>`);

                    const removebutton = $('<input/>')
                        .attr({
                            type: "button",
                            class: "btn-flowstep-remove btn-secondary",
                            id: "btn-flowstep-" + index,
                            value: ' \u26CC '
                        })
                        .on("click", function () {
                            removestep(index);
                        });
                    const upbutton = $('<input/>')
                        .attr({
                            type: "button",
                            class: "btn-flowstep-up btn-secondary",
                            id: "btn-stepup-" + index,
                            value: ' \u22C0 '
                        })
                        .on("click", function () {
                            movestep(index, "up");
                        });
                    const downbutton = $('<input/>')
                        .attr({
                            type: "button",
                            class: "btn-flowstep-down btn-secondary",
                            id: "btn-stepdown-" + index,
                            value: ' \u22C1 '
                        })
                        .on("click", function () {
                            movestep(index, "down");
                        });
                    me.append(`<div class="btnset" id="wrap-btn-${index}"></div>`);
                    $(`#wrap-btn-${index}`).append(' ', removebutton, ' ', upbutton, downbutton);

                    // Add parent selector.
                    const wrappar = $(`<div class="activitywrap" id="wrap-parent-${index}"></div>`);
                    me.append(wrappar);
                    parentselector.clone().appendTo(wrappar)
                        .attr({
                            id: `sel-flowstep-${index}`,
                        })
                        .on("click", function () {
                            activityinfo[index].parentid = $(this).val();
                            outputflow();
                        })
                        .show();

                    // Add section number & visibility.
                    const section = $(`<div> ${activityinfo[index].sectionnum} </div>`)
                        .attr({
                            class: "checkboxinfo",
                            id: `#wrap-secvis-${index}`
                        });
                    me.append(section);
                    const secchk = activityinfo[index].sectionvisible == 1 ? `<input type="checkbox" checked disabled/>`
                        : `<input type="checkbox" disabled/>`;
                    section.append(secchk);

                    // Add visible on page selector.
                    // Note we are not using standard Moodle setting method for when section is not visible.
                    // This will be 0 if accessible is 0 or sectionvisible is 0.
                    // In PHP result will be reset to 1 even if 0 unless stealth is enabled.
                    let chkvis = activityinfo[index].sectionvisible == 0 ? `<input type="checkbox" disabled/>` :
                        activityinfo[index].visiblepage == 1 ? `<input type="checkbox" checked/>` : `<input type="checkbox"/>`;
                    let visiblitycheck = $(chkvis)
                        .attr({
                            name: `chk-vis-${index}`,
                            id: `chk-vis-${index}`,
                            class: "checkboxgroup1", //form-check-input
                        })
                        .on("click", function () {
                            activityinfo[index].visiblepage = $(`#chk-vis-${index}`).prop("checked") ? 1 : 0;
                            if (activityinfo[index].visiblepage) {
                                // Set accessible to be true
                                activityinfo[index].accessible = 1;
                                $(`#chk-acc-${index}`).prop("checked", true);
                            } else if ((!allowstealth) && (activityinfo[index].sectionvisible != 0)) {
                                // Can't have accessible but not visible on course page.
                                activityinfo[index].accessible = 0;
                                $(`#chk-acc-${index}`).prop("checked", false);
                            }
                            outputflow();
                        });
                    let wrapvis = $(`<div class="checkboxinfo" id="wrap-vis-${index}"></div>`);
                    me.append(wrapvis);
                    wrapvis.append(visiblitycheck);

                    // Then add accessible selector, this will be 1 if visiblepage is 1.
                    let chkacc = activityinfo[index].accessible == 1 ? `<input type="checkbox" checked/>` :
                        `<input type="checkbox"/>`;
                    let acccheck = $(chkacc)
                        .attr({
                            name: `chk-acc-${index}`,
                            id: `chk-acc-${index}`,
                            class: "checkboxgroup2", //form-check-input
                        })
                        .on("click", function () {
                            activityinfo[index].accessible = $(`#chk-acc-${index}`).prop("checked") ? 1 : 0;
                            if (!activityinfo[index].accessible) {
                                // Set visibility on page to be false.  This setting has different mechanism from Moodle visibility.
                                activityinfo[index].visiblepage = 0;
                                $(`#chk-vis-${index}`).prop("checked", false);
                            } else if ((!allowstealth) && (activityinfo[index].sectionvisible != 0)) {
                                // Then can't have accessible but not visible on course page.
                                activityinfo[index].visiblepage = 1;
                                $(`#chk-vis-${index}`).prop("checked", true);
                            }
                            outputflow();
                        });
                    wrapvis = $(`<div class="checkboxinfo" id="wrap-acc-${index}"></div>`);
                    me.append(wrapvis);
                    wrapvis.append(acccheck);


                    // Add colour selector.
                    const wrapcol = $(`<div class="checkboxinfo" id="wrap-col-${index}"></div>`);
                    const colourbutton = $('<input/>')
                        .attr({
                            type: "color",
                            class: "btn-flowstepcolour",
                            id: `btn-flowstepcolour-${index}`,
                        })
                        .val(activityinfo[index].colouravail)
                        .on("change", function () {
                            activityinfo[index].colouravail = $(`#btn-flowstepcolour-${index}`).val();
                            outputflow();
                        });
                    me.append(wrapcol);
                    wrapcol.append(colourbutton);

                    // Add availability info.
                    let avail = `<div class="checkboxinfo" id="info-avail-${index}"><input type="checkbox" ` +
                        (activityinfo[index].open != 1 ? "checked" : "") +
                        ` disabled /> ${activityinfo[index].availinfo}</div>`;
                    me.append(avail);
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

