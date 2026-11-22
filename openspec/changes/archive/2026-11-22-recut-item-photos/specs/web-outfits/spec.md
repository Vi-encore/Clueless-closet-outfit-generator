# Spec Delta

## ADDED Requirements

### Requirement: The mannequin can be hidden
The client SHALL offer, under the doll, a checkbox that is ticked by default and, when unticked, stops drawing the mannequin while leaving every item where it was on its backdrop. It SHALL remember the choice on the device and apply it to every doll it draws, the diary's included.

#### Scenario: Hiding the mannequin
- **GIVEN** a doll wearing a top
- **WHEN** the person unticks the mannequin checkbox
- **THEN** the mannequin is not drawn
- **AND** the top is still where it was

#### Scenario: The choice is remembered
- **GIVEN** a person who hid the mannequin
- **WHEN** another doll is drawn on the same device
- **THEN** it is drawn without the mannequin
