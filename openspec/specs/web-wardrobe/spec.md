# web-wardrobe Specification

## Purpose
Covers the wardrobe as a person sees it: their items a page at a time and by slot, adding one with a photograph uploaded straight to storage, an item's card, sharing it with friends, and taking it out of the wardrobe with a reason.

## Requirements

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
The client SHALL add an item from a slot, a type belonging to that slot, an optional name and a photograph taken with the camera or chosen from the device, SHALL refuse the form without a photograph or with one it cannot read, SHALL upload the images straight to storage before creating the item, and SHALL create nothing if any upload fails.

#### Scenario: The types follow the slot
- **WHEN** a person chooses a slot on the form
- **THEN** only that slot's types are offered

#### Scenario: The camera and the gallery are both offered
- **WHEN** the new item form is opened
- **THEN** there is a way to take a photograph with the camera
- **AND** a way to choose one already on the device

#### Scenario: An item is added with its photograph
- **GIVEN** a person who has chosen a photograph
- **WHEN** they submit the form
- **THEN** the original is sent to the address the API gave
- **AND** the item is created with the key the API gave
- **AND** the new item's card is shown

#### Scenario: A photograph is required
- **GIVEN** a person who has chosen no file
- **WHEN** they submit the form
- **THEN** a message is shown
- **AND** no item is created

#### Scenario: A file that is not a readable image is refused
- **GIVEN** a person who has chosen a file that cannot be read as an image
- **WHEN** it is chosen
- **THEN** a message is shown
- **AND** the form cannot be submitted with it

#### Scenario: A failed upload creates nothing
- **GIVEN** storage that refuses the file
- **WHEN** a person submits the form
- **THEN** a message is shown
- **AND** no item is created

### Requirement: An item's card says what it is
The client SHALL show an item's image, name, slot and type in Ukrainian, together with every other tag it has, SHALL show the cut-out as its image where there is one, and SHALL answer an item that cannot be read the way it answers any path it does not know.

#### Scenario: The card names the item in Ukrainian
- **WHEN** a person opens one of their items
- **THEN** its slot and type are shown by their labels

#### Scenario: The card shows the tags it has
- **GIVEN** an item with seasons, a pattern and colors
- **WHEN** its card is opened
- **THEN** its seasons, pattern and colors are shown by their labels
- **AND** no line is shown for a tag it does not have

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
The client SHALL hold a Ukrainian label for every code in every vocabulary a screen shows - slots, types, patterns, fabric types, materials, fits, lengths, rises, seasons, styles, occasions, color families, visibilities and archive reasons - so that adding a code to the domain package cannot leave a screen showing it raw.

#### Scenario: No code is without a label
- **WHEN** the labels are compared with the vocabularies
- **THEN** every code has a label containing Cyrillic text

### Requirement: The wardrobe leads back to the desktop
The client SHALL offer a visible way back from the wardrobe, as it does from an item's card, so that nobody has to look for the taskbar to leave it.

#### Scenario: The wardrobe leads back to the desktop
- **GIVEN** a person in the wardrobe
- **WHEN** they press the back button
- **THEN** the desktop is shown

### Requirement: Archived items can be looked at
The client SHALL offer the archive in the wardrobe's filter, SHALL list only archived items while it is chosen, SHALL keep that choice in the URL alongside the slot, and SHALL say so when the archive is empty.

#### Scenario: The archive lists archived items
- **GIVEN** a person with an archived item
- **WHEN** they choose the archive
- **THEN** the API is asked for archived items
- **AND** the archived item is shown

#### Scenario: The archive and a slot combine
- **WHEN** the wardrobe is opened at an address naming the archive and a slot
- **THEN** the API is asked for archived items of that slot

#### Scenario: An empty archive says so
- **GIVEN** a person with nothing archived
- **WHEN** they choose the archive
- **THEN** a message says the archive is empty

### Requirement: An archived item can be put back
The client SHALL show on an archived item's card that it is archived, when and why, SHALL offer to put it back in place of archiving it, and SHALL show it as back in the wardrobe once the API has answered.

#### Scenario: An archived card says why it left
- **GIVEN** an item archived as given away
- **WHEN** its card is opened
- **THEN** the card says it is archived and why
- **AND** no way to archive it is offered

#### Scenario: Putting it back
- **GIVEN** an archived item's card
- **WHEN** its owner puts it back
- **THEN** the API is told
- **AND** the card no longer says it is archived
- **AND** the wardrobe lists it again

