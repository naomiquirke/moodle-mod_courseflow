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
 * @copyright  2021 Naomi Quirke
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$addons = [
    "mod_courseflow" => [ // Plugin identifier.
        "handlers" => [ // Different places where the add-on will display content.
            'courseflow' => [ // Handler unique name (can be anything).
                'delegate' => 'CoreCourseModuleDelegate', // Delegate (where to display the link to the add-on).
                /*  Init is a function to call to retrieve the initialization JS and the "restrict" to apply to the whole handler.
                    It can also return templates that can be used from the Javascript of the init method
                    or the Javascript of the handler’s method. */
                // Possibly need to use this, but maybe can just use the mobile_courseflow_view js. 'init' => 'mobile_courseflow',
                'styles' => [ // Can contain url and version.
//                    'url' => '/mod/courseflow/mobile/mobilestyles.css',
                    'version' => 1,
                ],
                'displaydata' => array(
                    'title' => 'pluginname',
                    'icon' => $CFG->wwwroot . '/mod/courseflow/pix/icon.svg',
                    'class' => 'path-mod-courseflow',
                ),
                // Main function in \mod_courseflow\classes\output\mobile: 'method' => '', If not set, then won't be clickable.
                'offlinefunctions' => array(
                    /* List of functions to call when prefetching the module.
                    It can be a get_content method or a WS.
                    You can filter the params received by the WS.
                    By default, WS will receive these params: courseid, cmid, userid.
                    Other valid values that will be added if they are present in the list of params.
                    These are: courseids (it will receive a list with the courses the user is enrolled in),
                    component + 'id' (e.g. certificateid).
                    */
                    'mobile_courseflow_view' => [],
                ),
                'updatesnames' => '', // Regular Expression checking module update, comparing to core_course_check_updates result.
                'displayrefresh' => true, // Show default refresh button.
                'displayopeninbrowser' => true, // Display the "Open in browser" option in the top-right menu.
                'isresource' => true, // Courseflow is a resource, depends on contents.
                'coursepagemethod' => 'mobile_courseflow_view',
            ]
        ],
        'lang' => [
            array('pluginname', 'courseflow'),
        ]
    ]
];
