/**
 * Photo Tag jQuery plugin
 * Version: 0.9a
 *
 * Copyright (c) 2012 - M.Ozan Hazer (ozanhazer@gmail.com)
 *
 * Dual licensed under the MIT (MIT-LICENSE.txt) and GPL (GPL-LICENSE.txt) licenses.
 **/
(function ($) {
    /**
     * Default parameters
     *
     * @type {Object}
     */
    var defaults = {
        editAction      : 'dblclick', // Possible values: dblclick, rightclick, null|false
        notes           : [],
        debug           : false,
        showNotesOnHover: true,
        addNoteAction   : 'click',
        /**
         * Triggered after the form is submitted
         *
         * @param form
         * @param note
         */
        onSubmit        : function (form, note) {
        },

        /**
         *
         * @param form
         * @param note
         */
        onCancel        : function (form, note) {
            methods.cancel();
            $('#jphototag-note-id').val('');
            form.find('.jphototag-note-tag').val('');
        },
        /**
         * Triggered after the note form is displayed.
         * "this" refers to the image.
         * form is the jQuery object representing the form.
         * For example you can set the default value like this:
         *   form.find('.jphototag-note-tag').val('Some default value')
         *
         * @param form
         */
        onAddNoteOpen   : function (form) {
        },

        /**
         * Triggered after the note form is displayed.
         * "this" refers to the image.
         * form is the jQuery object representing the form.
         * For example you can set the default value like this:
         *   form.find('.jphototag-note-tag').val(myAjaxValue)
         *
         * @param form
         */
        onEditNoteOpen  : function (form, note) {
            var data = note.data('jphototag.note');
            $('#jphototag-note-id').val(data.id);
            form.find('.jphototag-note-tag').val(data.note);
        },

        /**
         * Triggered before the note is deleted.
         * "this" refers to the image.
         * note is the jQuery object representing the note div.
         * note data is accessible via note.data('jphototag.note')
         *
         * note.data('jphototag.note').id is the id of the note...
         *
         * @param note
         */
        onBeforeRemove  : function(note) {
        },
        defaultSize     : 60, // Default note size when adding
        defaultPosition : [120, 90], // Default note position when adding.
        messages        : {
            'add_note'   : 'Add Note',
            'submit_note': 'Save',
            'cancel_note': 'Cancel'
        },
        form            : '<div id="jphototag-note-form">\
            <form method="post" action="">\
                <legend>%add_note%</legend>\
                <input name="data[note][id]" type="hidden" value="" id="jphototag-note-id"/>\
                <input name="data[note][x1]" type="hidden" value="" id="jphototag-note-x1"/>\
                <input name="data[note][y1]" type="hidden" value="" id="jphototag-note-y1"/>\
                <input name="data[note][height]" type="hidden" value="" id="jphototag-note-height"/>\
                <input name="data[note][width]" type="hidden" value="" id="jphototag-note-width"/>\
                <textarea name="data[note][tag]" class="jphototag-note-tag"></textarea>\
                <div class="submit">\
                    <input type="button" value="%submit_note%" class="jphototag-note-form-submit"/>\
                    <input type="button" value="%cancel_note%" class="jphototag-note-form-cancel"/>\
                </div>\
            </form>\
        </div>\
        '
    };

    var _instance, _enabled = true;

    /**
     * If true add note form (imgAreaSelect) is active.
     * Only one add note form in an image can be active at the same time
     *
     * @type {Boolean}
     * @private
     */
    var _addingNote = false;

    /**
     * Target image
     *
     * @type {jQuery}
     * @private
     */
    var _targetImages;

    /**
     * Keeps the list of the notes
     *
     * @type {Object}
     * @private
     */
    var _notes = {};

    /**
     * Get position for note form.
     *
     * @private
     */
    var _getNoteFormPosition = function (img, area) {
        var position = {};

        var imgOffset = $(img).offset();
        position.left = parseInt(imgOffset.left) + parseInt(area.x1);
        position.top = parseInt(imgOffset.top) + parseInt(area.y1) + parseInt(area.height) + 5;

        return position;
    };

    var _removeImgAreaSelect = function() {
        $(_targetImages).imgAreaSelect({
            remove: true
        });
        $('#jphototag-note-form')
            .hide()
            .find('.jphototag-note-form-submit').unbind('click')
            .end()
            .find('.jphototag-note-form-cancel').unbind('click');
    };

    /**
     * Creates an imgAreaSelect instance for adding and editing.
     *
     * @param position
     * @private
     */
    var _createImgAreaSelect = function (position, initCallback, note) {

        if (!position) {
            var x1 = defaults.defaultPosition[0];
            var y1 = defaults.defaultPosition[1];
            position = {
                x1: x1,
                y1: y1,
                x2: x1 + defaults.defaultSize,
                y2: y1 + defaults.defaultSize
            }
        }

        // Do the job!
        $(_targetImages).imgAreaSelect({
            'enable'        : true,
            'handles'       : true,
            'persistent'    : true,
            'onInit'        : function (img, area) {
                var noteFormPosition = _getNoteFormPosition(img, area);
                var $formDiv = $('#jphototag-note-form');

                $formDiv.css({
                    left     : noteFormPosition.left + 'px',
                    top      : noteFormPosition.top + 'px',
                    'z-index': 10000
                }).show().find(':input:visible:first').focus();

                methods.hideAll();

                var params = [$formDiv.find('form'), note];
                initCallback.apply(img, params);

                $formDiv
                    .find('.jphototag-note-form-submit').click(function() {
                        defaults.onSubmit.apply(img, params);
                    })
                    .end()
                    .find('.jphototag-note-form-cancel').click(function() {
                        defaults.onCancel.apply(img, params);
                    });

            },
            'onSelectChange': function (img, area) {
                var noteFormPosition = _getNoteFormPosition(img, area);

                $('#jphototag-note-form').css({
                    left: noteFormPosition.left + 'px',
                    top : noteFormPosition.top + 'px'
                });


                $('#jphototag-note-x1').val(area.x1);
                $('#jphototag-note-y1').val(area.y1);
                $('#jphototag-note-height').val(area.height);
                $('#jphototag-note-width').val(area.width);

            },
            x1              : position.x1,
            y1              : position.y1,
            x2              : position.x2,
            y2              : position.y2
        });

    };

    /**
     * Basic translation function
     *
     * @param text
     * @return {String}
     * @private
     */
    var _translate = function (text) {
        return String(text).replace(/%(.+?)%/g, function (match, index) {
            return defaults.messages[index];
        });
    };

    var _uniqid = function () {
        var partOne = new Date().getTime();
        var partTwo = 1 + Math.floor((Math.random() * 32767));
        var partThree = 1 + Math.floor((Math.random() * 32767));
        return partOne + '-' + partTwo + '-' + partThree;
    };

    var _updateNotePosition = function (note) {
        var note_data = note.data('jphototag.note');

        var imgOffset = _targetImages.offset();

        var note_left = parseInt(imgOffset.left) + parseInt(note_data.x1);
        var note_top = parseInt(imgOffset.top) + parseInt(note_data.y1);
        var note_p_top = note_top + parseInt(note_data.height) + 5;

        note.css({
            left: note_left + 'px',
            top    : note_top + 'px',
            width  : note_data.width + 'px',
            height : note_data.height + 'px'
        });

        note.next('.jphototag-note-text').css({
            left: note_left + 'px',
            top    : note_p_top + 'px'
        });
    };

    /**
     * Plugin definition
     *
     * @type {Object}
     */
    var methods = {
        /**
         * Constructor method
         *
         * @param options
         */
        init: function (options) {
            $.extend(defaults, options);

            // Setup
            _targetImages = $(this);

            // Setup show on hover.
            if (defaults.showNotesOnHover) {
                $(_targetImages).hover(
                    function () {
                        if (!_addingNote && _enabled) {
                            $('.jphototag-note').show();
                        }
                    },
                    function () {
                        if (!_addingNote && _enabled) {
                            $('.jphototag-note,.jphototag-note-text').hide();
                            $('.jphototag-note').removeClass('jphototag-note-focus');
                        }
                    }
                );
            }

            // Add the form
            $('body').append(_translate(defaults.form));

            // Add the default notes
            if (defaults.notes.length > 0) {
                methods.addNotes(defaults.notes);
            }

            // Fix the positions of the notes if the window is resized
            $(window).bind('resize.jphototag', function() {
                var notes = $(_targetImages).jPhotoTag('allNotes'), key;
                for(key in notes) {
                    _updateNotePosition($('#jphototag-note-' + notes[key].id));
                }
            });

            // Add note action
            if (defaults.addNoteAction) {
                $(_targetImages).bind(defaults.addNoteAction + '.jphototag', function (e) {

                    if(!_enabled) {
                        return;
                    }

                    var $img = $(this);
                    var imgPosition = $img.offset();

                    // Get the left and top coordinates
                    var x1 = e.pageX - imgPosition.left - defaults.defaultSize / 2;
                    var y1 = e.pageY - imgPosition.top - defaults.defaultSize / 2;

                    // Correction for left & top. Avoid selection form moving outside the image
                    if (x1 < 0) x1 = 0;
                    if (y1 < 0) y1 = 0;

                    // Right and bottom coordinates
                    var x2 = x1 + defaults.defaultSize;
                    var y2 = y1 + defaults.defaultSize;

                    // Correction for right & bottom
                    if (x2 > $img.width()) {
                        x1 = x1 - (x2 - $img.width());
                        x2 = x1 + defaults.defaultSize;
                    }

                    if (y2 > $img.height()) {
                        y1 = y1 - (y2 - $img.height());
                        y2 = y1 + defaults.defaultSize;
                    }

                    // Add the tag form
                    methods.add({ x1: x1, y1: y1, x2: x2, y2: y2 });
                });
            }

            _instance = this;
        },

        /**
         * Add new note
         */
        add: function (position) {
            // If already adding a note, don't let another instance
            if (_addingNote) {
                return;
            }

            _addingNote = true;

            _createImgAreaSelect(position, defaults.onAddNoteOpen);
        },

        /**
         * Edit note
         */
        edit: function (note) {
            // Remove ImgAreaSelect if exists
            _removeImgAreaSelect();
            _addingNote = true;


            // Get the position of the note
            var noteOffset = $(note).offset();
            var imgOffset = $(_targetImages).offset();
            var x1 = noteOffset.left - imgOffset.left;
            var y1 = noteOffset.top - imgOffset.top;
            var position = {
                x1: x1,
                y1: y1,
                x2: x1 + $(note).width(),
                y2: y1 + $(note).height()
            };


            // Create imgAreaSelect
            _createImgAreaSelect(position, defaults.onEditNoteOpen, $(note));

        },

        /**
         * Remove note
         */
        'remove': function (id) {
            var $note = $('#jphototag-note-' + id);
            if(defaults.onBeforeRemove.apply(this, [$note]) !== false) {
                $note.next().remove();
                $note.remove();

                delete _notes[id];
                return true;
            } else {
                return false;
            }
        },

        /**
         * Cancel add/edit note form.
         */
        cancel: function () {
            _removeImgAreaSelect();
            _addingNote = false;
        },

        /**
         * Hide all notes
         */
        hideAll: function () {
            $('.jphototag-note,.jphototag-note-text').hide();
            $('.jphototag-note').removeClass('jphototag-note-focus');
        },

        /**
         * Show all notes
         */
        showAll: function () {
            $('.jphototag-note,.jphototag-note-text').show();
            $('.jphototag-note').addClass('jphototag-note-focus');
        },

        show: function (id) {
            var $note = $('#jphototag-note-' + id);
            $note.show().addClass('jphototag-note-focus');
            $note.next().show();
        },

        hide: function (id) {
            var $note = $('#jphototag-note-' + id);
            $note.hide().removeClass('jphototag-note-focus');
            $note.next().hide();
        },

        /**
         * Default notes.
         *
         * notes format:
         * [
         *   {x1: 10, y1: 10, height: 150, width: 50, note: "This is a note"},
         *   {x1: 25, y1: 25, height: 70, width : 80, note: "<b>This</b> is another note"}
         * ]
         *
         * or
         *
         * {
         *    url: 'some_url',
         *    onComplete: function
         * }
         *
         * @param notes
         */
        addNotes: function (notes) {
            $(notes).each(function () {
                methods.addNote(this);
            });
        },

        /**
         * Add single note to the image.
         *
         * note_data example:
         * {x1: 10, y1: 10, height: 150, width: 50, note: "This is a note"}
         *
         * @param note_data
         */
        addNote: function (note_data) {

            if(!note_data.id) note_data.id = _uniqid();

            var note_area_div = $('<div class="jphototag-note" id="jphototag-note-' + note_data.id + '"><div class="jphototag-note-border"><div class="jphototag-note-bg"></div></div></div>')
                .data('jphototag.note', note_data);

            var note_text_div = $('<div class="jphototag-note-text">' + note_data.note + '</div>');

            // Add note actions
            note_area_div.hover(
                function () {
                    if (!_addingNote) {
                        $('.jphototag-note').show();
                    }
                    $(this).addClass('jphototag-note-focus');
                    $(this).next('.jphototag-note-text').show().css('display', 'inline-block');
                    $(this).next('.jphototag-note-text').css("z-index", 10000);
                },
                function () {
                    if (!_addingNote) {
                        $('.jphototag-note').show();
                    }
                    $(this).removeClass('jphototag-note-focus');
                    $(this).next('.jphototag-note-text').hide();
                    $(this).next('.jphototag-note-text').css("z-index", 0);
                });

            if (defaults.editAction) {
                note_area_div.bind(defaults.editAction, function () {
                    methods.edit(this);
                });
            }

            _updateNotePosition(note_area_div);

            var $body = $('body');
            $body.append(note_area_div);
            $body.append(note_text_div);

            _notes[note_data.id] = note_data;

            // Should be applied after the elements are added to the DOM or
            // CSS properties cannot be read.
            note_area_div.find('.jphototag-note-border').each(function() {
                var $this = $(this);
                var height = note_data.height - parseInt($this.css('borderTopWidth')) - parseInt($this.css('borderBottomWidth'));
                $this.css('height', height + 'px')
            });
        },

        'allNotes': function () {
            return _notes;
        },

        'isEnabled': function() {
            return _enabled;
        },

        'enable': function() {
            _enabled = true;
        },

        'disable': function() {
            _enabled = false;
            _removeImgAreaSelect();
            methods.hideAll();
        },

        'destroy': function() {
            $('#jphototag-note-form,.jphototag-note,.jphototag-note-text').remove();
            $(_targetImages).unbind('.jphototag');
            _instance = null;
        }
    };

    //noinspection FunctionWithInconsistentReturnsJS
    $.fn.jPhotoTag = function (method) {
        // Method calling logic
        if (methods[method]) {
            if(_instance) {
                if(_enabled || method == 'enable') {
                    return methods[ method ].apply(this, Array.prototype.slice.call(arguments, 1));
                }
            } else if(method != 'destroy') {
                $.error('jPhotoTag is not initialized');
            }
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist');
        }
    };
})(jQuery);