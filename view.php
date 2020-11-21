<?php
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

/**
 * Set up the form to select the activities for the flow.
 *
 * @package   mod_courseflow
 * @copyright 2020 Naomi Quirke
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once('../../config.php');

$cmid = required_param('id', PARAM_INT);
list ($course, $cm) = get_course_and_cm_from_cmid($cmid, 'courseflow');
$context = context_module::instance($cmid);
require_login($course, true, $cm);
// If a person has capability compare, then they can compare course cado to any cados on the site.
require_capability('mod/courseflow:addinstance', $context);
$url = new moodle_url('/mod/courseflow/view.php', ['id' => $cmid]);
$PAGE->set_url($url);

$title = get_string('modulename', 'courseflow');
$PAGE->set_title($title);

global $DB, $CFG;
$adminconfig = get_config('mod_courseflow');

// Create mods info array.
$mi = get_fast_modinfo($course);
$cms = array_filter($mi->get_cms(),
    function ($cminfo) {
        return ($cminfo->completion > 1) && ($cminfo->url !== null)
            && ($cminfo->deletioninprogress == false);
        // Note issue with making "accessible but not on course page" with manual completion.
        // Take off manual completion and activities without links, as not in spirit of courseflow, though this is arguable.
    }
);

$flowsaved = $DB->get_record('courseflow', ['id' => $cm->instance]);
$flowsteps = json_decode($flowsaved->flow, true); // True option converts to associative array.
$activitylist = ["0" => get_string('selectactivity', 'courseflow')];
$cminfo = [];
foreach ($cms as $cm) {
    $activitylist[$cm->id] = $cm->name;
    $inflow = 0;
    if (!is_null($flowsteps) && array_key_exists("$cm->id", $flowsteps)) {
        $inflow = 1; // Then it already exists in flow.
    }
    $sectionvisible = $mi->get_section_info($cm->sectionnum)->visible;
    $cminfo[$cm->id] = [
        'id' => $cm->id,
        'name' => $cm->name,
        'link' => $cm->url->out(),
        // Check that parent has not been deleted.
        'parentid' => $inflow ? (isset($cms[$flowsteps["$cm->id"]["parentid"]]) ? $flowsteps["$cm->id"]["parentid"] : 0) : 0,
        'preferred' => $inflow ? $flowsteps["$cm->id"]["preferred"] : 0,
        'colouravail' => $inflow ? $flowsteps["$cm->id"]["colouravail"] : $adminconfig->avail_colour,
        'visiblepage' => $sectionvisible ? ($cm->visible ? $cm->visibleoncoursepage : 0) : 0,
        'accessible' => $cm->visible,
        'open' => ($cm->groupingid == 0 && $cm->availability === null) ? 1 : 0,
        'tracking' => $cm->completion,
        'sectionnum' => $cm->sectionnum,
        'sectionvisible' => $sectionvisible
        ];
    if ($cminfo[$cm->id]['open']) {
        $cminfo[$cm->id]['availinfo'] = '';
    } else {
        $ci = new \core_availability\info_module($cm);
        $cminfo[$cm->id]['availinfo'] = $ci->get_full_information();
//        error_log("\r\n" . time() . "******fullinfo*****" . "\r\n" . print_r($fullinfo, true), 3, "d:\moodle_server\server\myroot\mylogs\myerrors.log");
    }
}
$allowstealth = !empty($CFG->allowstealth) ? 1 : 0;
$activityinfo = json_encode($cminfo);
$flowform = new mod_courseflow_activityflow($url, ['activitylist' => $activitylist, 'activityinfo' => $activityinfo,
    'allowstealth' => $allowstealth]);

if ($flowform->is_cancelled()) {
    redirect(new moodle_url('/course/view.php', array('id' => $course->id), "module-".$cmid ));
} else if (($fromform = $flowform->get_data())) {
    $flowsaved->flow = $fromform->flow;
    $DB->update_record('courseflow', $flowsaved);

    // Now update visibility in course module record.
    $flowdata = json_decode($fromform->flow);
    if (is_object($flowdata)) {
        // Get refreshed cache in case something has changed while working on form, but use own structure.
        $newcminfo = get_fast_modinfo($course);
        foreach ($flowdata as $activity) {
            $id = $activity->id;
            $newcm = $newcminfo->cms;
            if (has_capability('moodle/course:activityvisibility', context_module::instance($id))
                && array_key_exists($id, $newcm)) { // Not been deleted.
                $cmvisible = $newcm[$id]->visible;
                if (($activity->accessible != $newcm[$id]->visible) ||
                    ($activity->visiblepage != $newcm[$id]->visibleoncoursepage)) {
                    $cmsection = $newcm[$id]->sectionnum;
                    $newsectionvisible = $newcminfo->get_section_info($cmsection)->visible;
                    // Update course modules table.
                    $cmdata = ['id' => $id,
                        'timemodified' => time(),
                        'visible' => $activity->accessible];
                    if ($allowstealth) {
                        $cmdata['visibleoncoursepage'] = $activity->visiblepage;
                    } else {
                        $cmdata['visibleoncoursepage'] = 1;
                    }
                    if ($newsectionvisible) {
                        $cmdata['visibleold'] = $activity->accessible;
                    }
                    $DB->update_record('course_modules', $cmdata);
                }
            }
        }
    }
    rebuild_course_cache($course->id, true);
    redirect(new moodle_url('/course/view.php', array('id' => $course->id), "module-".$cmid));
} else {
    $formrenderer = $PAGE->get_renderer('mod_courseflow');
    $formrenderer->render_form_header();
    $PAGE->requires->strings_for_js([
        'flowformactivity',
        'flowformactivityhelp',
        'flowformalert',
        'flowformcolour',
        'flowformcolourhelp',
        'flowformmove',
        'flowformmovehelp',
        'flowformprereq',
        'flowformprereqhelp',
        'flowformrestrictions',
        'flowformrestrictionshelp',
        'flowformsection',
        'flowformsectionhelp',
        'flowformvisible',
        'flowformvisiblehelp',
        'flowformvisiblecourse',
        'flowformvisiblecoursehelp',
        ], 'courseflow', null);
    $PAGE->requires->js_call_amd('mod_courseflow/flowform', 'init', []);
    $flowform->display();
    $formrenderer->render_form_footer();
}
