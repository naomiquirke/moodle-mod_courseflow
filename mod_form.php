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
 * courseflow module settings page
 *
 * @package   mod_courseflow
 * @copyright 2020 Naomi Quirke
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die;
require_once($CFG->dirroot.'/course/moodleform_mod.php');
require_once($CFG->dirroot.'/mod/courseflow/lib.php');

/**
 * Class for courseflow module settings form
 *
 * @package   mod_courseflow
 * @copyright 2020 Naomi Quirke
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class mod_courseflow_mod_form extends moodleform_mod {
    /**
     * Define the form
     *
     * @return void
     */
    public function definition() {
        $mform =& $this->_form;

        $mform->addElement('text', 'name', get_string('courseflowname', 'courseflow'), array('size' => '64'));
        $mform->setType('name', PARAM_TEXT);
        $mform->addRule('name', null, 'required', null, 'client');
        $mform->addRule('name', get_string('maximumchars', '', 255), 'maxlength', 255, 'client');
        $mform->addElement('static', 'note', get_string('noteoncompletion', 'courseflow'));
        $this->standard_intro_elements();
        $this->standard_coursemodule_elements();
        $this->add_action_buttons(true, get_string('chooseactivities', 'courseflow'), get_string('return', 'courseflow'));
    }
    /**
     * Freeze elements that we don't want touched before the form is used.
     *
     * @return void
     */
    public function definition_after_data() {
        parent::definition_after_data();
        $mform = $this->_form;

        // Note never need completion on for this, as not an activity in normal sense.
        $mform->getElement('completion')->_values[0] = "0";
        $mform->freeze('completion');
    }
}
