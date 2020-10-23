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
require_once($CFG->dirroot.'/lib/modinfolib.php');

/**
 * Allows user to set activities as not visible on course page.
 *
 * @package   mod_courseflow
 * @copyright 2020 Naomi Quirke
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

class mod_courseflow_setnotvisible extends moodleform {

    /**
     * Define the form for setting activities visible on course page or not.
     *
     * @return void
     */

    public function definition() {
        global $CFG, $COURSE;

        $mform = $this->_form;
        $activitylist = $this->_customdata;
        $mform->addElement('header', 'visibility', get_string('setvisibilitytitle', 'courseflow'));
        $checkboxes = [];
        foreach ($activitylist as $id => $activity) {
            $checkboxes[$id] = [];
            $checkboxes[$id][] = &$mform->createElement('advcheckbox', 'a_' . $activity['id']
                , get_string('setvisibility', 'courseflow')
                , ""
                , ['group' => 1]);
            $checkboxes[$id][] = &$mform->createElement('static', 's_' . $activity['id'], '',
                $activity['open'] ? get_string('sectionopen', 'courseflow', $activity['sectionnum'])
                : get_string('sectionclosed', 'courseflow', $activity['sectionnum']));
            $checkboxes[$id][] = &$mform->createElement('advcheckbox', 'b_' . $activity['id']
                , get_string('setvisibilitypage', 'courseflow')
                , ""
                , ['group' => 2]);
            $checkboxes[$id][] = &$mform->createElement('static', 'r_' . $activity['id'], '',
                $activity['open'] ? get_string('restrictedoff', 'courseflow') : get_string('restricted', 'courseflow'));
            $mform->setDefault( 'a_' . $activity['id'], $activity['visible']);
            $mform->setDefault( 'b_' . $activity['id'], $activity['visiblepage']);
            $mform->addGroup($checkboxes[$id], $activity['id'], $activity['name'], null, false);
        }
        $this->add_checkbox_controller(1, get_string('setvisibilityall', 'courseflow'), ['style' => 'font-weight: bold;']);
        $this->add_checkbox_controller(2, get_string('setvisibilitypageall', 'courseflow'), ['style' => 'font-weight: bold;']);
        $this->add_action_buttons();
    }
}
