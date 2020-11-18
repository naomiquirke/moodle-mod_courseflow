@mod @mod_courseflow @mod_courseflow_complex @javascript
Feature: Teachers can build complex courseflows.
  In order for complex courseflows to be seen,
  As a teacher
  I need to be able to create a courseflow with parent steps having more than six child steps,
  I need to create two such parent steps in a row,
  I need to connect a child to a foldback parent,
  I need to create long flow chains.

  Scenario: Courseflow may be created with complex courseflows.
    Given the following "courses" exist:
      | fullname | shortname | summary                             | category | enablecompletion |
      | Course 1 | C1        | Prove the courseflow activity works | 0        | 1                |
    And the following "users" exist:
      | username | firstname | lastname | email                |
      | teacher1 | Teacher   | T1       | teacher1@example.com |
    And the following "course enrolments" exist:
      | course | user     | role           |
      | C1     | teacher1 | editingteacher |

    And the following "activities" exist:
      | activity | course | idnumber | name    | intro               | completion |
      | quiz     | C1     | idnum1   | Quiz 1  | Quiz 1 description  | 2          |
      | quiz     | C1     | idnum2   | Quiz 2  | Quiz 2 description  | 2          |
      | quiz     | C1     | idnum3   | Quiz 3  | Quiz 3 description  | 2          |
      | quiz     | C1     | idnum4   | Quiz 4  | Quiz 4 description  | 2          |
      | quiz     | C1     | idnum5   | Quiz 5  | Quiz 5 description  | 2          |
      | quiz     | C1     | idnum6   | Quiz 6  | Quiz 6 description  | 2          |
      | quiz     | C1     | idnum7   | Quiz 7  | Quiz 7 description  | 2          |
      | quiz     | C1     | idnum8   | Quiz 8  | Quiz 8 description  | 2          |
      | forum    | C1     | idnu01   | Forum 1 | Forum 1 description | 2          |
      | forum    | C1     | idnu02   | Forum 2 | Forum 2 description | 2          |
      | forum    | C1     | idnu03   | Forum 3 | Forum 3 description | 2          |
      | forum    | C1     | idnu04   | Forum 4 | Forum 4 description | 2          |
      | forum    | C1     | idnu05   | Forum 5 | Forum 5 description | 2          |
      | forum    | C1     | idnu06   | Forum 6 | Forum 6 description | 2          |
      | forum    | C1     | idnu07   | Forum 7 | Forum 7 description | 2          |
      | forum    | C1     | idnu08   | Forum 8 | Forum 8 description | 2          |
      | forum    | C1     | idnu09   | Forum 9 | Forum 9 description | 2          |
      | forum    | C1     | idnu10   | Forum 0 | Forum 0 description | 2          |
      | quiz     | C1     | idnu11   | Quip 10 | Quiz 10 description | 2          |
      | quiz     | C1     | idnu12   | Quip 20 | Quiz 20 description | 2          |
      | quiz     | C1     | idnu13   | Quip 30 | Quiz 30 description | 2          |
      | quiz     | C1     | idnu14   | Quip 40 | Quiz 40 description | 2          |
      | quiz     | C1     | idnu15   | Quip 50 | Quiz 50 description | 2          |
      | quiz     | C1     | idnu16   | Quip 60 | Quiz 60 description | 2          |
      | quiz     | C1     | idnu17   | Quip 70 | Quiz 70 description | 2          |
      | quiz     | C1     | idnu18   | Quip 80 | Quiz 80 description | 2          |

    And I log in as "teacher1"
    And I am on "Course 1" course homepage with editing mode on
    And I add a "Courseflow" to section "1" and I fill the form with:
      | Courseflow name | Courseflow 1 |
    And I am on "Course 1" course homepage
    And I follow "Courseflow 1"
    And I select "Quiz 1" from the "activityselector" singleselect
    And I select "Quiz 2" from the "activityselector" singleselect
    And I select "Quiz 3" from the "activityselector" singleselect
    And I select "Quiz 4" from the "activityselector" singleselect
    And I select "Quiz 5" from the "activityselector" singleselect
    And I select "Quiz 6" from the "activityselector" singleselect
    And I select "Quiz 7" from the "activityselector" singleselect
    And I select "Quiz 8" from the "activityselector" singleselect
    And I select "Quiz 1" from the "parentselector-Quiz 2" singleselect
    And I select "Quiz 1" from the "parentselector-Quiz 3" singleselect
    And I select "Quiz 1" from the "parentselector-Quiz 4" singleselect
    And I select "Quiz 1" from the "parentselector-Quiz 5" singleselect
    And I select "Quiz 1" from the "parentselector-Quiz 6" singleselect
    And I select "Quiz 1" from the "parentselector-Quiz 7" singleselect
    And I select "Quiz 1" from the "parentselector-Quiz 8" singleselect

    And I select "Forum 1" from the "activityselector" singleselect
    And I select "Forum 2" from the "activityselector" singleselect
    And I select "Forum 3" from the "activityselector" singleselect
    And I select "Forum 4" from the "activityselector" singleselect
    And I select "Forum 5" from the "activityselector" singleselect
    And I select "Forum 6" from the "activityselector" singleselect
    And I select "Forum 7" from the "activityselector" singleselect
    And I select "Forum 8" from the "activityselector" singleselect
    And I select "Forum 9" from the "activityselector" singleselect
    And I select "Forum 0" from the "activityselector" singleselect
    And I select "Quiz 3" from the "parentselector-Forum 1" singleselect
    And I select "Quiz 3" from the "parentselector-Forum 2" singleselect
    And I select "Quiz 3" from the "parentselector-Forum 3" singleselect
    And I select "Quiz 3" from the "parentselector-Forum 4" singleselect
    And I select "Quiz 3" from the "parentselector-Forum 5" singleselect
    And I select "Quiz 3" from the "parentselector-Forum 6" singleselect
    And I select "Quiz 4" from the "parentselector-Forum 7" singleselect
    And I select "Quiz 2" from the "parentselector-Forum 8" singleselect
    And I select "Quiz 8" from the "parentselector-Forum 9" singleselect
    And I select "Quiz 8" from the "parentselector-Forum 0" singleselect

    And I select "Quip 10" from the "activityselector" singleselect
    And I select "Quip 20" from the "activityselector" singleselect
    And I select "Quip 30" from the "activityselector" singleselect
    And I select "Quip 40" from the "activityselector" singleselect
    And I select "Quip 50" from the "activityselector" singleselect
    And I select "Quip 60" from the "activityselector" singleselect
    And I select "Quip 70" from the "activityselector" singleselect
    And I select "Quip 80" from the "activityselector" singleselect
    And I select "Forum 8" from the "parentselector-Quip 10" singleselect
    And I select "Quip 10" from the "parentselector-Quip 20" singleselect
    And I select "Quip 20" from the "parentselector-Quip 30" singleselect
    And I select "Quip 30" from the "parentselector-Quip 40" singleselect
    And I select "Quip 40" from the "parentselector-Quip 50" singleselect
    And I select "Quip 50" from the "parentselector-Quip 60" singleselect
    And I select "Quip 60" from the "parentselector-Quip 70" singleselect
    And I select "Quip 70" from the "parentselector-Quip 80" singleselect

    And I press "Save changes"
    And I am on "Course 1" course homepage

    Then I should see "Quiz 1" in the "div.cf-container" "css_element"
    And I should see "Quiz 2" in the "div.cf-container" "css_element"
    And I should see "Quiz 8" in the "div.cf-container" "css_element"
    And I should see "Forum 7" in the "div.cf-container" "css_element"
    And I should see "Forum 9" in the "div.cf-container" "css_element"
    And I should see "Forum 0" in the "div.cf-container" "css_element"
    And I should see "Quip 70" in the "div.cf-container" "css_element"
    And I should see "2" occurrences of "Quiz 3" in the "div.cf-container" "css_element"
