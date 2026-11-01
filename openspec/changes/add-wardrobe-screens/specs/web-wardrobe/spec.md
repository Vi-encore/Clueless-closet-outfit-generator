# Spec Delta

## ADDED Requirements

### Requirement: The wardrobe shows your things
The client SHALL show the signed-in person's items with their photographs and names, SHALL say so when there are none, and SHALL be reachable from the desktop.

#### Scenario: The desktop opens the wardrobe
- **GIVEN** a person who has signed in
- **WHEN** they use the wardrobe shortcut on the desktop
- **THEN** the wardrobe is shown

#### Scenario: Items are shown with their photographs
- **GIVEN** a person with an item that has a photo
- **WHEN** they open the wardrobe
- **THEN** the item's name and photograph are shown

#### Scenario: An item without a photo is still shown
- **GIVEN** a person with an item that has no photo and no name
- **WHEN** they open the wardrobe
- **THEN** the item is shown by the label of its type

#### Scenario: An empty wardrobe says so
- **GIVEN** a person with no items
- **WHEN** they open the wardrobe
- **THEN** a message is shown instead of a list

### Requirement: The wardrobe is read a page at a time
The client SHALL show one page of items and SHALL offer the next one only while there is a next one.

#### Scenario: More can be asked for
- **GIVEN** a wardrobe longer than a page
- **WHEN** the person asks for more
- **THEN** the next page is added after the first

#### Scenario: The end offers nothing
- **GIVEN** a wardrobe that fits on one page
- **WHEN** it is shown
- **THEN** nothing offers more

### Requirement: The wardrobe can be narrowed by slot
The client SHALL narrow the list to one slot on request, SHALL keep that choice in the URL so that it survives a reload and the back button, and SHALL ignore an answer that arrives after the person has moved on.

#### Scenario: A slot narrows the list
- **GIVEN** a person with shoes and a top
- **WHEN** they choose shoes
- **THEN** only the shoes are shown

#### Scenario: The choice survives in the URL
- **WHEN** the wardrobe is opened at an address naming a slot
- **THEN** that slot is what the API is asked for

#### Scenario: A late answer changes nothing
- **GIVEN** a person who chose one slot and then another
- **WHEN** the answer for the first arrives after the answer for the second
- **THEN** the second is what is shown

### Requirement: An item can be added with a photograph
The client SHALL add an item from a slot, a type belonging to that slot, an optional name and a photograph, SHALL refuse the form without a photograph, SHALL upload the photograph straight to storage before creating the item, and SHALL create nothing if the upload fails.

#### Scenario: The types follow the slot
- **WHEN** a person chooses a slot on the form
- **THEN** only that slot's types are offered

#### Scenario: An item is added with its photograph
- **GIVEN** a person who has chosen a file
- **WHEN** they submit the form
- **THEN** the file is sent to the address the API gave
- **AND** the item is created with the key the API gave
- **AND** the new item's card is shown

#### Scenario: A photograph is required
- **GIVEN** a person who has chosen no file
- **WHEN** they submit the form
- **THEN** a message is shown
- **AND** no item is created

#### Scenario: A failed upload creates nothing
- **GIVEN** storage that refuses the file
- **WHEN** a person submits the form
- **THEN** a message is shown
- **AND** no item is created

### Requirement: An item's card says what it is
The client SHALL show an item's photograph, name, slot and type in Ukrainian, and SHALL answer an item that cannot be read the way it answers any path it does not know.

#### Scenario: The card names the item in Ukrainian
- **WHEN** a person opens one of their items
- **THEN** its slot and type are shown by their labels

#### Scenario: The card leads back to where the person was
- **GIVEN** a person who opened a card from the wardrobe narrowed to one slot
- **WHEN** they press the back button
- **THEN** the wardrobe is shown narrowed to that slot

#### Scenario: A card opened directly still leads to the wardrobe
- **GIVEN** a person who opened a card from a link
- **WHEN** they press the back button
- **THEN** the wardrobe is shown

#### Scenario: Somebody else's item is simply not there
- **GIVEN** an id the API answers with 404
- **WHEN** it is opened
- **THEN** a window saying the screen was not found is shown

### Requirement: An item can be shared or kept private
The client SHALL show whether friends can see an item, and SHALL let its owner change that.

#### Scenario: Sharing an item
- **GIVEN** a private item
- **WHEN** its owner shares it with friends
- **THEN** the API is told
- **AND** the card shows it as shared

### Requirement: An item can be archived
The client SHALL archive an item with a reason chosen from the vocabulary, SHALL say that this removes it from the wardrobe rather than deleting it, and SHALL return to the wardrobe afterwards.

#### Scenario: Archiving asks why
- **GIVEN** a person on an item's card
- **WHEN** they try to archive it without a reason
- **THEN** a message asks for one
- **AND** nothing is archived
- **WHEN** they archive it with a reason
- **THEN** the API is told that reason
- **AND** the wardrobe is shown

#### Scenario: Archiving returns to where the person was
- **GIVEN** a person who opened a card from the wardrobe narrowed to one slot
- **WHEN** they archive the item
- **THEN** the wardrobe is shown narrowed to that slot

### Requirement: Every code a person reads has a label
The client SHALL hold a Ukrainian label for every slot, type, visibility and archive reason in the vocabularies, so that adding a code to the domain package cannot leave a screen showing it raw.

#### Scenario: No code is without a label
- **WHEN** the labels are compared with the vocabularies
- **THEN** every code has a label containing Cyrillic text
