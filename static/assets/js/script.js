var Drop = {

    mixins: [Position, Togglable],

    args: 'pos',

    props: {
        mode: 'list',
        toggle: Boolean,
        boundary: Boolean,
        boundaryAlign: Boolean,
        delayShow: Number,
        delayHide: Number,
        clsDrop: String
    },

    data: {
        mode: ['click', 'hover'],
        toggle: '- *',
        boundary: window,
        boundaryAlign: false,
        delayShow: 0,
        delayHide: 800,
        clsDrop: false,
        hoverIdle: 200,
        animation: ['uk-animation-fade'],
        cls: 'uk-open'
    },

    computed: {

        boundary: function(ref, $el) {
            var boundary = ref.boundary;

            return query(boundary, $el);
        },

        clsDrop: function(ref) {
            var clsDrop = ref.clsDrop;

            return clsDrop || ("uk-" + (this.$options.name));
        },

        clsPos: function() {
            return this.clsDrop;
        }

    },

    created: function() {
        this.tracker = new MouseTracker();
    },

    connected: function() {

        addClass(this.$el, this.clsDrop);

        var ref = this.$props;
        var toggle = ref.toggle;
        this.toggle = toggle && this.$create('toggle', query(toggle, this.$el), {
            target: this.$el,
            mode: this.mode
        });

        !this.toggle && trigger(this.$el, 'updatearia');

    },

    events: [


        {

            name: 'click',

            delegate: function() {
                return ("." + (this.clsDrop) + "-close");
            },

            handler: function(e) {
                e.preventDefault();
                this.hide(false);
            }

        },

        {

            name: 'click',

            delegate: function() {
                return 'a[href^="#"]';
            },

            handler: function(ref) {
                var defaultPrevented = ref.defaultPrevented;
                var hash = ref.current.hash;

                if (!defaultPrevented && hash && !within(hash, this.$el)) {
                    this.hide(false);
                }
            }

        },

        {

            name: 'beforescroll',

            handler: function() {
                this.hide(false);
            }

        },

        {

            name: 'toggle',

            self: true,

            handler: function(e, toggle) {

                e.preventDefault();

                if (this.isToggled()) {
                    this.hide(false);
                } else {
                    this.show(toggle, false);
                }
            }

        },

        {

            name: pointerEnter,

            filter: function() {
                return includes(this.mode, 'hover');
            },

            handler: function(e) {

                if (isTouch(e)) {
                    return;
                }

                if (active
                    && active !== this
                    && active.toggle
                    && includes(active.toggle.mode, 'hover')
                    && !within(e.target, active.toggle.$el)
                    && !pointInRect({x: e.pageX, y: e.pageY}, offset(active.$el))
                ) {
                    active.hide(false);
                }

                e.preventDefault();
                this.show(this.toggle);
            }

        },

        {

            name: 'toggleshow',

            handler: function(e, toggle) {

                if (toggle && !includes(toggle.target, this.$el)) {
                    return;
                }

                e.preventDefault();
                this.show(toggle || this.toggle);
            }

        },

        {

            name: ("togglehide " + pointerLeave),

            handler: function(e, toggle) {

                if (isTouch(e) || toggle && !includes(toggle.target, this.$el)) {
                    return;
                }

                e.preventDefault();

                if (this.toggle && includes(this.toggle.mode, 'hover')) {
                    this.hide();
                }
            }

        },

        {

            name: 'beforeshow',

            self: true,

            handler: function() {
                this.clearTimers();
                Animation.cancel(this.$el);
                this.position();
            }

        },

        {

            name: 'show',

            self: true,

            handler: function() {
                var this$1 = this;

                this.tracker.init();
                trigger(this.$el, 'updatearia');

                // If triggered from an click event handler, delay adding the click handler
                var off = delayOn(document, 'click', function (ref) {
                    var defaultPrevented = ref.defaultPrevented;
                    var target = ref.target;

                    if (!defaultPrevented && !within(target, this$1.$el) && !(this$1.toggle && within(target, this$1.toggle.$el))) {
                        this$1.hide(false);
                    }
                });

                once(this.$el, 'hide', off, {self: true});
            }

        },

        {

            name: 'beforehide',

            self: true,

            handler: function() {
                this.clearTimers();
            }

        },

        {

            name: 'hide',

            handler: function(ref) {
                var target = ref.target;


                if (this.$el !== target) {
                    active = active === null && within(target, this.$el) && this.isToggled() ? this : active;
                    return;
                }

                active = this.isActive() ? null : active;
                trigger(this.$el, 'updatearia');
                this.tracker.cancel();
            }

        },

        {

            name: 'updatearia',

            self: true,

            handler: function(e, toggle) {

                e.preventDefault();

                this.updateAria(this.$el);

                if (toggle || this.toggle) {
                    attr((toggle || this.toggle).$el, 'aria-expanded', this.isToggled());
                    toggleClass(this.toggle.$el, this.cls, this.isToggled());
                }
            }
        }

    ],

    update: {

        write: function() {

            if (this.isToggled() && !Animation.inProgress(this.$el)) {
                this.position();
            }

        },

        events: ['resize']

    },

    methods: {

        show: function(toggle, delay) {
            var this$1 = this;
            if ( delay === void 0 ) delay = true;


            var show = function () { return !this$1.isToggled() && this$1.toggleElement(this$1.$el, true); };
            var tryShow = function () {

                this$1.toggle = toggle || this$1.toggle;

                this$1.clearTimers();

                if (this$1.isActive()) {
                    return;
                } else if (delay && active && active !== this$1 && active.isDelaying) {
                    this$1.showTimer = setTimeout(this$1.show, 10);
                    return;
                } else if (this$1.isParentOf(active)) {

                    if (active.hideTimer) {
                        active.hide(false);
                    } else {
                        return;
                    }

                } else if (this$1.isChildOf(active)) {

                    active.clearTimers();

                } else if (active && !this$1.isChildOf(active) && !this$1.isParentOf(active)) {

                    var prev;
                    while (active && active !== prev && !this$1.isChildOf(active)) {
                        prev = active;
                        active.hide(false);
                    }

                }

                if (delay && this$1.delayShow) {
                    this$1.showTimer = setTimeout(show, this$1.delayShow);
                } else {
                    show();
                }

                active = this$1;
            };

            if (toggle && this.toggle && toggle.$el !== this.toggle.$el) {

                once(this.$el, 'hide', tryShow);
                this.hide(false);

            } else {
                tryShow();
            }
        },

        hide: function(delay) {
            var this$1 = this;
            if ( delay === void 0 ) delay = true;


            var hide = function () { return this$1.toggleNow(this$1.$el, false); };

            this.clearTimers();

            this.isDelaying = this.tracker.movesTo(this.$el);

            if (delay && this.isDelaying) {
                this.hideTimer = setTimeout(this.hide, this.hoverIdle);
            } else if (delay && this.delayHide) {
                this.hideTimer = setTimeout(hide, this.delayHide);
            } else {
                hide();
            }
        },

        clearTimers: function() {
            clearTimeout(this.showTimer);
            clearTimeout(this.hideTimer);
            this.showTimer = null;
            this.hideTimer = null;
            this.isDelaying = false;
        },

        isActive: function() {
            return active === this;
        },

        isChildOf: function(drop) {
            return drop && drop !== this && within(this.$el, drop.$el);
        },

        isParentOf: function(drop) {
            return drop && drop !== this && within(drop.$el, this.$el);
        },

        position: function() {

            removeClasses(this.$el, ((this.clsDrop) + "-(stack|boundary)"));
            css(this.$el, {top: '', left: '', display: 'block'});
            toggleClass(this.$el, ((this.clsDrop) + "-boundary"), this.boundaryAlign);

            var boundary = offset(this.boundary);
            var alignTo = this.boundaryAlign ? boundary : offset(this.toggle.$el);

            if (this.align === 'justify') {
                var prop = this.getAxis() === 'y' ? 'width' : 'height';
                css(this.$el, prop, alignTo[prop]);
            } else if (this.$el.offsetWidth > Math.max(boundary.right - alignTo.left, alignTo.right - boundary.left)) {
                addClass(this.$el, ((this.clsDrop) + "-stack"));
            }

            this.positionAt(this.$el, this.boundaryAlign ? this.boundary : this.toggle.$el, this.boundary);

            css(this.$el, 'display', '');

        }

    }

};

