Feature: Accept a badge and push it to your backpack from OpenBadger
  Badge issuers should be able to email a badge earner that they have earned a badge, and direct them to a page on OpenBadger that allows the badge earner to accept the badge and push it to their backpack.

  Scenario: Earned a badge and have an url to claim it
    Given I have a badge claim url
    When I visit the url
    Then I should be asked if I want to claim the badge

  Scenario: Earned a badge, have a claim code
    Given I have a badge claim code
    When I visit the Open Badger claim code page
    Then I should be asked to input my claim code

  Scenario: Entered claim code
    Given I have earned a badge
    When I have entered my claim code
    Then I should see an image of the badge I can claim

  Scenario: Accepted the badge push it to your backpack
    Given I have earned a badge
    When I have accepted it
    Then I should be asked if I want to send the badge to my backpack
