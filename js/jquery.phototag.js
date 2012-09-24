/**
 * Photo Tag jQuery plugin
 * Version: UNSTABLE
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
        defaultSize     : 60, // Default note size when adding
        defaultPosition : [120, 90], // Default note position when adding.
        form            : '<div id="jphototag-note-form">\
            <form method="post" action="">\
                <legend>Add Note</legend>\
                <input name="data[note][x1]" type="hidden" value="" id="jphototag-note-x1"/>\
                <input name="data[note][y1]" type="hidden" value="" id="jphototag-note-y1"/>\
                <input name="data[note][height]" type="hidden" value="" id="jphototag-note-height"/>\
                <input name="data[note][width]" type="hidden" value="" id="jphototag-note-width"/>\
                <textarea name="data[note][tag]" id="jphototag-note-tag"></textarea>\
                <div class="submit">\
                    <input type="submit" value="Submit"/>\
                    <input type="button" value="Cancel" id="cancelnote"/>\
                </div>\
            </form>\
        </div>\
        '
    };

    /**
     * If true add note form (imgAreaSelect) is active.
     * Only one add note form in an image can be active at the same time
     *
     * @type {Boolean}
     * @private
     */
    var _addingNote = false;

    var _targetImages;

    var _notes = {};

    // Get position for note form.
    var _getNoteFormPosition = function (img, area) {
        var position = {};

        var imgOffset = $(img).offset();
        position.left = parseInt(imgOffset.left) + parseInt(area.x1);
        position.top = parseInt(imgOffset.top) + parseInt(area.y1) + parseInt(area.height) + 5;

        return position;
    };

    var _createImgAreaSelect = function (position) {

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

                $('#jphototag-note-form').css({
                    left     : noteFormPosition.left + 'px',
                    top      : noteFormPosition.top + 'px',
                    'z-index': 10000
                }).show().find(':input:visible:first').focus();

                methods.hideAll();

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
            x1            : position.x1,
            y1            : position.y1,
            x2            : position.x2,
            y2            : position.y2
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
            // TODO: This does not support multiple instances
            if (defaults.showNotesOnHover) {
                $(_targetImages).hover(
                    function () {
                        if(!_addingNote) {
                            $('.jphototag-note').show();
                        }
                        // $(this).find('.jphototag-note').show();
                    },
                    function () {
                        if(!_addingNote) {
                            $('.jphototag-note,.jphototag-note-text').hide();
                        }
                        // $(this).find('.jphototag-note,.jphototag-note-text').hide();
                    }
                );
            }

            // Add the form
            // TODO: Should be appended one time only
            $('body').append(defaults.form);

            // Add the default notes
            if (defaults.notes.length > 0) {
                methods.addNotes(defaults.notes);
            }

            // Add note action
            if(defaults.addNoteAction) {
                $(_targetImages).bind(defaults.addNoteAction, function(e) {
                    var $img = $(this);
                    var imgPosition = $img.offset();

                    // Get the left and top coordinates
                    var x1 = e.pageX - imgPosition.left - defaults.defaultSize / 2;
                    var y1 = e.pageY - imgPosition.top - defaults.defaultSize / 2;

                    // Correction for left & top. Avoid selection form moving outside the image
                    if(x1 < 0) x1 = 0;
                    if(y1 < 0) y1 = 0;

                    // Right and bottom coordinates
                    var x2 = x1 + defaults.defaultSize;
                    var y2 = y1 + defaults.defaultSize;

                    // Correction for right & bottom
                    if(x2 > $img.width()) {
                        x1 = x1 - (x2 - $img.width());
                        x2 = x1 + defaults.defaultSize;
                    }

                    if(y2 > $img.height()) {
                        y1 = y1 - (y2 - $img.height());
                        y2 = y1 + defaults.defaultSize;
                    }

                    // Add the tag form
                    methods.add({ x1: x1, y1: y1, x2: x2, y2: y2 });
                });
            }
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

            _createImgAreaSelect(position);
        },

        /**
         * Edit note
         */
        edit: function (note) {
            // Remove ImgAreaSelect if exists
            $(_targetImages).imgAreaSelect({
                remove: true
            });
            $('#jphototag-note-form').hide();

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
            _createImgAreaSelect(position);

        },

        /**
         * Delete note
         */
        'delete': function (id) {
            var $note = $('#jphototag-note-' + id);
            $note.next().remove();
            $note.remove();

            delete _notes[id];
        },

        /**
         * Cancel add/edit note form.
         * TODO: Get rid of CSS id names
         */
        cancel: function () {
            $(_targetImages).imgAreaSelect({
                remove: true
            });
            $('#jphototag-note-form').hide();

            _addingNote = false;
        },

        /**
         * Hide all notes
         *
         * TODO: hide the notes of the specific jPhotoTag
         */
        hideAll: function () {
            $('.jphototag-note,.jphototag-note-text').hide();
        },

        /**
         * Show all notes
         *
         * TODO: hide the notes of the specific jPhotoTag
         */
        showAll: function () {
            $('.jphototag-note,.jphototag-note-text').show();
        },

        show: function(id) {
            var $note = $('#jphototag-note-' + id);
            $note.show();
            $note.next().show();
        },

        hide: function(id) {
            var $note = $('#jphototag-note-' + id);
            $note.hide();
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
            var imgOffset = _targetImages.offset();

            var note_left = parseInt(imgOffset.left) + parseInt(note_data.x1);
            var note_top = parseInt(imgOffset.top) + parseInt(note_data.y1);
            var note_p_top = note_top + parseInt(note_data.height) + 5;

            var id = note_data.id ? note_data.id : $('.jphototag-note').length + 1;

            var note_area_div = $('<div class="jphototag-note" id="jphototag-note-' + id + '"><div class="jphototag-note-border"><div class="jphototag-note-bg"></div></div></div>')
                .css({ left: note_left + 'px',
                    top    : note_top + 'px',
                    width  : note_data.width + 'px',
                    height : note_data.height + 'px' });

            var note_text_div = $('<div class="jphototag-note-text">' + note_data.note + '</div>')
                .css({ left: note_left + 'px',
                    top    : note_p_top + 'px'});

            // Add note actions
            note_area_div.hover(
                function () {
                    if(!_addingNote) {
                        $('.jphototag-note').show();
                    }
                    $(this).addClass('jphototag-note-focus');
                    $(this).next('.jphototag-note-text').show().css('display', 'inline-block');
                    $(this).next('.jphototag-note-text').css("z-index", 10000);
                },
                function () {
                    if(!_addingNote) {
                        $('.jphototag-note').show();
                    }
                    $(this).removeClass('jphototag-note-focus');
                    $(this).next('.jphototag-note-text').hide();
                    $(this).next('.jphototag-note-text').css("z-index", 0);
                });

            if(defaults.editAction) {
                note_area_div.bind(defaults.editAction, function() {
                    methods.edit(this);
                });
            }

            var $body = $('body');
            $body.append(note_area_div);
            $body.append(note_text_div);

            _notes[id] = note_data;
        },

        allNotes: function() {
            return _notes;
        }
    };

    //noinspection FunctionWithInconsistentReturnsJS
    $.fn.jPhotoTag = function (method) {
        // Method calling logic
        if (methods[method]) {
            return methods[ method ].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist');
        }
    };
})(jQuery);