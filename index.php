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
 * Enable a list view of courseflows in a course
 *
 * @package    mod_courseflow
 * @copyright  2020 Naomi Quirke
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once('../../config.php');
require_login();
global $USER;

$id = required_param('id', PARAM_INT); // Course ID.
$course = $DB->get_record('course', array('id' => $id), '*', MUST_EXIST);
$context = context_course::instance($courseid);
if (has_capability('mod/courseflow:addinstance', $context)) {
    $PAGE->set_url('/mod/courseflow/index.php', array('id' => $id));
    $PAGE->set_pagelayout('incourse');

    // Print the header.
    $strplural = get_string('modulenameplural', 'courseflow');
    $PAGE->navbar->add($strplural);
    $PAGE->set_title($strplural);
    $PAGE->set_heading($course->fullname);
    echo $OUTPUT->header();
    echo $OUTPUT->heading(format_string($strplural));

    foreach ($modinfo->instances['courseflow'] as $cm) {
        echo $OUTPUT->container($link = "<a href=\"view.php?id=$cm->id\">" . format_string($cm->name, true) . "</a>");
    }
    echo $OUTPUT->footer();
}
