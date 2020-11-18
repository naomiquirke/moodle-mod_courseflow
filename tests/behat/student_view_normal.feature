@mod @mod_courseflow @mod_courseflow_available @javascript
Feature: Students can access courseflow steps when available but not when not
  In order for students to appropriately access a normal courseflow step
  As a teacher
  I need to create a courseflow from existing activities that have completion enabled.
  As a student
  I need to be able to click on the first courseflow step, and do the activity.
  I must not be able to click on the second courseflow step until the first step is completed.

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

    And the following "groups" exist:
      | name    | course | idnumber |
      | Group 1 | C1     | G1       |
      | Group 2 | C1     | G2       |
    And the following "group members" exist:
      | user     | group |
      | student1 | G1    |
    And the following "groupings" exist:
      | name       | course | idnumber |
      | Grouping 1 | C1     | GG1      |
      | Grouping 2 | C1     | GG2      |
    And the following "grouping groups" exist:
      | grouping | group |
      | GG1      | G1    |
      | GG2      | G2    |

    And the following "activities" exist:
      | activity | course | idnumber | name     | intro                | completion | groupmode | grouping | Access restrictions  |
      | assign   | C1     | idnum1   | Assign 1 | Assign 1 description | 2          | 0         | GG2      |                      |
      | quiz     | C1     | idnum2   | Quiz 1   | Quiz 1 description   | 2          | 1         | GG1      | Grouping: Grouping 1 |
    And I log in as "teacher1"
    And I am on "Course 1" course homepage with editing mode on
    And I add a "Choice" to section "1" and I fill the form with:
      | Choice name         | Choice 1           |
      | Description         | Choice Description |
      | option[0]           | Option 1           |
      | option[1]           | Option 2           |
      | Completion tracking | 2                  |
      | Require view        | 1                  |
    And I add a "Forum" to section "1" and I fill the form with:
      | name                | Forum 1              |
      | Description         | Forum 1 description  |
      | groupmode           | Separate groups      |
      | Grouping            | Grouping 2           |
      | Access restrictions | Grouping: Grouping 2 |
      | Completion tracking | 2                    |
      | Require view        | 1                    |

    # Teacher adding the courseflow and seeing appropriate visibility and availability info on courseflow form
    When I am on "Course 1" course homepage with editing mode on
    And I add a "Courseflow" to section "0" and I fill the form with:
      | Courseflow name | Courseflow 1 |
    And I am on "Course 1" course homepage
    And I follow "Courseflow 1"
    And I select "Choice 1" from the "activityselector" singleselect
    And I select "Assign 1" from the "activityselector" singleselect
    And I select "Choice 1" from the "parentselector-Assign 1" singleselect
    And I select "Quiz 1" from the "activityselector" singleselect
    And I select "Assign 1" from the "parentselector-Quiz 1" singleselect
    And I select "Forum 1" from the "activityselector" singleselect
    And I select "Choice 1" from the "parentselector-Forum 1" singleselect
    And I press "Save changes"
    And I log out

    # Student seeing appropriate info before they do any activities.
    And I log in as "student1"
    And I am on "Course 1" course homepage
    Then I should see "Assign 1" in the ".notavailable" "css_element"
    And I should see "Choice 1" in the ".ready" "css_element"

    # Student doing an activity and seeing appropriate info afterwards.
    When I click on "Choice 1" "text" in the "div.cf-container" "css_element"
    And I choose "Option 1" from "Choice 1" choice activity
    And I am on "Course 1" course homepage
    Then I should see "Quiz 1" in the ".notavailable" "css_element"
    And I should see "Assign 1" in the ".ready" "css_element"
    And I should see "Choice 1" in the ".available" "css_element"
    And I should see "Forum 1" in the ".notvisible" "css_element"
