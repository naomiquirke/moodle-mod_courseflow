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
 * This file contains the moodle hooks for the courseflow module.
 *
 * @package    mod_courseflow
 * @copyright  2020 Naomi Quirke
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die;

/**
 * Return the list if Moodle features this module supports
 *
 * @param string $feature FEATURE_xx constant for requested feature
 * @return mixed True if module supports feature, null if doesn't know
 */
function courseflow_supports($feature) {
    switch($feature) {
        case FEATURE_MOD_ARCHETYPE:
                return MOD_ARCHETYPE_RESOURCE;
        case FEATURE_GROUPS:
                return true;
        case FEATURE_GROUPINGS:
                return true;
        case FEATURE_MOD_INTRO:
                return false;
        case FEATURE_COMPLETION_TRACKS_VIEWS:
                return false;
        case FEATURE_GRADE_HAS_GRADE:
                return false;
        case FEATURE_GRADE_OUTCOMES:
                return false;
        case FEATURE_BACKUP_MOODLE2:
                return true;
        case FEATURE_SHOW_DESCRIPTION:
                return false;
        default:
                return null;
    }
};
/**
 * Adds courseflow instance
 *
 * @param stdClass $data
 * @return int The instance id of the new assignment
 */
function courseflow_add_instance(stdClass $data) {
    global $DB;
    $data->timemodified = time();

    // Enable completion in course if it isn't already.
    $course = $DB->get_record('course', array('id' => $data->course));
    if (empty($course->enablecompletion)) {
        if (has_capability('moodle/course:update', context_course::instance($course->id))) {
            $DB->update_record('course', ['id' => $course->id, 'enablecompletion' => 1]);
            rebuild_course_cache($course->id);
        }
    }
    return $DB->insert_record('courseflow', $data);
};

/**
 * Updates courseflow instance
 *
 * @param stdClass $data
 * @return bool
 */
function courseflow_update_instance(stdClass $data) {
    global $DB;
    $data->timemodified = time();
    $data->id = $data->instance;
    return $DB->update_record('courseflow', $data);
};

/**
 * Deletes courseflow instance
 *
 * This is done by calling the delete_instance() method of the courseflow type class
 * @param int $id = cm->instance in course/lib.php.
 * @return bool
 */
function courseflow_delete_instance($id) {
    global $DB;
    return $DB->delete_records('courseflow', array('id' => $id));
};


/**
 * Adds courseflow specific settings to the courseflow settings.
 * However is there access to admin settings?
 *
 * @param settings_navigation $settingsnav The settings navigation object
 * @param navigation_node $courseflownode The node to add module settings to
 * @return void
 */
function courseflow_extend_settings_navigation(settings_navigation $settingsnav, navigation_node $courseflownode) {
    global $PAGE, $CFG;

    // Link to set selected activities as not visible on course page.
    if (has_capability('mod/courseflow:addinstance', $PAGE->cm->context)) {
        $courseflownode ->add(get_string('setnotvisible', 'courseflow'),
                new moodle_url($CFG->wwwroot . '/mod/courseflow/setnotvisible.php', array('id' => $PAGE->cm->id)));
    }
}

// If necessary can insert here courseflow_get_coursemodule_info($cm).

/**
 * Update for user-specific views, depending on completions for students and parentid rules.
 * Simply applies appropriate class to each shape.
 * Note this is 'insecure', mod not intended to replace activity access settings, but to guide students.
 *
 * @param cm_info $cm Course-module object
 */
function courseflow_cm_info_view($info) {
    global $USER, $COURSE, $DB, $PAGE;
    $stored = $DB->get_record('courseflow', ['id' => $info->instance], 'flow');
    if (!$stored || !$stored->flow) {
        return;
    }
    $context = context_course::instance($COURSE->id);
    $outerflow = new stdClass();
    $outerflow->flowdata = json_decode($stored->flow);
    if (!is_object($outerflow->flowdata)) {
        return;
    }
    if (has_capability('mod/courseflow:addinstance', $context)) {
        $outerflow->role = 0;
    } else {
        $completion = new completion_info($COURSE);
        $outerflow->role = 1;
    }
    $outerflow->mod = $info->id;
    $flowsteps = $outerflow->flowdata;
    $cmods = get_fast_modinfo($COURSE, $USER->id);
    foreach ($flowsteps as &$step) {
        $cmid = $step->id;
        try { // If activity has been subsequently deleted after flow being edited.
            $cm = $cmods->get_cm($cmid);
        } catch (\Exception $e) {
            $cmid = 0;
            $step->deleted = 1;
            $step->link = "#";
            $step->name = $step->name . " (deleted)";
            $step->completion = 0;
            continue;
        }

        if ($cm->uservisible && $cm->visible) {
            if ($outerflow->role) {
                // Have 'true' in following: assume most course activities will be included.
                $activitycompletion = $completion->get_data($cm, true, $USER->id);
                $step->completion = ($activitycompletion->completionstate > 0) ? 1 : 0;
            } else {
                $step->completion = 1;
            }
        } else {
            $step->completion = -1;
        }
    }
    $outerflow->flowdata = $flowsteps;
    $outerflow->json = json_encode($outerflow);
    $outerflow->flowdata = array_values((array) $flowsteps); // Moustache can't cope with parameters in arrays.
    $renderer = $PAGE->get_renderer('mod_courseflow');
    $rendered = $renderer->render_courseflow($outerflow);

    $info->set_content($rendered, true); // Must have $isformatted=true.
}

/**
 * Check if the module has any update that affects the current user since a given time.
 *
 * @param  cm_info $cm course module data
 * @param  int $from the time to check updates from
 * @param  array $filter  if we need to check only specific updates
 * @return stdClass an object with the different type of areas indicating if they were updated or not
 * @since Moodle 3.2
 */
function courseflow_check_updates_since(cm_info $cm, $from, $filter = array()) {
    $updates = course_check_module_updates_since($cm, $from, array(), $filter);
    return $updates;
    // We need to update after every completion. Is it necessary to add more here?
}
