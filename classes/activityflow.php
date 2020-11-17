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
        $activitylist = $this->_customdata['activitylist'];

        $mform->addElement('header', 'conditionsheader', get_string('courseflowconditions', 'courseflow'));
        $mform->setType('conditionsheader', PARAM_TEXT);
        $mform->addElement('hidden', 'allowstealth', $this->_customdata['allowstealth']);
        $mform->setType('allowstealth', PARAM_INT);
        $mform->addElement('hidden', 'activityinfo', $this->_customdata['activityinfo']);
        $mform->setType('activityinfo', PARAM_RAW);
        $mform->addElement('textarea', 'flow', '');
        $mform->setType('flow', PARAM_TEXT);

        $activitygroup = [];
        $activitygroup[] = &$mform->createElement('select', 'activityselector', '', $activitylist);
        $activitygroup[] = &$mform->createElement('select', 'parentselector', '',
            ["0" => get_string('selectparent', 'courseflow')]);
        $mform->addGroup($activitygroup, 'activitygroup', '', ' ', false);

        $this->add_action_buttons();
    }
}
