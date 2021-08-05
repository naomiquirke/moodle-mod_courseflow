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
use context_module;
defined('MOODLE_INTERNAL') || die();

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
     * Args includes courseid, userid, appid, appversionname, appversioncode, applang, appcustomurlscheme etc
     * @return array       HTML, javascript and otherdata
     */
    public static function mobile_courseflow_view($args) {
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
                $step->textclass = "cf-deleted";
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
            $flowform[$anotherstep->id] = (object)['id' => $anotherstep->id
                , 'preferred' => $anotherstep->preferred
                , 'parentid' => $anotherstep->parentid
                , 'deleted' => $anotherstep->deleted];
        }
        $outerflow->flowdata = $flowform; // Send through a cut down version.
        $outerflow->json = json_encode($outerflow);
        $outerflow->flowdata = array_values((array) $flowsteps); // Moustache can't cope with sparse arrays.
        $renderer = $PAGE->get_renderer('mod_courseflow');

        $rendered = $renderer->render_courseflow($outerflow);

        $info->set_content($rendered, true); // Must have $isformatted=true.

        // A.
        $args->data = $outerflow;

        return array(
            'templates' => array(
                array(
                    'id' => 'main',
                    'html' => $OUTPUT->render_from_template('mod_courseflow/courseflow', $args),
                ),
            ),
            'javascript' => 'mod_courseflow/flowmain',
            'otherdata' => $outerflow->json,
            'files' => ''
        );
    }
}
