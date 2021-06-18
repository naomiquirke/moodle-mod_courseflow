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
 * Backup courseflow module
 *
 * @package   mod_courseflow
 * @copyright 2020 Naomi Quirke
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/mod/courseflow/backup/moodle2/backup_courseflow_stepslib.php'); // Because it exists (must).

/**
 * Backup courseflow module class
 *
 * @package   mod_courseflow
 * @copyright 2020 Naomi Quirke
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class backup_courseflow_activity_task extends backup_activity_task {

    /**
     * Define class settings
     *
     */
    protected function define_my_settings() {
    }

    /**
     * Defines a backup step to store the instance data in the courseflow.xml file
     */
    protected function define_my_steps() {
        $this->add_step(new backup_courseflow_activity_structure_step('courseflow_structure', 'courseflow.xml'));
    }

    /**
     * Encode content links
     *
     * @param string $content some HTML text that eventually contains URLs to the activity instance scripts
     * @return string the content with the URLs encoded
     */
    public static function encode_content_links($content) {
        global $CFG;

        $base = preg_quote($CFG->wwwroot, "/");

        // Link to courseflow view by moduleid.
        $search = "/(".$base."\/mod\/courseflow\/view.php\?id\=)([0-9]+)/";
        $content = preg_replace($search, '$@COURSEFLOWVIEWBYID*$2@$', $content);

        return $content;
    }
}