### Requirement: The background is cut out before saving
The client SHALL cut the background out of the chosen photograph on the device, SHALL show the result for the person to keep or decline, SHALL save the item with the original alone when cutting out fails or is declined, and SHALL show the cut-out in the wardrobe and on the card wherever an item has one.

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
- **AND** the form can still be submitted with the original

#### Scenario: The wardrobe shows the cut-out
- **GIVEN** an item with a photograph and a cut-out
- **WHEN** the wardrobe is opened
- **THEN** the cut-out is the image shown for it

### Requirement: Photographs are made smaller before sending
The client SHALL send the original at most 1600 pixels and the cut-out at most 1024 pixels on the longer side, without enlarging a smaller image, SHALL send them as WebP where the browser can encode it, and otherwise as JPEG for the original and PNG for the cut-out.

#### Scenario: A large photograph is made smaller
- **GIVEN** a photograph of 4032 by 3024 pixels
- **WHEN** it is prepared for sending
- **THEN** the original is 1600 by 1200 pixels
- **AND** the cut-out is 1024 by 768 pixels

#### Scenario: A small photograph keeps its size
- **GIVEN** a photograph of 800 by 600 pixels
- **WHEN** it is prepared for sending
- **THEN** both images are 800 by 600 pixels

#### Scenario: WebP where it can be made
- **GIVEN** a browser that encodes WebP
- **WHEN** a photograph is prepared for sending
- **THEN** both images are WebP

#### Scenario: A browser without WebP still sends something the API accepts
- **GIVEN** a browser that cannot encode WebP
- **WHEN** a photograph is prepared for sending
- **THEN** the original is JPEG and the cut-out is PNG

### Requirement: Colors are offered from the photograph
The client SHALL fill the form's colors from the pixels of the cut-out, or of the original where there is none, SHALL show each color with its family's label, and SHALL let the person remove any of them before saving.

#### Scenario: Colors appear once the photograph is ready
- **GIVEN** a cut-out that is mostly red
- **WHEN** it is shown
- **THEN** the form offers red among the colors

#### Scenario: A color can be removed
- **GIVEN** a form offering two colors
- **WHEN** the person removes one and submits
- **THEN** the item is created with the other alone

### Requirement: Every tag can be filled in
The client SHALL offer every tag of the vocabularies on the new item form, each by its Ukrainian label, SHALL require only the slot and the type, SHALL send only the tags that were filled in, and SHALL accept a tag suggestion that fills the form while leaving every field editable.

#### Scenario: Only slot and type are required
- **GIVEN** a person who chose a photograph, a slot and a type and nothing else
- **WHEN** they submit the form
- **THEN** the item is created with the slot and the type and no other tag

#### Scenario: Filled tags are sent
- **GIVEN** a person who chose seasons, a formality and a material with its percentage
- **WHEN** they submit the form
- **THEN** the item is created with those tags

#### Scenario: All seasons at once
- **WHEN** a person chooses all seasons
- **THEN** every season is chosen

#### Scenario: A suggestion fills the form
- **GIVEN** a suggestion naming a pattern and two styles
- **WHEN** it is given to the form
- **THEN** that pattern and those styles are chosen
- **AND** the person can change them

### Requirement: A cut-out is trimmed to the item
The client SHALL crop the transparent margin around the item from a cut-out before encoding it, keeping a cut-out that is transparent everywhere as it is.

#### Scenario: The margin is cropped
- **GIVEN** a cut-out whose opaque pixels lie in a box inside the image
- **WHEN** it is trimmed
- **THEN** the result is exactly that box

#### Scenario: Nothing opaque
- **GIVEN** a cut-out with no opaque pixel
- **WHEN** it is trimmed
- **THEN** the whole image is kept

### Requirement: Background removal can be switched off
The client SHALL not cut out the background, and SHALL not fetch what cutting out needs, while the `photoCutout` flag is off, and SHALL then save a new item with its original photograph alone, without saying that anything failed.

#### Scenario: Switched off, the original is used
- **GIVEN** the `photoCutout` flag is off
- **WHEN** a person chooses a photograph for a new item
- **THEN** the original is shown
- **AND** nothing says the background was not removed
- **AND** nothing offers to keep a cut-out

#### Scenario: Switched off, only the original is sent
- **GIVEN** the `photoCutout` flag is off
- **WHEN** a person submits a new item with a photograph
- **THEN** only the original is uploaded
- **AND** the item is created with no cut-out key

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
