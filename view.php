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

global $DB;
$adminconfig = get_config('mod_courseflow');

// Create mods info array.
$mi = get_fast_modinfo($course);
$cms = array_filter($mi->get_cms(),
    function ($cminfo) {
        return ($cminfo->completion >= 0)
        // Note issue with making "accessible but not on course page" with manual completion.
            && ($cminfo->deletioninprogress == false);
    }
);

$flowsaved = $DB->get_record('courseflow', ['id' => $cm->instance]);
$flowsteps = json_decode($flowsaved->flow, true); // True option converts to associative array.
$activitylist = ["0" => get_string('selectactivity', 'courseflow')];
$cminfo = [];
foreach ($cms as $cm) {
    if (!is_null($flowsteps) && array_key_exists("$cm->id", $flowsteps)) {
        // Then it already exists in flow.
        $thisparent = $flowsteps["$cm->id"]["parentid"];
        $cminfo[$cm->id] = $flowsteps["$cm->id"];
        $cminfo[$cm->id]["name"] = $cm->name; // In case it has changed name.
        if (!isset($cms[$thisparent])) {
            // Parent has been deleted. Set to no parent.
            $cminfo[$cm->id]["parentid"] = 0;
        }
        $activitylist[$cm->id] = $cm->name;
    } else {
        $activitylist[$cm->id] = $cm->name;
        $cminfo[$cm->id] = [
            'id' => $cm->id,
            'name' => $cm->name,
            'link' => $cm->url->out(),
            'parentid' => '0',
            'preferred' => 0,
            'colouravail' => $adminconfig->avail_colour,
            'visible' => $cm->visible,
            'visiblepage' => $cm->visibleoncoursepage,
            'open' => ($cm->groupingid == 0 && $cm->availability == null) ? 1 : 0,
            'tracking' => $cm->completion,
            'sectionnum' => $cm->sectionnum,
            'sectionvisible' => $mi->get_section_info($cm->sectionnum)->visible];
    }
}
$errormessage = count($cminfo) == 0 ? get_string('alertnocompletion', 'courseflow') : null;
$activityinfo = json_encode([$cminfo, $errormessage]);
$flowform = new mod_courseflow_activityflow($url, $activitylist);

if ($flowform->is_cancelled()) {
    redirect(new moodle_url('/course/view.php', array('id' => $course->id), "module-".$cmid ));
} else if (($fromform = $flowform->get_data())) {
    $flowsaved->flow = $fromform->flow;
    $DB->update_record('courseflow', $flowsaved);
    rebuild_course_cache($course->id, true);
    redirect(new moodle_url('/course/view.php', array('id' => $course->id), "module-".$cmid));
} else {
    $formrenderer = $PAGE->get_renderer('mod_courseflow');
    $formrenderer->render_form_header();
    $PAGE->requires->strings_for_js([
        'flowformaccessibility',
        'flowformactivity',
        'flowformalert',
        'flowformcolour',
        'flowformmove',
        'flowformprereq',
        'flowformsection',
        'flowformvisible'], 'courseflow', null);
    $PAGE->requires->js_call_amd('mod_courseflow/flowform', 'init', [$activityinfo]);
    $flowform->display();
    $formrenderer->render_form_footer();
}
