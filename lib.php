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
        case FEATURE_NO_VIEW_LINK:
            return true;
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
    $flowsaved = json_decode($stored->flow);
    $outerflow = new stdClass();
    if (!is_object($flowsaved->steps)) {
        return;
    }
    $role = 0;
    if (!has_capability('mod/courseflow:addinstance', $context)) {
        $completion = new completion_info($COURSE);
        $role = 1;
    }
    $outerflow->mod = $info->id;
    $cmods = get_fast_modinfo($COURSE, $USER->id);
    $flowsteps = (array)$flowsaved->steps;
    foreach ($flowsteps as &$step) {
        $cmid = $step->id;
        $step->deleted = 0;
        try { // If activity has been subsequently deleted after flow being edited.
            $cm = $cmods->get_cm($cmid);
        } catch (\Exception $e) {
            $cmid = 0;
            $step->deleted = 1;
            $step->link = 0;
            $step->name = $step->name . " (deleted)";
            $step->completion = -2;
            $step->cfclass = "cf-deleted";
            $step->basehex = '../mod/courseflow/pix/basehex_deleted.svg';
            continue;
        }

        if ($cm->uservisible && $cm->visible) {
            if ($role) { // Participant.
                // Have 'true' in following: assume most course activities will be included.
                $activitycompletion = $completion->get_data($cm, true, $USER->id);
                if ($activitycompletion->completionstate > 0) {
                    $step->completion = 1;
                    $step->cfclass = "cf-available";
                } else {
                    $step->completion = 0;

                }
            } else {
                $step->completion = 1;
                $step->cfclass = "cf-available";
            }
        } else {
            $step->completion = -1;
            $step->cfclass = "cf-hidden";
            if ($role) { // Participant.
                $step->link = 0;
            }
        }
    }
    $parents = $flowsaved->tree;
    $suggested = 1;
    foreach ($parents as $parent) {
        foreach ($parent->children as $child) {
            if ($flowsteps[$child->id]->completion == 0) {
                if ($parent->id != "0" && $flowsteps[$parent->id]->completion == 0) {
                    $flowsteps[$child->id]->cfclass = "cf-notavailable";
                    $flowsteps[$child->id]->link = 0;
                } else {
                    if ($suggested) {
                        $flowsteps[$child->id]->cfclass = "cf-next cf-suggested";
                        $suggested = 0;
                    } else {
                        $flowsteps[$child->id]->cfclass = "cf-next";
                    }
                }
            }
        }
    }
    $flowform = [];
    foreach ($flowsteps as $anotherstep) {
        $flowform[$anotherstep->preferred] = (object)['modid' => $anotherstep->id
            , 'preferred' => $anotherstep->preferred
            , 'parentid' => $anotherstep->parentid == 0 ? 0 : $flowsteps[$anotherstep->parentid]->preferred
            , 'colouravail' => $anotherstep->colouravail
            ];
    }
    $outerflow->flowdata = $flowform; // Send through a cut down version to javascript.
    $outerflow->json = json_encode($outerflow);
    $outerflow->flowdata = array_values((array) $flowsteps); // Moustache can't cope with sparse arrays.
    $renderer = $PAGE->get_renderer('mod_courseflow');
//    error_log("\r\n" . time() . "******tree*****" . "\r\n" . print_r($tree, true), 3, "d:\moodle_server\server\myroot\mylogs\myerrors.log");
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
    // For students we need to update after every activity completion if included in flow.
    // So eventually necessary to add more here.
}

/**
 * Set up info for the hex drawing procedure, if we are using it.
 * Can't use this because each can have two states deending on state of animation!!!!!!
 *
 * @param string $basecolour
 * @param string $classesassigned
 * @return stdClass colour set required for drawing the shape, that is, HSL .
 */
function gethexinfo($basecolour, $classesassigned) {
    $basecolour = array($basecolour[0].$basecolour[1], $basecolour[2].$basecolour[3], $basecolour[4].$basecolour[5]);
    $rgbval = array_map(function($part) {
        return hexdec($part) / 255;
    }, $basecolour);
    $maxval = max($rgbval);
    $minval = min($rgbval);
    $l = ($maxval + $minval) / 2;
    if ($maxval == $minval) {
        $h = $s = 0;
    } else {
        $diff = $maxval - $minval;
        $s = $l > 0.5 ? $diff / (2 - $maxval - $minval) : $diff / ($maxval + $minval);
        switch($maxval) {
            case $rgbval[0]:
                $h = ($rgbval[1] - $rgbval[2]) / $diff + ($rgbval[1] < $rgbval[2] ? 6 : 0);
            break;
            case $rgbval[1]:
                $h = ($rgbval[2] - $rgbval[0]) / $diff + 2;
            break;
            case $rgbval[2]:
                $h = ($rgbval[0] - $rgbval[1]) / $diff + 4;
            break;
        }
        $h /= 6;
    }
    return (object)[$h, $s, $l];

}