var Dropdown = {

    extends: Drop

};

var Lightbox = {

    install: install$2,

    props: {toggle: String},

    data: {toggle: 'a'},

    computed: {

        toggles: {

            get: function(ref, $el) {
                var toggle = ref.toggle;

                return $$(toggle, $el);
            },

            watch: function() {
                this.hide();
            }

        },

        items: function() {
            return uniqueBy(this.toggles.map(toItem), 'source');
        }

    },

    disconnected: function() {
        this.hide();
    },

    events: [

        {

            name: 'click',

            delegate: function() {
                return ((this.toggle) + ":not(.uk-disabled)");
            },

            handler: function(e) {
                e.preventDefault();
                var src = data(e.current, 'href');
                this.show(findIndex(this.items, function (ref) {
                    var source = ref.source;

                    return source === src;
                }));
            }

        }

    ],

    methods: {

        show: function(index) {
            var this$1 = this;


            this.panel = this.panel || this.$create('lightboxPanel', assign({}, this.$props, {items: this.items}));

            on(this.panel.$el, 'hidden', function () { return this$1.panel = false; });

            return this.panel.show(index);

        },

        hide: function() {

            return this.panel && this.panel.hide();

        }

    }

};


// search page
var FormCustom = {

    mixins: [Class],

    args: 'target',

    props: {
        target: Boolean
    },

    data: {
        target: false
    },

    computed: {

        input: function(_, $el) {
            return $(selInput, $el);
        },

        state: function() {
            return this.input.nextElementSibling;
        },

        target: function(ref, $el) {
            var target = ref.target;

            return target && (target === true
                && this.input.parentNode === $el
                && this.input.nextElementSibling
                || query(target, $el));
        }

    },

    update: function() {

        var ref = this;
        var target = ref.target;
        var input = ref.input;

        if (!target) {
            return;
        }

        var option;
        var prop = isInput(target) ? 'value' : 'textContent';
        var prev = target[prop];
        var value = input.files && input.files[0]
            ? input.files[0].name
            : matches(input, 'select') && (option = $$('option', input).filter(function (el) { return el.selected; })[0]) // eslint-disable-line prefer-destructuring
                ? option.textContent
                : input.value;

        if (prev !== value) {
            target[prop] = value;
        }

    },

    events: [

        {
            name: 'change',

            handler: function() {
                this.$emit();
            }
        },

        {
            name: 'reset',

            el: function() {
                return closest(this.$el, 'form');
            },

            handler: function() {
                this.$emit();
            }
        }

    ]

};


