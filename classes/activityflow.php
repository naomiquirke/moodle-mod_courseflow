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

defined('MOODLE_INTERNAL') || die;
require_once("$CFG->libdir/formslib.php");
require_once($CFG->dirroot.'/mod/courseflow/lib.php');
require_once($CFG->dirroot.'/lib/modinfolib.php');
require_once($CFG->dirroot.'/lib/moodlelib.php');
/**
 * Creates and manages the generation and storage of activities in the courseflow.
 *
 * @package   mod_courseflow
 * @copyright 2020 Naomi Quirke
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

class mod_courseflow_activityflow extends moodleform {

    /** List of activities and their flow information if activity is included in the flow. */
    public $activityinfo;
    public $errormessage;
    /**
     * Define the form for getting the activities and their order.
     *
     * @return void
     */

    public function definition() {
        global $CFG;

        $mform = $this->_form;
        $activitylist = $this->getcminfo();

        $mform->addElement('header', 'conditionsheader', get_string('courseflowsetup', 'courseflow'));

        $mform->addElement('textarea', 'flow', get_string('courseflowconditions', 'courseflow'));
        $mform->setType('flow', PARAM_TEXT);

        $activitygroup = [];
        $activitygroup[] = &$mform->createElement('select', 'activityselector', '', $activitylist);
        $activitygroup[] = &$mform->createElement('select', 'parentselector', '',
            ["0" => get_string('selectparent', 'courseflow')]);
        $mform->addGroup($activitygroup, 'activitygroup', get_string('courseflowsetup', 'courseflow'), ' ', false);

        $this->add_action_buttons();
    }

    /**
     * Create mods info array
     *
     * @return array cms filtered by tracking completion
     */
    public function getcminfo() {
        $course = $this->_customdata['thisflow']->course;
        $stored = $this->_customdata['thisflow']->flow;
        $cms = array_filter(get_fast_modinfo($course)->get_cms(), 'self::completeable');
        $flowsteps = json_decode($stored, true); // True option converts to associative array.
        $adminconfig = get_config('mod_courseflow');
        $activitylist = ["0" => get_string('selectactivity', 'courseflow')];
        $cminfo = [];
        foreach ($cms as $cm) {
            if (!is_null($flowsteps) && array_key_exists("$cm->id", $flowsteps)) {
                // Then it already exists in flow.
                $thisparent = $flowsteps["$cm->id"]["parentid"];
                $cminfo[$cm->id] = $flowsteps["$cm->id"];
                $cminfo[$cm->id]["name"] = $cm->name; // In case it has changed name.
                if (!isset($cms[$thisparent])) {
                    // Parent has been deleted. Set to no parent.
                    $cminfo[$cm->id]["parentid"] = 0;
                }
                $activitylist[$cm->id] = $cm->name;
            } else {
                $activitylist[$cm->id] = $cm->name;
                $cminfo[$cm->id] = ['id' => $cm->id, 'name' => $cm->name,
                    'link' => $cm->url->out(),
                    'parentid' => '0',
                    'preferred' => 0,
                    'colournotavail' => $adminconfig->notavail_colour,
                    'colouravail' => $adminconfig->avail_colour];
            }
        }
        $errormessage = count($cminfo) == 0 ? get_string('alertnocompletion', 'courseflow') : null;
        $this->activityinfo = json_encode([$cminfo, $errormessage]);
        return $activitylist;
    }
    /**
     * Filter function for mods info array
     *
     * @return boolean
     */
    public static function completeable($cminfo) {

        return ($cminfo->completion >= COMPLETION_TRACKING_MANUAL)
            && ($cminfo->deletioninprogress == false);
    }
}
