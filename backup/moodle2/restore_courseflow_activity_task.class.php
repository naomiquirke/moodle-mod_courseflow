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
 * Resource restore task that provides all the settings and steps.
 *
 * @package    mod_courseflow
 * @copyright 2020 Naomi Quirke
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();
require_once($CFG->dirroot . '/mod/courseflow/backup/moodle2/restore_courseflow_stepslib.php'); // Because it exists (must).

/**
 * Class that provides all the settings and steps to perform one complete restore of the activity.
 *
 * @package    mod_courseflow
 * @copyright 2020 Naomi Quirke
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class restore_courseflow_activity_task extends restore_activity_task {

    /**
     * Define (add) particular settings this activity can have
     */
    protected function define_my_settings() {
        // No particular settings for this activity.
    }

    /**
     * Define (add) particular steps this activity can have
     */
    protected function define_my_steps() {
        // Courseflow only has one structure step.
        $this->add_step(new restore_courseflow_activity_structure_step('courseflow_structure', 'courseflow.xml'));
    }

    /**
     * Define the contents in the activity that must be
     * processed by the link decoder
     */
    public static function define_decode_contents() {
        $contents = [];
        // While there are links created, they are refreshed each view.
        return $contents;
    }

    /**
     * Define the decoding rules for links belonging
     * to the activity to be executed by the link decoder
     */
    public static function define_decode_rules() {
        $rules = array();

        $rules[] = new restore_decode_rule('COURSEFLOWVIEWBYID', '/mod/courseflow/view.php?id=$1', 'course_module');

        return $rules;

    }

    /**
     * Define the restore log rules that will be applied
     *
     */
    public static function define_courseflow_log_rules() {
        $rules = array();

        $rules[] = new restore_log_rule('courseflow', 'add', 'view.php?id={course_module}', '{courseflow}');
        $rules[] = new restore_log_rule('courseflow', 'update', 'view.php?id={course_module}', '{courseflow}');

        return $rules;
    }

    /**
     * Define the restore log rules for course that will be applied
     *
     */
    public static function define_restore_log_rules_for_course() {
        $rules = array();

        $rules[] = new restore_log_rule('courseflow', 'view all', 'index.php?id={course}', null);

        return $rules;
    }

    /**
     * The module has a 'coursemoduleid', and the flow has zero or more 'parentid' that we need to update.
     * After the module is restored, we do the cmid mapping fix.
     */
    public function after_restore() {
        global $DB;
        $id = $this->get_activityid();
        $course = $this->get_courseid();
        $courseflow = $DB->get_record('courseflow', array('id' => $id));
        if (empty($courseflow->flow)) {
            return false;
        } else {
            $flowsteps = json_decode($courseflow->flow, true); // True option converts to associative array.
            $translation = [];
            foreach ($flowsteps as $cmids) {
                $rec = \restore_dbops::get_backup_ids_record($restoreid, 'course_module', $cmids->id);
                if (!$rec || !$rec->newitemid) {
                    // If we are on the same course (e.g. duplicate) then we can just
                    // use the existing one.
                    if ($DB->record_exists('course_modules',
                            ['id' => $cmid, 'course' => $courseid])) {
                        $translation[$cmids->id] = $res;
                    }
                    // Otherwise should warn. TODO.
                    $translation[$cmids->id] = 0;
                } else {
                    $translation[$cmids->id] = (int)$rec->newitemid;
                }
            }
            foreach ($flowsteps as &$step) {
                $step->id = $translation[$step->id];
                $step->parentid = $translation[$step->parentid];
            }
            $courseflow->flow = json_encode($flowsteps);
            $DB->update_record('courseflow', $courseflow);
        }
    }
    /**
     * Repetition for cmid update.
     *
     * @param string $cmid one or more 'parentid'.
     */
    public function cmidupdate($cmid) {
        $rec = \restore_dbops::get_backup_ids_record($restoreid, 'course_module', $cmid);
        if (!$rec || !$rec->newitemid) {
            // If we are on the same course (e.g. duplicate) then we can just
            // use the existing one.
            if ($DB->record_exists('course_modules',
                    ['id' => $cmid, 'course' => $courseid])) {
                return $res;
            }
            // Otherwise should warn. TODO.
            return 0;
        } else {
            return (int)$rec->newitemid;
        }
    }
}
