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
 * Mobile cado view
 *
 * @package    mod_cado
 * @copyright  2021 Naomi Quirke
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace mod_courseflow\output;

defined('MOODLE_INTERNAL') || die();

use context_module;

/**
 * Mobile output class for courseflow
 *
 * @package    mod_courseflow
 * @copyright  2021 Naomi Quirke
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class mobile {

    /**
     * Returns the courseflow view for the mobile app, currently no different than browser view.
     * @param  array $args Arguments from tool_mobile_get_content WS
     *
     * @return array       HTML, javascript and otherdata
     */
    public static function mobile_courseflow_view($args) {
        global $COURSE, $USER, $OUTPUT, $DB;

        $args = (object) $args;
        $cm = get_coursemodule_from_id('courseflow', $args->cmid);

        // Capabilities check. Available if can login to course.
        require_login($args->courseid , false , $cm, true, true);

        $courseflowinstance = $DB->get_record('courseflow', array('id' => $cm->instance));

        // A.

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
        $outerflow->mod = $cm->id;
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

        // A.
        $args->data = $outerflow;

        return array(
            'templates' => array(
                array(
                    'id' => 'main',
                    'html' => $OUTPUT->render_from_template('mod_courseflow/courseflow', $args),
                ),
            ),
            'javascript' => '',
            'otherdata' => '',
            'files' => ''
        );
    }
}
