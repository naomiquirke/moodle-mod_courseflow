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
 * Set up the form to ask about setting activities in courseflow to not visible
 *
 * @package   mod_courseflow
 * @copyright 2020 Naomi Quirke
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once('../../config.php');
global $DB;

$cmid = required_param('id', PARAM_INT);

list ($course, $cm) = get_course_and_cm_from_cmid($cmid, 'courseflow');
$context = context_module::instance($cmid);
require_login($course, true, $cm);
require_capability('mod/courseflow:addinstance', $context);

$url = new moodle_url('/mod/courseflow/setnotvisible.php', ['id' => $cmid]);
$PAGE->set_url($url);

$title = get_string('modulename', 'courseflow');
$PAGE->set_title($title);
$mi = get_fast_modinfo($course);
$cms = array_filter($mi->get_cms(),
    function ($cminfo) {
        return ($cminfo->completion >= 0)
        // Note issue with making "accessible but not on course page" with manual completion.
            && ($cminfo->deletioninprogress == false);
    }
);
$cminfo = [];
foreach ($cms as $cm) {
    $cminfo[$cm->id] =
        ['id' => 'courseflow_' . $cm->id,
        'name' => $cm->name,
        'visible' => $cm->visible,
        'visiblepage' => $cm->visibleoncoursepage,
        'open' => ($cm->groupingid == 0 && $cm->availability == null) ? 1 : 0,
        'tracking' => $cm->completion,
        'sectionnum' => $cm->sectionnum,
        'sectionvisible' => $mi->get_section_info($cm->sectionnum)->visible
        ];
}

$setnotvisibleform = new mod_courseflow_setnotvisible($url, $cminfo);

if ($setnotvisibleform->is_cancelled()) {
    redirect(new moodle_url('/course/view.php', array('id' => $course->id)));

} else if (($fromform = $setnotvisibleform->get_data())) {
    $somethingupdated = 0;
    foreach ($cminfo as $id => $activity) {
        $checka = "a_" . $activity['id'];
        $checkb = "b_" . $activity['id'];
        if (($fromform->$checka != $activity['visible']) || ($fromform->$checkb != $activity['visiblepage'])) {
            if (has_capability('moodle/course:activityvisibility', context_module::instance($id))) {
                // Update course modules table.
                $cmdata = ['id' => $id, 'timemodified' => time(),
                'visible' => $fromform->$checka,
                'visibleold' => $fromform->$checka,
                'visibleoncoursepage' => $fromform->$checkb];
                $DB->update_record('course_modules', $cmdata);
                $somethingupdated = 1;
            }
        }
    }
    if ($somethingupdated) {
        rebuild_course_cache($course->id, true);
    }
    redirect(new moodle_url('/course/view.php', array('id' => $course->id)));
} else {
    $formrenderer = $PAGE->get_renderer('mod_courseflow');
    $formrenderer->render_form_header();
    $setnotvisibleform->display();
    $formrenderer->render_form_footer();
}
