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
 * Renderer for courseflow report.
 *
 * @package    mod_courseflow
 * @copyright  2020 Naomi Quirke
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Class renderer for courseflow display.
 *
 * @package    mod_courseflow
 * @copyright  2020 Naomi Quirke
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class mod_courseflow_renderer extends plugin_renderer_base {

    /**
     * Adds header.
     *
     */
    public function render_form_header() {
        echo $this->output->header();
    }

    /**
     * Adds footer.
     *
     */
    public function render_form_footer() {
        echo $this->output->footer();
    }

    /**
     * Applies courseflow.mustache.
     *
     * @param stdClass $data
     */
    public function render_courseflow($data) {
        if ($data) {
            return $this->output->render_from_template('mod_courseflow/courseflow', $data);
        }
    }

}
