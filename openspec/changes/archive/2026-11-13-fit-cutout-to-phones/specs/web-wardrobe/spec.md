# Spec Delta

## ADDED Requirements

### Requirement: The cut-out model follows the device
The client SHALL cut out the background with the smaller model on a device whose pointer is coarse, such as a phone, and with the larger one elsewhere, because a phone's tab runs out of memory on the larger one.

#### Scenario: A phone uses the smaller model
- **WHEN** the model is chosen on a device with a coarse pointer
- **THEN** it is `isnet_quint8`

#### Scenario: A computer uses the larger model
- **WHEN** the model is chosen on a device with a fine pointer
- **THEN** it is `isnet_fp16`

### Requirement: A device that could not cut out stops trying
The client SHALL remember, in the browser's own storage, that a cut-out started and did not end. When a photograph is next chosen, it SHALL take that as a sign that this browser cannot cut out: it SHALL save new items with the original alone, SHALL say so, and SHALL offer to try again, which forgets the decision. When the browser's storage cannot be used, the client SHALL remember nothing and SHALL try as usual.

#### Scenario: A cut-out that never ended is not tried again
- **GIVEN** a cut-out that started in this browser and never ended
- **WHEN** a person chooses a photograph for a new item
- **THEN** the background is not cut out
- **AND** the original is shown with a line saying this device does not cut backgrounds out

#### Scenario: Trying again forgets the decision
- **GIVEN** a browser that stopped cutting out
- **WHEN** the person presses "try again" and chooses a photograph
- **THEN** the background is cut out

#### Scenario: A cut-out that ends leaves nothing behind
- **GIVEN** a cut-out that succeeds, or one that fails without the tab dying
- **WHEN** the next photograph is chosen
- **THEN** the background is cut out again as usual

#### Scenario: No storage, no memory
- **GIVEN** a browser whose storage refuses to be used
- **WHEN** a person chooses a photograph
- **THEN** the background is cut out as usual
