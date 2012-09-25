jphototag
=========

Another photo tagging jQuery plugin. Highly customizable plugin with event handlers (hooks).
Here are some notes for now, more documentation will be added later (hopefully)

 * Depends on imgAreaSelect plugin (http://odyniec.net/projects/imgareaselect/)
 * Inspired by jQuery Image Notes (https://github.com/sanisoft/jQuery-Image-notes)
 * Tested on Chrome 21, Firefox 15, IE8 for now.
 * Single instance is supported. Multiple instances is coming soon
 * **Still alpha, use at your own risk**

## Options ##

**editAction**: How to edit a tag. Defaults to 'dblclick'

**notes**: Initial notes to load at startup. Defaults to []

**showNotesOnHover**: If true, the notes are hidden and when you mouse over the image the notes are displayed. Defaults to true

**addNoteAction**: Allow if add note form appears when the specified action is done on the image. Defaults to 'click'

**defaultSize**: Default note size when adding

**defaultPosition**: Default note position when adding, if position is not specified.

**messages**: For translation of the messages (i18n)

**form**: Form HTML


## Events ##
**onSubmit**: Triggered after the form is submitted

**onCancel**: The form is canceled

**onAddNoteOpen**: Triggered after the note form is displayed.

**onEditNoteOpen**: Triggered after the note form is displayed.

**onBeforeRemove**: Triggered before the note is deleted.


## Methods ##

_Usage: $(~selector~).jphototag('~method~', options)_

**init**: Initialize

**add**: Add new tag form

**edit**: Edit tag form

**remove**: Remove tag

**cancel**: Cancel tag form

**hideAll**: Hide all notes

**showAll**: Show all notes

**show**: Show a specific note

**hide**: Hide a specific note

**addNotes**: Add default notes (multiple)

**addNote**: Add a note externally

**allNotes**: Get a list of notes as an array of JSON objects

**disable**: Disable jphototag

**enable**: Enable jphototag

**isEnabled**: Enabled or not?

**destroy**: Destroy the instance