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
 * Mobile courseflow view
 *
 * @package    mod_courseflow
 * @copyright  2020 Naomi Quirke
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$addons = array(
    "mod_courseflow" => array(
        "handlers" => array( // Different places where the add-on will display content.
            'courseflow' => array( // Handler unique name (can be anything).
                'delegate' => 'CoreCourseModuleDelegate', // Delegate (where to display the link to the add-on).
                /*  Init is a function to call to retrieve the initialization JS and the "restrict" to apply to the whole handler.
                    It can also return templates that can be used from the Javascript of the init method
                    or the Javascript of the handler’s method. */
                'init' => 'mobile_courseflow',
                'styles' => [ // Can contain url and version.
                ],
                'displaydata' => array(
                    'title' => 'pluginname',
                    'icon' => $CFG->wwwroot . '/mod/courseflow/pix/icon.svg',
                    'class' => '',
                ),
                'method' => '', // Main function in \mod_courseflow\classes\output\mobile. If not set, then won't be clickable.
                'offlinefunctions' => array(
                    'mobile_courseflow_view' => array(),
                ), // Function needs caching for offline.
                'updatesnames' => '', // Regular Expression checking module update, comparing to core_course_check_updates result.
                'displayrefresh' => true, // Show default refresh button.
                'displayopeninbrowser' => true, // Display the "Open in browser" option in the top-right menu.
                'isresource' => true, // Courseflow is a resource.
                'coursepagemethod' => 'mobile_courseflow_view',
            )
        ),
        'lang' => array(
            array('pluginname', 'courseflow'),
        )
    )
);
