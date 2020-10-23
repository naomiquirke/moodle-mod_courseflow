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
$flowsaved = $DB->get_record('courseflow', ['id' => $cm->instance]);
$flowform = new mod_courseflow_activityflow($url, ['thisflow' => $flowsaved]);

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
    $PAGE->requires->js_call_amd('mod_courseflow/flowform', 'init', [$flowform->activityinfo]);
    $flowform->display();
    $formrenderer->render_form_footer();
}
