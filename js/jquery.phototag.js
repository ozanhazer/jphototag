/**
 * Photo Tag jQuery plugin
 * Version: 0.9b
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
        noteFormZIndex  : 10000,
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
        onCancel     : function (form, note) {
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
        onAddNoteOpen: function (form) {
        },

        /**
         * Triggered after the note form is displayed.
         * "this" refers to the image.
         * form is the jQuery object representing the form.
         * For example you can set the default value like this:
         *   form.find('.jphototag-note-tag').val(myAjaxValue)
         *
         * @param form
         * @param note
         */
        onEditNoteOpen: function (form, note) {
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
        onBeforeRemove: function (note) {
        },

        onInit         : function () {
        },
        defaultSize    : 60, // Default note size when adding
        defaultPosition: [120, 90], // Default note position when adding.
        messages       : {
            'add_note'   : 'Add Note',
            'submit_note': 'Save',
            'cancel_note': 'Cancel'
        },
        form           : '<div id="jphototag-note-form">\
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
     * The proportion of the displayed image according to the original image
     *
     * @type {Object}
     * @private
     */
    var _imageScaleFactor;

    /**
     * @private
     */
    var _imageRealWidth;

    /**
     * @private
     */
    var _imageRealHeight;

    /**
     * Remove ImgAreaSelect object
     *
     * @private
     */
    var _removeImgAreaSelect = function () {
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
     * @param initCallback
     * @param {jQuery=} note - The note object if editing
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

        // ImgAreaSelect instance
        $(_targetImages).imgAreaSelect({
            enable        : true,
            handles       : true,
            persistent    : true,
            imageWidth    : _imageRealWidth,
            imageHeight   : _imageRealHeight,
            onInit        : function (img, area) {
                var $formDiv = $('#jphototag-note-form');

                // Hide all notes
                methods.hideAll();

                // Run the user-defined initCallback
                var params = [$formDiv.find('form'), note];
                initCallback.apply(img, params);

                // Add submit and cancel callbacks
                $formDiv
                    .find('.jphototag-note-form-submit').click(function () {
                        defaults.onSubmit.apply(img, params);
                    })
                    .end()
                    .find('.jphototag-note-form-cancel').click(function () {
                        defaults.onCancel.apply(img, params);
                    });

                // Update the form position & values
                _updateForm(area);

                // Display the form and focus the first visible element
                $formDiv.css('z-index', defaults.noteFormZIndex).show().find(':input:visible:first').focus();

//                console.log('OnInit', 'form shown');

            },
            onSelectChange: function (img, area) {
                // Update the form position & values
                _updateForm(area);
            },
            x1            : position.x1,
            y1            : position.y1,
            x2            : position.x2,
            y2            : position.y2
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

    /**
     * Generates a unique id for new notes
     *
     * @returns {string}
     * @private
     */
    var _uniqid = function () {
        var partOne = new Date().getTime();
        var partTwo = 1 + Math.floor((Math.random() * 32767));
        var partThree = 1 + Math.floor((Math.random() * 32767));
        return partOne + '-' + partTwo + '-' + partThree;
    };

    /**
     * Updates the positions of the notes relateive to the image
     *
     * @param note
     * @private
     */
    var _updateNotePosition = function (note) {
        var note_data = note.data('jphototag.note');

        // Offset data of the image (photo)
        var imgOffset = _targetImages.offset();

        var new_note_data = _reScaleImgAreaSelectArea(note_data);

        // Recalculate the positions of the note and the note description
        var note_left = parseInt(imgOffset.left) + parseInt(new_note_data.x1);
        var note_top = parseInt(imgOffset.top) + parseInt(new_note_data.y1);
        var note_p_top = note_top + parseInt(new_note_data.height) + 5;

//        console.log('_updateNotePosition', imgOffset, {left: note_left, top: note_top}, note_data, new_note_data, _imageScaleFactor);

        // Update the note's CSS
        note.css({
            left  : note_left + 'px',
            top   : note_top + 'px',
            width : new_note_data.width + 'px',
            height: new_note_data.height + 'px',
            'z-index': defaults.noteFormZIndex
        });

        // Update the note text's CSS
        note.next('.jphototag-note-text').css({
            left: note_left + 'px',
            top : note_p_top + 'px'
        });

        // Update the border div's height
        note.find('.jphototag-note-border').each(function () {
            var $this = $(this);
            var height = new_note_data.height - parseInt($this.css('borderTopWidth')) - parseInt($this.css('borderBottomWidth'));
            $this.css('height', height + 'px')
        });

    };


    /**
     *
     * @param area
     * @private
     */
    var _updateForm = function (area) {
        if(area.width == 0 || area.height == 0) {
            return;
        }

        var new_area = _reScaleImgAreaSelectArea(area);

        var position = {};
        var imgOffset = $(_targetImages).offset();

        position.left = parseInt(imgOffset.left) + parseInt(new_area.x1);
        position.top = parseInt(imgOffset.top) + parseInt(new_area.y1) + parseInt(new_area.height) + 5;

//        console.log('_updateForm Position', imgOffset, position, area, new_area, _imageScaleFactor);

        // Update the position of the form
        $('#jphototag-note-form').css({
            left: position.left + 'px',
            top : position.top + 'px'
        });

//        console.log('_updateForm Values', area, new_area);

        // Update the form with the initial values
        $('#jphototag-note-x1').val(area.x1);
        $('#jphototag-note-y1').val(area.y1);
        $('#jphototag-note-height').val(area.height);
        $('#jphototag-note-width').val(area.width);

    };

    var _calculateImageScaleFactor = function () {
        var displayed_width, displayed_height;

        displayed_width = parseInt($(_targetImages).css('width'));
        displayed_height = parseInt($(_targetImages).css('height'));

        _imageScaleFactor = {
            x: Math.round(displayed_width / _imageRealWidth * 1000) / 1000,
            y: Math.round(displayed_height / _imageRealHeight * 1000) / 1000
        };

    };

    var _reScaleImgAreaSelectArea = function (area) {
        var x = Math.round(area.x1 * _imageScaleFactor.x);
        var y = Math.round(area.y1 * _imageScaleFactor.y);
        var width = Math.round(area.width * _imageScaleFactor.x);
        var height = Math.round(area.height * _imageScaleFactor.y);

        return {
            x1    : x,
            y1    : y,
            width : width,
            height: height
        }
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

            // Make an in-memory copy of the image to get the real dimensions of the image
            // Run all initialization methods after the image is loaded as everything is
            // dependant on real-image size
            $("<img/>")
                .attr("src", $(_targetImages).attr("src"))
                .load(function () {
                    _imageRealWidth = this.width;
                    _imageRealHeight = this.height;

                    // Get the scale factor
                    _calculateImageScaleFactor();

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
                    $(window).bind('resize.jphototag', function () {
                        // Recalculate the scale factor
                        _calculateImageScaleFactor();

                        // Update notes
                        var notes = $(_targetImages).jPhotoTag('allNotes'), key;
                        for (key in notes) {
                            if (notes.hasOwnProperty(key)) {
                                _updateNotePosition($('#jphototag-note-' + notes[key].id));
                            }
                        }

                        // Update form, if we have one...
                        var ias = $(_targetImages).data('imgAreaSelect');
                        if(ias) {
                            _updateForm(ias.getSelection());
                        }
                    });

                    // Add note action
                    if (defaults.addNoteAction) {
                        $(_targetImages).bind(defaults.addNoteAction + '.jphototag', function (e) {

                            if (!_enabled) {
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

                    defaults.onInit()
                });

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
            if (defaults.onBeforeRemove.apply(this, [$note]) !== false) {
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

            if (!note_data.id) note_data.id = _uniqid();

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
                    $(this).next('.jphototag-note-text').css("z-index", defaults.noteFormZIndex);
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

            var $body = $('body');
            $body.append(note_area_div);
            $body.append(note_text_div);

            _updateNotePosition(note_area_div);

            _notes[note_data.id] = note_data;
        },

        'allNotes': function () {
            return _notes;
        },

        'isEnabled': function () {
            return _enabled;
        },

        'enable': function () {
            _enabled = true;
        },

        'disable': function () {
            _enabled = false;
            _removeImgAreaSelect();
            methods.hideAll();
        },

        'destroy': function () {
            $('#jphototag-note-form,.jphototag-note,.jphototag-note-text').remove();
            $(_targetImages).unbind('.jphototag');
            _removeImgAreaSelect();
            _instance = null;
        }
    };

    //noinspection FunctionWithInconsistentReturnsJS
    $.fn.jPhotoTag = function (method) {
        // Method calling logic
        if (methods[method]) {
            if (_instance) {
                if (_enabled || method == 'enable') {
                    return methods[ method ].apply(this, Array.prototype.slice.call(arguments, 1));
                }
            } else if (method != 'destroy') {
                $.error('jPhotoTag is not initialized');
            }
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist');
        }
    };
})(jQuery);