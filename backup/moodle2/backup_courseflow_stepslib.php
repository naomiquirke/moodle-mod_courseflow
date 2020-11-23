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
 * Classes that represent the backup steps added in define_my_steps within backup_courseflow_activity_task
 *
 * @package   mod_courseflow
 * @copyright 2020 Naomi Quirke
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
defined('MOODLE_INTERNAL') || die();

/**
 * Class that represents the backup steps added in define_my_steps within backup_courseflow_activity_task
 *
 * @package   mod_courseflow
 * @copyright 2020 Naomi Quirke
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class backup_courseflow_activity_structure_step extends backup_activity_structure_step {

    /**
     * Definition of structure
     *
     */
    protected function define_structure() {

        // To know if we are including userinfo.
        // TODO  $userinfo = $this->get_setting_value('userinfo'); At present we ignore this because
        // I haven't decided whether we should keep all this information or not.
        // At present when we restore, if it userinfo is turned on then it keeps the approval turned on, otherwise it turns it off.

        // Define each element separated.
        $courseflow = new backup_nested_element('courseflow', ['id'], [ // Core information that can form courseflow.
            'name', 'timemodified', 'completion', 'flow']);

        // Build the tree.

        // Define sources.
        $courseflow ->set_source_table('courseflow', array('id' => backup::VAR_ACTIVITYID));

        // Define id annotations.

        // Define file annotations.

        // Return the root element (resource), wrapped into standard activity structure.
        return  $this->prepare_activity_structure($courseflow);
    }
}
