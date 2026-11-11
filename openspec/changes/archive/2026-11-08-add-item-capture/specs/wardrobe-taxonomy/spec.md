## ADDED Requirements

### Requirement: A tag suggestion has the shape of the tags
The domain package SHALL define a tag suggestion holding every tag an item has, each of which may be null, and a list of the fields the suggester is unsure of, and SHALL read an untrusted suggestion field by field, turning any field that breaks the vocabularies or the slot/type rule into null rather than refusing the whole suggestion.

#### Scenario: A valid suggestion is read as it is
- **WHEN** a suggestion with slot `top`, type `blouse` and seasons `spring` and `summer` is read
- **THEN** the result carries those values

#### Scenario: An invalid field becomes null
- **WHEN** a suggestion with pattern `tartan-ish` and slot `top` is read
- **THEN** the pattern is null
- **AND** the slot is `top`

#### Scenario: A type from another slot becomes null
- **WHEN** a suggestion with slot `bottom` and type `blouse` is read
- **THEN** the type is null
- **AND** the slot is `bottom`

#### Scenario: A missing field is null
- **WHEN** an empty object is read as a suggestion
- **THEN** every tag is null and nothing is uncertain

### Requirement: Colors are read from an item's pixels
The domain package SHALL compute an item's colors from the pixels of its image, SHALL ignore transparent pixels, SHALL name each color by a color family with its hex value and its share of the visible area, SHALL leave out colors under a tenth of that area, and SHALL return at most three, largest first.

#### Scenario: One color
- **WHEN** the colors of an image that is entirely one red are read
- **THEN** the result is one color of family `red` with a share of 1

#### Scenario: Transparent pixels do not count
- **WHEN** the colors of an image that is half navy and half transparent are read
- **THEN** the result is one color of family `navy` with a share of 1

#### Scenario: Shares and order
- **WHEN** the colors of an image that is three quarters white and one quarter black are read
- **THEN** the result is white with a share of 0.75, then black with a share of 0.25

#### Scenario: Specks are left out
- **WHEN** the colors of an image that is 95% beige and 5% green are read
- **THEN** the result is beige alone

#### Scenario: A fully transparent image has no colors
- **WHEN** the colors of an image with no opaque pixel are read
- **THEN** the result is empty
