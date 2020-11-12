@mod @mod_courseflowcopy
Feature: Students can see and access courseflow steps depending on their grouping and their activity completion status
  In order for students to see and access courseflow steps appropriately
  As a teacher
  I need to setup a courseflow correctly for each grouping
  As a student
  I need to complete activities in the courseflow

  Background: courseflow Exists.
    Given the following "courses" exist:
      | fullname | shortname | summary                        | category |
      | Course 1 | C1        | Course with working courseflow | 0        |
    And the following "users" exist:
      | username | firstname | lastname | email                |
      | teacher1 | teacher   | M1       | teacher1@example.com |
      | student1 | Sam       | S1       | student1@example.com |
    And the following "course enrolments" exist:
      | course | user     | role           |
      | C1     | teacher1 | editingteacher |
      | C1     | student1 | student        |
    And the following "activities" exist:
      | activity | course | idnumber | name     | intro                |
      | assign   | C1     | assign1  | Assign 1 | Assign 1 description |
    And I log in as "teacher1"
    And I am on "Course 1" course homepage with editing mode on
    And I add a "courseflow report" to section "1" and I fill the form with:
      | Name for this courseflow report | Courseflow test |
      | Grouping                        | None            |
    And I log out

  Scenario: See as as a student
    When I log in as "student1"
    And I am on "Course 1" course homepage
    Then I should see "Courseflow test"
