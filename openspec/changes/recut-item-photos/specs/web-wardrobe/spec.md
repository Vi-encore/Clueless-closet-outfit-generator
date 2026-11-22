# Spec Delta

## ADDED Requirements

### Requirement: The background can be cut out again on the card
The client SHALL offer, on the card of one of the person's own items that is not archived, to cut the background out of its original photograph on the device, offering it as cutting out when the item has no cut-out and as cutting out again when it has one. It SHALL trim the result as a new item's, upload it, and set it as the item's cut-out, leaving every other tag as it was, and SHALL say why in a dialog when it fails, leaving the item as it was.

#### Scenario: An item saved without a cut-out gets one
- **GIVEN** an item with a photograph and no cut-out
- **WHEN** the person asks for its background to be cut out
- **THEN** the cut-out is uploaded to the address the API gave for it
- **AND** the item is changed with that key alone
- **AND** the card shows the cut-out

#### Scenario: A cut-out is made again
- **GIVEN** an item with a cut-out
- **WHEN** its card is opened
- **THEN** cutting the background out again is offered

#### Scenario: Not for an archived item
- **GIVEN** an archived item
- **WHEN** its card is opened
- **THEN** cutting the background out is not offered

#### Scenario: A failed cut-out on the card
- **GIVEN** a photograph whose background cannot be cut out
- **WHEN** the person asks for it on the card
- **THEN** a dialog says it failed, with the reason
- **AND** the item is not changed

### Requirement: A photograph can be turned before saving
The client SHALL offer, once a chosen photograph is ready, to turn it a quarter turn clockwise, as many times as the person likes, turning the cut-out with it, and SHALL send both as they were last turned. It SHALL not offer turning while the photograph is still being read or cut out.

#### Scenario: A photograph is turned
- **GIVEN** a chosen photograph with its cut-out ready
- **WHEN** the person turns it once and submits
- **THEN** the original and the cut-out are each sent turned a quarter clockwise

#### Scenario: Not while cutting out
- **GIVEN** a photograph whose background is still being cut out
- **WHEN** the form is shown
- **THEN** turning is not offered

## MODIFIED Requirements

### Requirement: The background is cut out before saving
The client SHALL cut the background out of the chosen photograph on the device, SHALL show the result for the person to keep or decline, SHALL save the item with the original alone when cutting out fails or is declined, SHALL say why when it fails, in the words the failure came with, and SHALL show the cut-out in the wardrobe and on the card wherever an item has one.

#### Scenario: The cut-out is shown for approval
- **GIVEN** a person who has chosen a photograph
- **WHEN** cutting out succeeds
- **THEN** the cut-out is shown
- **AND** the person can choose to keep the original instead

#### Scenario: Both images are kept
- **GIVEN** a person who kept the cut-out
- **WHEN** they submit the form
- **THEN** the original and the cut-out are each sent to the address the API gave for it
- **AND** the item is created with both keys

#### Scenario: Declining keeps the original alone
- **GIVEN** a person who declined the cut-out
- **WHEN** they submit the form
- **THEN** only the original is sent
- **AND** the item is created with no cut-out key

#### Scenario: A failed cut-out does not stop the item
- **GIVEN** a photograph whose background cannot be cut out
- **WHEN** it is chosen
- **THEN** a message says the background was not removed
- **AND** it shows the reason the failure gave
- **AND** the form can still be submitted with the original

#### Scenario: The wardrobe shows the cut-out
- **GIVEN** an item with a photograph and a cut-out
- **WHEN** the wardrobe is opened
- **THEN** the cut-out is the image shown for it

### Requirement: A cut-out is trimmed to the item
The client SHALL crop the transparent margin around the item from a cut-out before encoding it, counting a pixel as the item only when its alpha is above a quarter of opaque, so that the faint haze a model leaves far from an item is cropped with the margin, and SHALL keep a cut-out with no such pixel as it is.

#### Scenario: The margin is cropped
- **GIVEN** a cut-out whose opaque pixels lie in a box inside the image
- **WHEN** it is trimmed
- **THEN** the result is exactly that box

#### Scenario: Nothing opaque
- **GIVEN** a cut-out with no opaque pixel
- **WHEN** it is trimmed
- **THEN** the whole image is kept

#### Scenario: Haze far from the item is cropped
- **GIVEN** a cut-out whose item lies in a box, with faint pixels of low alpha far outside it
- **WHEN** it is trimmed
- **THEN** the result is the item's box alone
