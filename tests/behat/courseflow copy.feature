@mod @mod_courseflowcopy
Feature: Students can access a courseflow step when available but not when it is not
  In order for students to appropriately access a normal courseflow step
  As a teacher
  I need to create a courseflow from existing activities that have completion enabled.
  As a student
  I need to be able to click on the first courseflow step, and do the activity.
  I must not be able to click on the second courseflow step until the first step is completed.

  Scenario: Create courseflow activity.
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
    And the following "groups" exist:
      | name    | course | idnumber |
      | Group 1 | C1     | G1       |
      | Group 2 | C1     | G2       |
    And the following "group members" exist:
      | user     | group |
      | student1 | G1    |
      | teacher1 | G1    |
    And the following "groupings" exist:
      | name       | course | idnumber |
      | Grouping 1 | C1     | GG1      |
      | Grouping 2 | C1     | GG2      |
      | Grouping 3 | C1     | GG3      |
    And the following "grouping groups" exist:
      | grouping | group |
      | GG1      | G1    |
      | GG2      | G2    |
      | GG3      | G1    |
      | GG3      | G2    |
    And I log in as "teacher1"
    And I am on "Course 1" course homepage with editing mode on
    And the following "activities" exist:
      | activity | course | idnumber | name     | intro                | completion |
      | assign   | C1     | assign1  | Assign 1 | Assign 1 description | 1          |
    And the following "activities" exist:
      | activity | course | idnumber | name   | intro              | completion |
      | quiz     | C1     | quiz1    | Quiz 1 | Quiz 1 description | 2          |
      | quiz     | C1     | quiz2    | Quiz 2 | Quiz 2 description | 0          |
    And the following "activities" exist:
      | activity | name               | intro            | course | idnumber | groupmode | grouping | completion |
      | forum    | No group forum     | Test0 forum name | C1     | forum0   | 0         |          | 2          |
      | forum    | Groupings G1 forum | Test1 forum name | C1     | forum1   | 1         | GG1      | 1          |
      | forum    | Groupings G2 forum | Test2 forum name | C1     | forum2   | 1         | GG2      | 1          |
      | forum    | Groupings G3 forum | Test3 forum name | C1     | forum3   | 1         | GG3      | 1          |
    And I add a "courseflow" to section "1" and I fill the form with:
      | Name for this courseflow report | courseflow test |
      | Grouping                        | Grouping 1      |
    When I follow "courseflow test"
    Then I should see "Courseflow activity setup"
