@mod @mod_courseflow @mod_courseflow_teacher @javascript
Feature: Teachers can use courseflow settings to prevent or allow student access to courseflow steps.
  In order for students to appropriately access a normal courseflow step
  As a teacher
  I need to set visibility with existing activities.
  As a student
  I need to be able to appropriately access steps.

  Scenario: Courseflow may be created with different status steps that students can appropriately access.
    Given the following "courses" exist:
      | fullname | shortname | summary                             | category | enablecompletion |
      | Course 1 | C1        | Prove the courseflow activity works | 0        | 1                |
    And the following "users" exist:
      | username | firstname | lastname | email                |
      | teacher1 | Teacher   | T1       | teacher1@example.com |
      | student1 | Sam       | S1       | student1@example.com |
    And the following "course enrolments" exist:
      | course | user     | role           |
      | C1     | teacher1 | editingteacher |
      | C1     | student1 | student        |

    And the following "activities" exist:
      | activity | course | idnumber | name    | intro               | completion |
      | forum    | C1     | idnum3   | Forum 1 | Forum 1 description | 2          |
    And I log in as "admin"
    And I set the following administration settings values:
      | allowstealth | 1 |
    And I log out
    And I log in as "teacher1"
    And I am on "Course 1" course homepage with editing mode on
    And I add a "Courseflow" to section "1" and I fill the form with:
      | Courseflow name | Courseflow 1 |
    And I am on "Course 1" course homepage
    And I follow "Courseflow 1"
    And I select "Forum 1" from the "activityselector" singleselect
    And I click on "chk-acc-Forum 1" "checkbox"
    And I press "Save changes"
    And I log out

    When I log in as "student1"
    And I am on "Course 1" course homepage
    Then I should see "Forum 1" in the ".notvisible" "css_element"

