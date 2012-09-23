/**
 * Photo Tag jQuery plugin
 * Version: 0.1
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
        editAction: 'doubleClick', // Possible values: doubleClick, rightClick, null|false
        notes     : [],
        debug     : false,
        form      : '<div id="jphototag-note-form">\
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
            position = {
                x1: 120,
                y1: 90,
                x2: 280,
                y2: 210
            }
        }

        // Do the job!
        $(_targetImages).imgAreaSelect({
            enable        : true,
            onInit        : function (img, area) {
                var noteFormPosition = _getNoteFormPosition(img, area);

                $('#jphototag-note-form').css({
                    left     : noteFormPosition.left + 'px',
                    top      : noteFormPosition.top + 'px',
                    'z-index': 10000
                }).show().find(':input:visible:first').focus();

            },
            onSelectChange: function (img, area) {
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

    }


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
            // TODO: Make it parametric.
            $(_targetImages).hover(
                function () {
                    $('.jphototag-note').show();
//                    $(this).find('.jphototag-note').show();
                },
                function () {
                    $('.jphototag-note,.jphototag-note-text').hide();
//                    $(this).find('.jphototag-note,.jphototag-note-text').hide();
                }
            );

            $('body').append(defaults.form);

            // Add the default notes
            if (defaults.notes.length > 0) {
                methods.notes(defaults.notes);
            }
        },

        /**
         * Add new note
         */
        add: function () {
            // If already adding a note, don't let another instance
            if (_addingNote) {
                return false;
            }

            _addingNote = true;

            _createImgAreaSelect();
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
                x2: x1 + $(this).width(),
                y2: y1 + $(this).height()
            };


            // Create imgAreaSelect
            _createImgAreaSelect(position);

        },

        /**
         * Delete note
         */
        delete: function (note) {

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
        notes: function (notes) {
            $(notes).each(function () {
                methods.note(this);
            });
        },

        /**
         * Add single note to the image.
         *
         * TODO: Define the image that we are working on and use that instead of
         * imgOffset etc.
         *
         * note_data example:
         * {x1: 10, y1: 10, height: 150, width: 50, note: "This is a note"}
         *
         * @param note_data
         */
        note: function (note_data) {
            var imgOffset = _targetImages.offset();

            var note_left = parseInt(imgOffset.left) + parseInt(note_data.x1);
            var note_top = parseInt(imgOffset.top) + parseInt(note_data.y1);
            var note_p_top = note_top + parseInt(note_data.height) + 5;

            var note_area_div = $('<div class="jphototag-note"></div>')
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
                    $('.jphototag-note').show();
                    $(this).next('.jphototag-note-text').show();
                    $(this).next('.jphototag-note-text').css("z-index", 10000);
                },
                function () {
                    $('.jphototag-note').show();
                    $(this).next('.jphototag-note-text').hide();
                    $(this).next('.jphototag-note-text').css("z-index", 0);
                });

            var $body = $('body');
            $body.append(note_area_div);
            $body.append(note_text_div);
        }
    };

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