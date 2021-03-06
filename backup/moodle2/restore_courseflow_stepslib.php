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
 * Define all the restore steps that will be used by the restore_courseflow_activity_task
 *
 * @package    mod_courseflow
 * @copyright 2020 Naomi Quirke
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
defined('MOODLE_INTERNAL') || die();

/**
 * Structure step class to restore courseflow
 *
 * @package    mod_courseflow
 * @copyright 2020 Naomi Quirke
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class restore_courseflow_activity_structure_step extends restore_activity_structure_step {

    /**
     * Define structure step to restore courseflow
     */
    protected function define_structure() {
        $paths = [];
        $paths[] = new restore_path_element('courseflow', '/activity/courseflow');

        // Return the paths wrapped into standard activity structure.
        return $this->prepare_activity_structure($paths);
    }

    /**
     * Define structure step to restore courseflow
     *
     * @param object $data describing courseflow to be restored
     */
    protected function process_courseflow($data) {
        global $DB;
        global $USER;

        $data = (object)$data;
        $data->course = $this->get_courseid();

        $data->timemodified = $this->apply_date_offset($data->timemodified);

        // Insert the resource record.
        $newitemid = $DB->insert_record('courseflow', $data);
        // Immediately after inserting "activity" record, call this.
        $this->apply_activity_instance($newitemid);
    }

    /**
     * Define after_execute
     */
    protected function after_execute() {
        // Add related files, no need to match by itemname (just internally handled context).
    }
}
