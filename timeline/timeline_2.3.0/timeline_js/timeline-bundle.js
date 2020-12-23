﻿

/* band.js */
Timeline._Band = function (B, G, C) {
    if (B.autoWidth && typeof G.width == "string") {
        G.width = G.width.indexOf("%") > -1 ? 0 : parseInt(G.width);
    } this._timeline = B;
    this._bandInfo = G;
    this._index = C;
    this._locale = ("locale" in G) ? G.locale : Timeline.getDefaultLocale();
    this._timeZone = ("timeZone" in G) ? G.timeZone : 0;
    this._labeller = ("labeller" in G) ? G.labeller : (("createLabeller" in B.getUnit()) ? B.getUnit().createLabeller(this._locale, this._timeZone) : new Timeline.GregorianDateLabeller(this._locale, this._timeZone));
    this._theme = G.theme;
    this._zoomIndex = ("zoomIndex" in G) ? G.zoomIndex : 0;
    this._zoomSteps = ("zoomSteps" in G) ? G.zoomSteps : null;
    this._dragging = false;
    this._changing = false;
    this._originalScrollSpeed = 5;
    this._scrollSpeed = this._originalScrollSpeed;
    this._onScrollListeners = [];
    var A = this;
    this._syncWithBand = null;
    this._syncWithBandHandler = function (H) {
        A._onHighlightBandScroll();
    };
    this._selectorListener = function (H) {
        A._onHighlightBandScroll();
    };
    var E = this._timeline.getDocument().createElement("div");
    E.className = "timeline-band-input";
    this._timeline.addDiv(E);
    this._keyboardInput = document.createElement("input");
    this._keyboardInput.type = "text";
    E.appendChild(this._keyboardInput);
    SimileAjax.DOM.registerEventWithObject(this._keyboardInput, "keydown", this, "_onKeyDown");
    SimileAjax.DOM.registerEventWithObject(this._keyboardInput, "keyup", this, "_onKeyUp");
    this._div = this._timeline.getDocument().createElement("div");
    this._div.id = "timeline-band-" + C;
    this._div.className = "timeline-band timeline-band-" + C;
    this._timeline.addDiv(this._div);
    SimileAjax.DOM.registerEventWithObject(this._div, "mousedown", this, "_onMouseDown");
    SimileAjax.DOM.registerEventWithObject(this._div, "mousemove", this, "_onMouseMove");
    SimileAjax.DOM.registerEventWithObject(this._div, "mouseup", this, "_onMouseUp");
    SimileAjax.DOM.registerEventWithObject(this._div, "mouseout", this, "_onMouseOut");
    SimileAjax.DOM.registerEventWithObject(this._div, "dblclick", this, "_onDblClick");
    var F = this._theme != null ? this._theme.mouseWheel : "scroll";
    if (F === "zoom" || F === "scroll" || this._zoomSteps) {
        if (SimileAjax.Platform.browser.isFirefox) {
            SimileAjax.DOM.registerEventWithObject(this._div, "DOMMouseScroll", this, "_onMouseScroll");
        } else {
            SimileAjax.DOM.registerEventWithObject(this._div, "mousewheel", this, "_onMouseScroll");
        }
    } this._innerDiv = this._timeline.getDocument().createElement("div");
    this._innerDiv.className = "timeline-band-inner";
    this._div.appendChild(this._innerDiv);
    this._ether = G.ether;
    G.ether.initialize(this, B);
    this._etherPainter = G.etherPainter;
    G.etherPainter.initialize(this, B);
    this._eventSource = G.eventSource;
    if (this._eventSource) {
        this._eventListener = {
            onAddMany: function () {
                A._onAddMany();
            }, onClear: function () {
                A._onClear();
            }
        };
        this._eventSource.addListener(this._eventListener);
    } this._eventPainter = G.eventPainter;
    this._eventTracksNeeded = 0;
    this._eventTrackIncrement = 0;
    G.eventPainter.initialize(this, B);
    this._decorators = ("decorators" in G) ? G.decorators : [];
    for (var D = 0;
        D < this._decorators.length;
        D++) {
        this._decorators[D].initialize(this, B);
    }
};
Timeline._Band.SCROLL_MULTIPLES = 5;
Timeline._Band.prototype.dispose = function () {
    this.closeBubble();
    if (this._eventSource) {
        this._eventSource.removeListener(this._eventListener);
        this._eventListener = null;
        this._eventSource = null;
    } this._timeline = null;
    this._bandInfo = null;
    this._labeller = null;
    this._ether = null;
    this._etherPainter = null;
    this._eventPainter = null;
    this._decorators = null;
    this._onScrollListeners = null;
    this._syncWithBandHandler = null;
    this._selectorListener = null;
    this._div = null;
    this._innerDiv = null;
    this._keyboardInput = null;
};
Timeline._Band.prototype.addOnScrollListener = function (A) {
    this._onScrollListeners.push(A);
};
Timeline._Band.prototype.removeOnScrollListener = function (B) {
    for (var A = 0;
        A < this._onScrollListeners.length;
        A++) {
        if (this._onScrollListeners[A] == B) {
            this._onScrollListeners.splice(A, 1);
            break;
        }
    }
};
Timeline._Band.prototype.setSyncWithBand = function (B, A) {
    if (this._syncWithBand) {
        this._syncWithBand.removeOnScrollListener(this._syncWithBandHandler);
    } this._syncWithBand = B;
    this._syncWithBand.addOnScrollListener(this._syncWithBandHandler);
    this._highlight = A;
    this._positionHighlight();
};
Timeline._Band.prototype.getLocale = function () {
    return this._locale;
};
Timeline._Band.prototype.getTimeZone = function () {
    return this._timeZone;
};
Timeline._Band.prototype.getLabeller = function () {
    return this._labeller;
};
Timeline._Band.prototype.getIndex = function () {
    return this._index;
};
Timeline._Band.prototype.getEther = function () {
    return this._ether;
};
Timeline._Band.prototype.getEtherPainter = function () {
    return this._etherPainter;
};
Timeline._Band.prototype.getEventSource = function () {
    return this._eventSource;
};
Timeline._Band.prototype.getEventPainter = function () {
    return this._eventPainter;
};
Timeline._Band.prototype.getTimeline = function () {
    return this._timeline;
};
Timeline._Band.prototype.updateEventTrackInfo = function (A, B) {
    this._eventTrackIncrement = B;
    if (A > this._eventTracksNeeded) {
        this._eventTracksNeeded = A;
    }
};
Timeline._Band.prototype.checkAutoWidth = function () {
    if (!this._timeline.autoWidth) {
        return;
    } var C = this._eventPainter.getType() == "overview";
    var A = C ? this._theme.event.overviewTrack.autoWidthMargin : this._theme.event.track.autoWidthMargin;
    var B = Math.ceil((this._eventTracksNeeded + A) * this._eventTrackIncrement);
    B += C ? this._theme.event.overviewTrack.offset : this._theme.event.track.offset;
    var D = this._bandInfo;
    if (B != D.width) {
        D.width = B;
    }
};
Timeline._Band.prototype.layout = function () {
    this.paint();
};
Timeline._Band.prototype.paint = function () {
    this._etherPainter.paint();
    this._paintDecorators();
    this._paintEvents();
};
Timeline._Band.prototype.softLayout = function () {
    this.softPaint();
};
Timeline._Band.prototype.softPaint = function () {
    this._etherPainter.softPaint();
    this._softPaintDecorators();
    this._softPaintEvents();
};
Timeline._Band.prototype.setBandShiftAndWidth = function (A, D) {
    var C = this._keyboardInput.parentNode;
    var B = A + Math.floor(D / 2);
    if (this._timeline.isHorizontal()) {
        this._div.style.top = A + "px";
        this._div.style.height = D + "px";
        C.style.top = B + "px";
        C.style.left = "-1em";
    } else {
        this._div.style.left = A + "px";
        this._div.style.width = D + "px";
        C.style.left = B + "px";
        C.style.top = "-1em";
    }
};
Timeline._Band.prototype.getViewWidth = function () {
    if (this._timeline.isHorizontal()) {
        return this._div.offsetHeight;
    } else {
        return this._div.offsetWidth;
    }
};
Timeline._Band.prototype.setViewLength = function (A) {
    this._viewLength = A;
    this._recenterDiv();
    this._onChanging();
};
Timeline._Band.prototype.getViewLength = function () {
    return this._viewLength;
};
Timeline._Band.prototype.getTotalViewLength = function () {
    return Timeline._Band.SCROLL_MULTIPLES * this._viewLength;
};
Timeline._Band.prototype.getViewOffset = function () {
    return this._viewOffset;
};
Timeline._Band.prototype.getMinDate = function () {
    return this._ether.pixelOffsetToDate(this._viewOffset);
};
Timeline._Band.prototype.getMaxDate = function () {
    return this._ether.pixelOffsetToDate(this._viewOffset + Timeline._Band.SCROLL_MULTIPLES * this._viewLength);
};
Timeline._Band.prototype.getMinVisibleDate = function () {
    return this._ether.pixelOffsetToDate(0);
};
Timeline._Band.prototype.getMinVisibleDateAfterDelta = function (A) {
    return this._ether.pixelOffsetToDate(A);
};
Timeline._Band.prototype.getMaxVisibleDate = function () {
    return this._ether.pixelOffsetToDate(this._viewLength);
};
Timeline._Band.prototype.getMaxVisibleDateAfterDelta = function (A) {
    return this._ether.pixelOffsetToDate(this._viewLength + A);
};
Timeline._Band.prototype.getCenterVisibleDate = function () {
    return this._ether.pixelOffsetToDate(this._viewLength / 2);
};
Timeline._Band.prototype.setMinVisibleDate = function (A) {
    if (!this._changing) {
        this._moveEther(Math.round(-this._ether.dateToPixelOffset(A)));
    }
};
Timeline._Band.prototype.setMaxVisibleDate = function (A) {
    if (!this._changing) {
        this._moveEther(Math.round(this._viewLength - this._ether.dateToPixelOffset(A)));
    }
};
Timeline._Band.prototype.setCenterVisibleDate = function (A) {
    if (!this._changing) {
        this._moveEther(Math.round(this._viewLength / 2 - this._ether.dateToPixelOffset(A)));
    }
};
Timeline._Band.prototype.dateToPixelOffset = function (A) {
    return this._ether.dateToPixelOffset(A) - this._viewOffset;
};
Timeline._Band.prototype.pixelOffsetToDate = function (A) {
    return this._ether.pixelOffsetToDate(A + this._viewOffset);
};
Timeline._Band.prototype.createLayerDiv = function (C, A) {
    var D = this._timeline.getDocument().createElement("div");
    D.className = "timeline-band-layer" + (typeof A == "string" ? (" " + A) : "");
    D.style.zIndex = C;
    this._innerDiv.appendChild(D);
    var B = this._timeline.getDocument().createElement("div");
    B.className = "timeline-band-layer-inner";
    if (SimileAjax.Platform.browser.isIE) {
        B.style.cursor = "move";
    } else {
        B.style.cursor = "-moz-grab";
    } D.appendChild(B);
    return B;
};
Timeline._Band.prototype.removeLayerDiv = function (A) {
    this._innerDiv.removeChild(A.parentNode);
};
Timeline._Band.prototype.scrollToCenter = function (A, C) {
    var B = this._ether.dateToPixelOffset(A);
    if (B < -this._viewLength / 2) {
        this.setCenterVisibleDate(this.pixelOffsetToDate(B + this._viewLength));
    } else {
        if (B > 3 * this._viewLength / 2) {
            this.setCenterVisibleDate(this.pixelOffsetToDate(B - this._viewLength));
        }
    } this._autoScroll(Math.round(this._viewLength / 2 - this._ether.dateToPixelOffset(A)), C);
};
Timeline._Band.prototype.showBubbleForEvent = function (C) {
    var A = this.getEventSource().getEvent(C);
    if (A) {
        var B = this;
        this.scrollToCenter(A.getStart(), function () {
            B._eventPainter.showBubble(A);
        });
    }
};
Timeline._Band.prototype.zoom = function (C, A, F, E) {
    if (!this._zoomSteps) {
        return;
    } A += this._viewOffset;
    var D = this._ether.pixelOffsetToDate(A);
    var B = this._ether.zoom(C);
    this._etherPainter.zoom(B);
    this._moveEther(Math.round(-this._ether.dateToPixelOffset(D)));
    this._moveEther(A);
};
Timeline._Band.prototype._onMouseDown = function (B, A, C) {
    this.closeBubble();
    this._dragging = true;
    this._dragX = A.clientX;
    this._dragY = A.clientY;
};
Timeline._Band.prototype._onMouseMove = function (D, A, E) {
    if (this._dragging) {
        var C = A.clientX - this._dragX;
        var B = A.clientY - this._dragY;
        this._dragX = A.clientX;
        this._dragY = A.clientY;
        this._moveEther(this._timeline.isHorizontal() ? C : B);
        this._positionHighlight();
    }
};
Timeline._Band.prototype._onMouseUp = function (B, A, C) {
    this._dragging = false;
    this._keyboardInput.focus();
};
Timeline._Band.prototype._onMouseOut = function (C, B, D) {
    var A = SimileAjax.DOM.getEventRelativeCoordinates(B, C);
    A.x += this._viewOffset;
    if (A.x < 0 || A.x > C.offsetWidth || A.y < 0 || A.y > C.offsetHeight) {
        this._dragging = false;
    }
};
Timeline._Band.prototype._onMouseScroll = function (G, H, B) {
    var A = new Date();
    A = A.getTime();
    if (!this._lastScrollTime || ((A - this._lastScrollTime) > 50)) {
        this._lastScrollTime = A;
        var I = 0;
        if (H.wheelDelta) {
            I = H.wheelDelta / 120;
        } else {
            if (H.detail) {
                I = -H.detail / 3;
            }
        } var F = this._theme.mouseWheel;
        if (this._zoomSteps || F === "zoom") {
            var E = SimileAjax.DOM.getEventRelativeCoordinates(H, G);
            if (I != 0) {
                var D;
                if (I > 0) {
                    D = true;
                } if (I < 0) {
                    D = false;
                } this._timeline.zoom(D, E.x, E.y, G);
            }
        } else {
            if (F === "scroll") {
                var C = 50 * (I < 0 ? -1 : 1);
                this._moveEther(C);
            }
        }
    } if (H.stopPropagation) {
        H.stopPropagation();
    } H.cancelBubble = true;
    if (H.preventDefault) {
        H.preventDefault();
    } H.returnValue = false;
};
Timeline._Band.prototype._onDblClick = function (C, B, E) {
    var A = SimileAjax.DOM.getEventRelativeCoordinates(B, C);
    var D = A.x - (this._viewLength / 2 - this._viewOffset);
    this._autoScroll(-D);
};
Timeline._Band.prototype._onKeyDown = function (B, A, C) {
    if (!this._dragging) {
        switch (A.keyCode) {
            case 27: break;
            case 37: case 38: this._scrollSpeed = Math.min(50, Math.abs(this._scrollSpeed * 1.05));
                this._moveEther(this._scrollSpeed);
                break;
            case 39: case 40: this._scrollSpeed = -Math.min(50, Math.abs(this._scrollSpeed * 1.05));
                this._moveEther(this._scrollSpeed);
                break;
            default: return true;
        }this.closeBubble();
        SimileAjax.DOM.cancelEvent(A);
        return false;
    } return true;
};
Timeline._Band.prototype._onKeyUp = function (B, A, C) {
    if (!this._dragging) {
        this._scrollSpeed = this._originalScrollSpeed;
        switch (A.keyCode) {
            case 35: this.setCenterVisibleDate(this._eventSource.getLatestDate());
                break;
            case 36: this.setCenterVisibleDate(this._eventSource.getEarliestDate());
                break;
            case 33: this._autoScroll(this._timeline.getPixelLength());
                break;
            case 34: this._autoScroll(-this._timeline.getPixelLength());
                break;
            default: return true;
        }this.closeBubble();
        SimileAjax.DOM.cancelEvent(A);
        return false;
    } return true;
};
Timeline._Band.prototype._autoScroll = function (D, C) {
    var A = this;
    var B = SimileAjax.Graphics.createAnimation(function (E, F) {
        A._moveEther(F);
    }, 0, D, 1000, C);
    B.run();
};
Timeline._Band.prototype._moveEther = function (A) {
    this.closeBubble();
    if (!this._timeline.shiftOK(this._index, A)) {
        return;
    } this._viewOffset += A;
    this._ether.shiftPixels(-A);
    if (this._timeline.isHorizontal()) {
        this._div.style.left = this._viewOffset + "px";
    } else {
        this._div.style.top = this._viewOffset + "px";
    } if (this._viewOffset > -this._viewLength * 0.5 || this._viewOffset < -this._viewLength * (Timeline._Band.SCROLL_MULTIPLES - 1.5)) {
        this._recenterDiv();
    } else {
        this.softLayout();
    } this._onChanging();
};
Timeline._Band.prototype._onChanging = function () {
    this._changing = true;
    this._fireOnScroll();
    this._setSyncWithBandDate();
    this._changing = false;
};
Timeline._Band.prototype.busy = function () {
    return (this._changing);
};
Timeline._Band.prototype._fireOnScroll = function () {
    for (var A = 0;
        A < this._onScrollListeners.length;
        A++) {
        this._onScrollListeners[A](this);
    }
};
Timeline._Band.prototype._setSyncWithBandDate = function () {
    if (this._syncWithBand) {
        var A = this._ether.pixelOffsetToDate(this.getViewLength() / 2);
        this._syncWithBand.setCenterVisibleDate(A);
    }
};
Timeline._Band.prototype._onHighlightBandScroll = function () {
    if (this._syncWithBand) {
        var A = this._syncWithBand.getCenterVisibleDate();
        var B = this._ether.dateToPixelOffset(A);
        this._moveEther(Math.round(this._viewLength / 2 - B));
        if (this._highlight) {
            this._etherPainter.setHighlight(this._syncWithBand.getMinVisibleDate(), this._syncWithBand.getMaxVisibleDate());
        }
    }
};
Timeline._Band.prototype._onAddMany = function () {
    this._paintEvents();
};
Timeline._Band.prototype._onClear = function () {
    this._paintEvents();
};
Timeline._Band.prototype._positionHighlight = function () {
    if (this._syncWithBand) {
        var A = this._syncWithBand.getMinVisibleDate();
        var B = this._syncWithBand.getMaxVisibleDate();
        if (this._highlight) {
            this._etherPainter.setHighlight(A, B);
        }
    }
};
Timeline._Band.prototype._recenterDiv = function () {
    this._viewOffset = -this._viewLength * (Timeline._Band.SCROLL_MULTIPLES - 1) / 2;
    if (this._timeline.isHorizontal()) {
        this._div.style.left = this._viewOffset + "px";
        this._div.style.width = (Timeline._Band.SCROLL_MULTIPLES * this._viewLength) + "px";
    } else {
        this._div.style.top = this._viewOffset + "px";
        this._div.style.height = (Timeline._Band.SCROLL_MULTIPLES * this._viewLength) + "px";
    } this.layout();
};
Timeline._Band.prototype._paintEvents = function () {
    this._eventPainter.paint();
};
Timeline._Band.prototype._softPaintEvents = function () {
    this._eventPainter.softPaint();
};
Timeline._Band.prototype._paintDecorators = function () {
    for (var A = 0;
        A < this._decorators.length;
        A++) {
        this._decorators[A].paint();
    }
};
Timeline._Band.prototype._softPaintDecorators = function () {
    for (var A = 0;
        A < this._decorators.length;
        A++) {
        this._decorators[A].softPaint();
    }
};
Timeline._Band.prototype.closeBubble = function () {
    SimileAjax.WindowManager.cancelPopups();
};


/* compact-painter.js */
Timeline.CompactEventPainter = function (A) {
    this._params = A;
    this._onSelectListeners = [];
    this._filterMatcher = null;
    this._highlightMatcher = null;
    this._frc = null;
    this._eventIdToElmt = {};
};
Timeline.CompactEventPainter.prototype.initialize = function (B, A) {
    this._band = B;
    this._timeline = A;
    this._backLayer = null;
    this._eventLayer = null;
    this._lineLayer = null;
    this._highlightLayer = null;
    this._eventIdToElmt = null;
};
Timeline.CompactEventPainter.prototype.addOnSelectListener = function (A) {
    this._onSelectListeners.push(A);
};
Timeline.CompactEventPainter.prototype.removeOnSelectListener = function (B) {
    for (var A = 0;
        A < this._onSelectListeners.length;
        A++) {
        if (this._onSelectListeners[A] == B) {
            this._onSelectListeners.splice(A, 1);
            break;
        }
    }
};
Timeline.CompactEventPainter.prototype.getFilterMatcher = function () {
    return this._filterMatcher;
};
Timeline.CompactEventPainter.prototype.setFilterMatcher = function (A) {
    this._filterMatcher = A;
};
Timeline.CompactEventPainter.prototype.getHighlightMatcher = function () {
    return this._highlightMatcher;
};
Timeline.CompactEventPainter.prototype.setHighlightMatcher = function (A) {
    this._highlightMatcher = A;
};
Timeline.CompactEventPainter.prototype.paint = function () {
    var N = this._band.getEventSource();
    if (N == null) {
        return;
    } this._eventIdToElmt = {};
    this._prepareForPainting();
    var O = this._params.theme;
    var L = O.event;
    var G = { trackOffset: "trackOffset" in this._params ? this._params.trackOffset : 10, trackHeight: "trackHeight" in this._params ? this._params.trackHeight : 10, tapeHeight: O.event.tape.height, tapeBottomMargin: "tapeBottomMargin" in this._params ? this._params.tapeBottomMargin : 2, labelBottomMargin: "labelBottomMargin" in this._params ? this._params.labelBottomMargin : 5, labelRightMargin: "labelRightMargin" in this._params ? this._params.labelRightMargin : 5, defaultIcon: L.instant.icon, defaultIconWidth: L.instant.iconWidth, defaultIconHeight: L.instant.iconHeight, customIconWidth: "iconWidth" in this._params ? this._params.iconWidth : L.instant.iconWidth, customIconHeight: "iconHeight" in this._params ? this._params.iconHeight : L.instant.iconHeight, iconLabelGap: "iconLabelGap" in this._params ? this._params.iconLabelGap : 2, iconBottomMargin: "iconBottomMargin" in this._params ? this._params.iconBottomMargin : 2 };
    if ("compositeIcon" in this._params) {
        G.compositeIcon = this._params.compositeIcon;
        G.compositeIconWidth = this._params.compositeIconWidth || G.customIconWidth;
        G.compositeIconHeight = this._params.compositeIconHeight || G.customIconHeight;
    } else {
        G.compositeIcon = G.defaultIcon;
        G.compositeIconWidth = G.defaultIconWidth;
        G.compositeIconHeight = G.defaultIconHeight;
    } G.defaultStackIcon = "icon" in this._params.stackConcurrentPreciseInstantEvents ? this._params.stackConcurrentPreciseInstantEvents.icon : G.defaultIcon;
    G.defaultStackIconWidth = "iconWidth" in this._params.stackConcurrentPreciseInstantEvents ? this._params.stackConcurrentPreciseInstantEvents.iconWidth : G.defaultIconWidth;
    G.defaultStackIconHeight = "iconHeight" in this._params.stackConcurrentPreciseInstantEvents ? this._params.stackConcurrentPreciseInstantEvents.iconHeight : G.defaultIconHeight;
    var B = this._band.getMinDate();
    var D = this._band.getMaxDate();
    var R = (this._filterMatcher != null) ? this._filterMatcher : function (S) {
        return true;
    };
    var Q = (this._highlightMatcher != null) ? this._highlightMatcher : function (S) {
        return -1;
    };
    var F = N.getEventIterator(B, D);
    var H = "stackConcurrentPreciseInstantEvents" in this._params && typeof this._params.stackConcurrentPreciseInstantEvents == "object";
    var P = "collapseConcurrentPreciseInstantEvents" in this._params && this._params.collapseConcurrentPreciseInstantEvents;
    if (P || H) {
        var M = [];
        var A = null;
        while (F.hasNext()) {
            var E = F.next();
            if (R(E)) {
                if (!E.isInstant() || E.isImprecise()) {
                    this.paintEvent(E, G, this._params.theme, Q(E));
                } else {
                    if (A != null && A.getStart().getTime() == E.getStart().getTime()) {
                        M[M.length - 1].push(E);
                    } else {
                        M.push([E]);
                        A = E;
                    }
                }
            }
        } for (var J = 0;
            J < M.length;
            J++) {
            var K = M[J];
            if (K.length == 1) {
                this.paintEvent(K[0], G, this._params.theme, Q(E));
            } else {
                var C = -1;
                for (var I = 0;
                    C < 0 && I < K.length;
                    I++) {
                    C = Q(K[I]);
                } if (H) {
                    this.paintStackedPreciseInstantEvents(K, G, this._params.theme, C);
                } else {
                    this.paintCompositePreciseInstantEvents(K, G, this._params.theme, C);
                }
            }
        }
    } else {
        while (F.hasNext()) {
            var E = F.next();
            if (R(E)) {
                this.paintEvent(E, G, this._params.theme, Q(E));
            }
        }
    } this._highlightLayer.style.display = "block";
    this._lineLayer.style.display = "block";
    this._eventLayer.style.display = "block";
};
Timeline.CompactEventPainter.prototype.softPaint = function () { };
Timeline.CompactEventPainter.prototype._prepareForPainting = function () {
    var B = this._band;
    if (this._backLayer == null) {
        this._backLayer = this._band.createLayerDiv(0, "timeline-band-events");
        this._backLayer.style.visibility = "hidden";
        var A = document.createElement("span");
        A.className = "timeline-event-label";
        this._backLayer.appendChild(A);
        this._frc = SimileAjax.Graphics.getFontRenderingContext(A);
    } this._frc.update();
    this._tracks = [];
    if (this._highlightLayer != null) {
        B.removeLayerDiv(this._highlightLayer);
    } this._highlightLayer = B.createLayerDiv(105, "timeline-band-highlights");
    this._highlightLayer.style.display = "none";
    if (this._lineLayer != null) {
        B.removeLayerDiv(this._lineLayer);
    } this._lineLayer = B.createLayerDiv(110, "timeline-band-lines");
    this._lineLayer.style.display = "none";
    if (this._eventLayer != null) {
        B.removeLayerDiv(this._eventLayer);
    } this._eventLayer = B.createLayerDiv(115, "timeline-band-events");
    this._eventLayer.style.display = "none";
};
Timeline.CompactEventPainter.prototype.paintEvent = function (B, C, D, A) {
    if (B.isInstant()) {
        this.paintInstantEvent(B, C, D, A);
    } else {
        this.paintDurationEvent(B, C, D, A);
    }
};
Timeline.CompactEventPainter.prototype.paintInstantEvent = function (B, C, D, A) {
    if (B.isImprecise()) {
        this.paintImpreciseInstantEvent(B, C, D, A);
    } else {
        this.paintPreciseInstantEvent(B, C, D, A);
    }
};
Timeline.CompactEventPainter.prototype.paintDurationEvent = function (B, C, D, A) {
    if (B.isImprecise()) {
        this.paintImpreciseDurationEvent(B, C, D, A);
    } else {
        this.paintPreciseDurationEvent(B, C, D, A);
    }
};
Timeline.CompactEventPainter.prototype.paintPreciseInstantEvent = function (H, F, B, A) {
    var C = { tooltip: H.getProperty("tooltip") || H.getText() };
    var E = { url: H.getIcon() };
    if (E.url == null) {
        E.url = F.defaultIcon;
        E.width = F.defaultIconWidth;
        E.height = F.defaultIconHeight;
        E.className = "timeline-event-icon-default";
    } else {
        E.width = H.getProperty("iconWidth") || F.customIconWidth;
        E.height = H.getProperty("iconHeight") || F.customIconHeight;
    } var J = { text: H.getText(), color: H.getTextColor() || H.getColor(), className: H.getClassName() };
    var G = this.paintTapeIconLabel(H.getStart(), C, null, E, J, F, B, A);
    var I = this;
    var D = function (L, K, M) {
        return I._onClickInstantEvent(G.iconElmtData.elmt, K, H);
    };
    SimileAjax.DOM.registerEvent(G.iconElmtData.elmt, "mousedown", D);
    SimileAjax.DOM.registerEvent(G.labelElmtData.elmt, "mousedown", D);
    this._eventIdToElmt[H.getID()] = G.iconElmtData.elmt;
};
Timeline.CompactEventPainter.prototype.paintCompositePreciseInstantEvents = function (J, H, D, B) {
    var K = J[0];
    var A = [];
    for (var C = 0;
        C < J.length;
        C++) {
        A.push(J[C].getProperty("tooltip") || J[C].getText());
    } var E = { tooltip: A.join("; ") };
    var G = { url: H.compositeIcon, width: H.compositeIconWidth, height: H.compositeIconHeight, className: "timeline-event-icon-composite" };
    var M = { text: String.substitute(this._params.compositeEventLabelTemplate, [J.length]) };
    var I = this.paintTapeIconLabel(K.getStart(), E, null, G, M, H, D, B);
    var L = this;
    var F = function (O, N, P) {
        return L._onClickMultiplePreciseInstantEvent(I.iconElmtData.elmt, N, J);
    };
    SimileAjax.DOM.registerEvent(I.iconElmtData.elmt, "mousedown", F);
    SimileAjax.DOM.registerEvent(I.labelElmtData.elmt, "mousedown", F);
    for (var C = 0;
        C < J.length;
        C++) {
        this._eventIdToElmt[J[C].getID()] = I.iconElmtData.elmt;
    }
};
Timeline.CompactEventPainter.prototype.paintStackedPreciseInstantEvents = function (T, j, c, E) {
    var S = "limit" in this._params.stackConcurrentPreciseInstantEvents ? this._params.stackConcurrentPreciseInstantEvents.limit : 10;
    var G = "moreMessageTemplate" in this._params.stackConcurrentPreciseInstantEvents ? this._params.stackConcurrentPreciseInstantEvents.moreMessageTemplate : "%0 More Events";
    var Q = S <= T.length - 2;
    var B = this._band;
    var L = function (i) {
        return Math.round(B.dateToPixelOffset(i));
    };
    var O = function (i) {
        var r = { url: i.getIcon() };
        if (r.url == null) {
            r.url = j.defaultStackIcon;
            r.width = j.defaultStackIconWidth;
            r.height = j.defaultStackIconHeight;
            r.className = "timeline-event-icon-stack timeline-event-icon-default";
        } else {
            r.width = i.getProperty("iconWidth") || j.customIconWidth;
            r.height = i.getProperty("iconHeight") || j.customIconHeight;
            r.className = "timeline-event-icon-stack";
        } return r;
    };
    var C = O(T[0]);
    var V = 5;
    var D = 0;
    var g = 0;
    var p = 0;
    var U = 0;
    var l = [];
    for (var n = 0;
        n < T.length && (!Q || n < S);
        n++) {
        var b = T[n];
        var a = b.getText();
        var X = O(b);
        var W = this._frc.computeSize(a);
        var K = { text: a, iconData: X, labelSize: W, iconLeft: C.width + n * V - X.width };
        K.labelLeft = C.width + n * V + j.iconLabelGap;
        K.top = p;
        l.push(K);
        D = Math.min(D, K.iconLeft);
        p += W.height;
        g = Math.max(g, K.labelLeft + W.width);
        U = Math.max(U, K.top + X.height);
    } if (Q) {
        var e = String.substitute(G, [T.length - S]);
        var H = this._frc.computeSize(e);
        var J = C.width + (S - 1) * V + j.iconLabelGap;
        var m = p;
        p += H.height;
        g = Math.max(g, J + H.width);
    } g += j.labelRightMargin;
    p += j.labelBottomMargin;
    U += j.iconBottomMargin;
    var F = L(T[0].getStart());
    var Y = [];
    var N = Math.ceil(Math.max(U, p) / j.trackHeight);
    var M = C.width + (T.length - 1) * V;
    for (var n = 0;
        n < N;
        n++) {
        Y.push({ start: D, end: M });
    } var f = Math.ceil(p / j.trackHeight);
    for (var n = 0;
        n < f;
        n++) {
        var P = Y[n];
        P.end = Math.max(P.end, g);
    } var k = this._fitTracks(F, Y);
    var Z = k * j.trackHeight + j.trackOffset;
    var q = this._timeline.getDocument().createElement("div");
    q.className = "timeline-event-icon-stack";
    q.style.position = "absolute";
    q.style.overflow = "visible";
    q.style.left = F + "px";
    q.style.top = Z + "px";
    q.style.width = M + "px";
    q.style.height = U + "px";
    q.innerHTML = "<div style='position: relative'></div>";
    this._eventLayer.appendChild(q);
    var I = this;
    var R = function (r) {
        try {
            var w = parseInt(this.getAttribute("index"));
            var u = q.firstChild.childNodes;
            for (var s = 0;
                s < u.length;
                s++) {
                var v = u[s];
                if (s == w) {
                    v.style.zIndex = u.length;
                } else {
                    v.style.zIndex = u.length - s;
                }
            }
        } catch (t) { }
    };
    var d = function (u) {
        var w = l[u];
        var r = T[u];
        var i = r.getProperty("tooltip") || r.getText();
        var v = I._paintEventLabel({ tooltip: i }, { text: w.text }, F + w.labelLeft, Z + w.top, w.labelSize.width, w.labelSize.height, c);
        v.elmt.setAttribute("index", u);
        v.elmt.onmouseover = R;
        var t = SimileAjax.Graphics.createTranslucentImage(w.iconData.url);
        var s = I._timeline.getDocument().createElement("div");
        s.className = "timeline-event-icon" + ("className" in w.iconData ? (" " + w.iconData.className) : "");
        s.style.left = w.iconLeft + "px";
        s.style.top = w.top + "px";
        s.style.zIndex = (l.length - u);
        s.appendChild(t);
        s.setAttribute("index", u);
        s.onmouseover = R;
        q.firstChild.appendChild(s);
        var x = function (z, y, AA) {
            return I._onClickInstantEvent(v.elmt, y, r);
        };
        SimileAjax.DOM.registerEvent(s, "mousedown", x);
        SimileAjax.DOM.registerEvent(v.elmt, "mousedown", x);
        I._eventIdToElmt[r.getID()] = s;
    };
    for (var n = 0;
        n < l.length;
        n++) {
        d(n);
    } if (Q) {
        var o = T.slice(S);
        var A = this._paintEventLabel({ tooltip: e }, { text: e }, F + J, Z + m, H.width, H.height, c);
        var h = function (r, i, s) {
            return I._onClickMultiplePreciseInstantEvent(A.elmt, i, o);
        };
        SimileAjax.DOM.registerEvent(A.elmt, "mousedown", h);
        for (var n = 0;
            n < o.length;
            n++) {
            this._eventIdToElmt[o[n].getID()] = A.elmt;
        }
    }
};
Timeline.CompactEventPainter.prototype.paintImpreciseInstantEvent = function (I, G, B, A) {
    var C = { tooltip: I.getProperty("tooltip") || I.getText() };
    var E = { start: I.getStart(), end: I.getEnd(), latestStart: I.getLatestStart(), earliestEnd: I.getEarliestEnd(), isInstant: true };
    var F = { url: I.getIcon() };
    if (F.url == null) {
        F = null;
    } else {
        F.width = I.getProperty("iconWidth") || G.customIconWidth;
        F.height = I.getProperty("iconHeight") || G.customIconHeight;
    } var K = { text: I.getText(), color: I.getTextColor() || I.getColor(), className: I.getClassName() };
    var H = this.paintTapeIconLabel(I.getStart(), C, E, F, K, G, B, A);
    var J = this;
    var D = F != null ? function (M, L, N) {
        return J._onClickInstantEvent(H.iconElmtData.elmt, L, I);
    } : function (M, L, N) {
        return J._onClickInstantEvent(H.labelElmtData.elmt, L, I);
    };
    SimileAjax.DOM.registerEvent(H.labelElmtData.elmt, "mousedown", D);
    SimileAjax.DOM.registerEvent(H.impreciseTapeElmtData.elmt, "mousedown", D);
    if (F != null) {
        SimileAjax.DOM.registerEvent(H.iconElmtData.elmt, "mousedown", D);
        this._eventIdToElmt[I.getID()] = H.iconElmtData.elmt;
    } else {
        this._eventIdToElmt[I.getID()] = H.labelElmtData.elmt;
    }
};
Timeline.CompactEventPainter.prototype.paintPreciseDurationEvent = function (I, G, B, A) {
    var C = { tooltip: I.getProperty("tooltip") || I.getText() };
    var E = { start: I.getStart(), end: I.getEnd(), isInstant: false };
    var F = { url: I.getIcon() };
    if (F.url == null) {
        F = null;
    } else {
        F.width = I.getProperty("iconWidth") || G.customIconWidth;
        F.height = I.getProperty("iconHeight") || G.customIconHeight;
    } var K = { text: I.getText(), color: I.getTextColor() || I.getColor(), className: I.getClassName() };
    var H = this.paintTapeIconLabel(I.getLatestStart(), C, E, F, K, G, B, A);
    var J = this;
    var D = F != null ? function (M, L, N) {
        return J._onClickInstantEvent(H.iconElmtData.elmt, L, I);
    } : function (M, L, N) {
        return J._onClickInstantEvent(H.labelElmtData.elmt, L, I);
    };
    SimileAjax.DOM.registerEvent(H.labelElmtData.elmt, "mousedown", D);
    SimileAjax.DOM.registerEvent(H.tapeElmtData.elmt, "mousedown", D);
    if (F != null) {
        SimileAjax.DOM.registerEvent(H.iconElmtData.elmt, "mousedown", D);
        this._eventIdToElmt[I.getID()] = H.iconElmtData.elmt;
    } else {
        this._eventIdToElmt[I.getID()] = H.labelElmtData.elmt;
    }
};
Timeline.CompactEventPainter.prototype.paintImpreciseDurationEvent = function (I, G, B, A) {
    var C = { tooltip: I.getProperty("tooltip") || I.getText() };
    var E = { start: I.getStart(), end: I.getEnd(), latestStart: I.getLatestStart(), earliestEnd: I.getEarliestEnd(), isInstant: false };
    var F = { url: I.getIcon() };
    if (F.url == null) {
        F = null;
    } else {
        F.width = I.getProperty("iconWidth") || G.customIconWidth;
        F.height = I.getProperty("iconHeight") || G.customIconHeight;
    } var K = { text: I.getText(), color: I.getTextColor() || I.getColor(), className: I.getClassName() };
    var H = this.paintTapeIconLabel(I.getLatestStart(), C, E, F, K, G, B, A);
    var J = this;
    var D = F != null ? function (M, L, N) {
        return J._onClickInstantEvent(H.iconElmtData.elmt, L, I);
    } : function (M, L, N) {
        return J._onClickInstantEvent(H.labelElmtData.elmt, L, I);
    };
    SimileAjax.DOM.registerEvent(H.labelElmtData.elmt, "mousedown", D);
    SimileAjax.DOM.registerEvent(H.tapeElmtData.elmt, "mousedown", D);
    if (F != null) {
        SimileAjax.DOM.registerEvent(H.iconElmtData.elmt, "mousedown", D);
        this._eventIdToElmt[I.getID()] = H.iconElmtData.elmt;
    } else {
        this._eventIdToElmt[I.getID()] = H.labelElmtData.elmt;
    }
};
Timeline.CompactEventPainter.prototype.paintTapeIconLabel = function (V, O, S, I, a, X, c, Z) {
    var R = this._band;
    var F = function (e) {
        return Math.round(R.dateToPixelOffset(e));
    };
    var d = F(V);
    var W = [];
    var b = 0;
    var B = 0;
    var C = 0;
    if (S != null) {
        b = X.tapeHeight + X.tapeBottomMargin;
        B = Math.ceil(X.tapeHeight / X.trackHeight);
        var A = F(S.end) - d;
        var L = F(S.start) - d;
        for (var Q = 0;
            Q < B;
            Q++) {
            W.push({ start: L, end: A });
        } C = X.trackHeight - (b % X.tapeHeight);
    } var N = 0;
    var U = 0;
    if (I != null) {
        if ("iconAlign" in I && I.iconAlign == "center") {
            N = -Math.floor(I.width / 2);
        } U = N + I.width + X.iconLabelGap;
        if (B > 0) {
            W[B - 1].end = Math.max(W[B - 1].end, U);
        } var E = I.height + X.iconBottomMargin + C;
        while (E > 0) {
            W.push({ start: N, end: U });
            E -= X.trackHeight;
        }
    } var P = a.text;
    var H = this._frc.computeSize(P);
    var M = H.height + X.labelBottomMargin + C;
    var J = U + H.width + X.labelRightMargin;
    if (B > 0) {
        W[B - 1].end = Math.max(W[B - 1].end, J);
    } for (var Y = 0;
        M > 0;
        Y++) {
        if (B + Y < W.length) {
            var T = W[B + Y];
            T.end = J;
        } else {
            W.push({ start: 0, end: J });
        } M -= X.trackHeight;
    } var G = this._fitTracks(d, W);
    var K = G * X.trackHeight + X.trackOffset;
    var D = {};
    D.labelElmtData = this._paintEventLabel(O, a, d + U, K + b, H.width, H.height, c);
    if (S != null) {
        if ("latestStart" in S || "earliestEnd" in S) {
            D.impreciseTapeElmtData = this._paintEventTape(O, S, X.tapeHeight, K, F(S.start), F(S.end), c.event.duration.impreciseColor, c.event.duration.impreciseOpacity, X, c);
        } if (!S.isInstant && "start" in S && "end" in S) {
            D.tapeElmtData = this._paintEventTape(O, S, X.tapeHeight, K, d, F("earliestEnd" in S ? S.earliestEnd : S.end), S.color, 100, X, c);
        }
    } if (I != null) {
        D.iconElmtData = this._paintEventIcon(O, I, K + b, d + N, X, c);
    } return D;
};
Timeline.CompactEventPainter.prototype._fitTracks = function (F, C) {
    var H;
    for (H = 0;
        H < this._tracks.length;
        H++) {
        var E = true;
        for (var B = 0;
            B < C.length && (H + B) < this._tracks.length;
            B++) {
            var G = this._tracks[H + B];
            var A = C[B];
            if (F + A.start < G) {
                E = false;
                break;
            }
        } if (E) {
            break;
        }
    } for (var D = 0;
        D < C.length;
        D++) {
        this._tracks[H + D] = F + C[D].end;
    } return H;
};
Timeline.CompactEventPainter.prototype._paintEventIcon = function (C, D, H, G, E, F) {
    var B = SimileAjax.Graphics.createTranslucentImage(D.url);
    var A = this._timeline.getDocument().createElement("div");
    A.className = "timeline-event-icon" + ("className" in D ? (" " + D.className) : "");
    A.style.left = G + "px";
    A.style.top = H + "px";
    A.appendChild(B);
    if ("tooltip" in C && typeof C.tooltip == "string") {
        A.title = C.tooltip;
    } this._eventLayer.appendChild(A);
    return { left: G, top: H, width: E.iconWidth, height: E.iconHeight, elmt: A };
};
Timeline.CompactEventPainter.prototype._paintEventLabel = function (E, I, C, F, A, G, D) {
    var H = this._timeline.getDocument();
    var B = H.createElement("div");
    B.className = "timeline-event-label";
    B.style.left = C + "px";
    B.style.width = (A + 1) + "px";
    B.style.top = F + "px";
    B.innerHTML = I.text;
    if ("tooltip" in E && typeof E.tooltip == "string") {
        B.title = E.tooltip;
    } if ("color" in I && typeof I.color == "string") {
        B.style.color = I.color;
    } if ("className" in I && typeof I.className == "string") {
        B.className += " " + I.className;
    } this._eventLayer.appendChild(B);
    return { left: C, top: F, width: A, height: G, elmt: B };
};
Timeline.CompactEventPainter.prototype._paintEventTape = function (G, H, K, J, D, A, E, C, I, F) {
    var B = A - D;
    var L = this._timeline.getDocument().createElement("div");
    L.className = "timeline-event-tape";
    L.style.left = D + "px";
    L.style.top = J + "px";
    L.style.width = B + "px";
    L.style.height = K + "px";
    if ("tooltip" in G && typeof G.tooltip == "string") {
        L.title = G.tooltip;
    } if (E != null && typeof H.color == "string") {
        L.style.backgroundColor = E;
    } if ("backgroundImage" in H && typeof H.backgroundImage == "string") {
        L.style.backgroundImage = "url(" + backgroundImage + ")";
        L.style.backgroundRepeat = ("backgroundRepeat" in H && typeof H.backgroundRepeat == "string") ? H.backgroundRepeat : "repeat";
    } SimileAjax.Graphics.setOpacity(L, C);
    if ("className" in H && typeof H.className == "string") {
        L.className += " " + H.className;
    } this._eventLayer.appendChild(L);
    return { left: D, top: J, width: B, height: K, elmt: L };
};
Timeline.CompactEventPainter.prototype._createHighlightDiv = function (A, C, E) {
    if (A >= 0) {
        var D = this._timeline.getDocument();
        var G = E.event;
        var B = G.highlightColors[Math.min(A, G.highlightColors.length - 1)];
        var F = D.createElement("div");
        F.style.position = "absolute";
        F.style.overflow = "hidden";
        F.style.left = (C.left - 2) + "px";
        F.style.width = (C.width + 4) + "px";
        F.style.top = (C.top - 2) + "px";
        F.style.height = (C.height + 4) + "px";
        this._highlightLayer.appendChild(F);
    }
};
Timeline.CompactEventPainter.prototype._onClickMultiplePreciseInstantEvent = function (E, A, B) {
    var F = SimileAjax.DOM.getPageCoordinates(E);
    this._showBubble(F.left + Math.ceil(E.offsetWidth / 2), F.top + Math.ceil(E.offsetHeight / 2), B);
    var D = [];
    for (var C = 0;
        C < B.length;
        C++) {
        D.push(B[C].getID());
    } this._fireOnSelect(D);
    A.cancelBubble = true;
    SimileAjax.DOM.cancelEvent(A);
    return false;
};
Timeline.CompactEventPainter.prototype._onClickInstantEvent = function (C, A, B) {
    var D = SimileAjax.DOM.getPageCoordinates(C);
    this._showBubble(D.left + Math.ceil(C.offsetWidth / 2), D.top + Math.ceil(C.offsetHeight / 2), [B]);
    this._fireOnSelect([B.getID()]);
    A.cancelBubble = true;
    SimileAjax.DOM.cancelEvent(A);
    return false;
};
Timeline.CompactEventPainter.prototype._onClickDurationEvent = function (F, B, C) {
    if ("pageX" in B) {
        var A = B.pageX;
        var E = B.pageY;
    } else {
        var D = SimileAjax.DOM.getPageCoordinates(F);
        var A = B.offsetX + D.left;
        var E = B.offsetY + D.top;
    } this._showBubble(A, E, [C]);
    this._fireOnSelect([C.getID()]);
    B.cancelBubble = true;
    SimileAjax.DOM.cancelEvent(B);
    return false;
};
Timeline.CompactEventPainter.prototype.showBubble = function (A) {
    var B = this._eventIdToElmt[A.getID()];
    if (B) {
        var C = SimileAjax.DOM.getPageCoordinates(B);
        this._showBubble(C.left + B.offsetWidth / 2, C.top + B.offsetHeight / 2, [A]);
    }
};
Timeline.CompactEventPainter.prototype._showBubble = function (A, F, B) {
    var E = document.createElement("div");
    B = ("fillInfoBubble" in B) ? [B] : B;
    for (var D = 0;
        D < B.length;
        D++) {
        var C = document.createElement("div");
        E.appendChild(C);
        B[D].fillInfoBubble(C, this._params.theme, this._band.getLabeller());
    } SimileAjax.WindowManager.cancelPopups();
    SimileAjax.Graphics.createBubbleForContentAndPoint(E, A, F, this._params.theme.event.bubble.width);
};
Timeline.CompactEventPainter.prototype._fireOnSelect = function (B) {
    for (var A = 0;
        A < this._onSelectListeners.length;
        A++) {
        this._onSelectListeners[A](B);
    }
};


/* decorators.js */
Timeline.SpanHighlightDecorator = function (A) {
    this._unit = A.unit != null ? A.unit : SimileAjax.NativeDateUnit;
    this._startDate = (typeof A.startDate == "string") ? this._unit.parseFromObject(A.startDate) : A.startDate;
    this._endDate = (typeof A.endDate == "string") ? this._unit.parseFromObject(A.endDate) : A.endDate;
    this._startLabel = A.startLabel != null ? A.startLabel : "";
    this._endLabel = A.endLabel != null ? A.endLabel : "";
    this._color = A.color;
    this._cssClass = A.cssClass != null ? A.cssClass : null;
    this._opacity = A.opacity != null ? A.opacity : 100;
    this._zIndex = (A.inFront != null && A.inFront) ? 113 : 10;
};
Timeline.SpanHighlightDecorator.prototype.initialize = function (B, A) {
    this._band = B;
    this._timeline = A;
    this._layerDiv = null;
};
Timeline.SpanHighlightDecorator.prototype.paint = function () {
    if (this._layerDiv != null) {
        this._band.removeLayerDiv(this._layerDiv);
    } this._layerDiv = this._band.createLayerDiv(this._zIndex);
    this._layerDiv.setAttribute("name", "span-highlight-decorator");
    this._layerDiv.style.display = "none";
    var E = this._band.getMinDate();
    var A = this._band.getMaxDate();
    if (this._unit.compare(this._startDate, A) < 0 && this._unit.compare(this._endDate, E) > 0) {
        E = this._unit.later(E, this._startDate);
        A = this._unit.earlier(A, this._endDate);
        var F = this._band.dateToPixelOffset(E);
        var I = this._band.dateToPixelOffset(A);
        var H = this._timeline.getDocument();
        var K = function () {
            var L = H.createElement("table");
            L.insertRow(0).insertCell(0);
            return L;
        };
        var B = H.createElement("div");
        B.className = "timeline-highlight-decorator";
        if (this._cssClass) {
            B.className += " " + this._cssClass;
        } if (this._color != null) {
            B.style.backgroundColor = this._color;
        } if (this._opacity < 100) {
            SimileAjax.Graphics.setOpacity(B, this._opacity);
        } this._layerDiv.appendChild(B);
        var J = K();
        J.className = "timeline-highlight-label timeline-highlight-label-start";
        var C = J.rows[0].cells[0];
        C.innerHTML = this._startLabel;
        if (this._cssClass) {
            C.className = "label_" + this._cssClass;
        } this._layerDiv.appendChild(J);
        var G = K();
        G.className = "timeline-highlight-label timeline-highlight-label-end";
        var D = G.rows[0].cells[0];
        D.innerHTML = this._endLabel;
        if (this._cssClass) {
            D.className = "label_" + this._cssClass;
        } this._layerDiv.appendChild(G);
        if (this._timeline.isHorizontal()) {
            B.style.left = F + "px";
            B.style.width = (I - F) + "px";
            J.style.right = (this._band.getTotalViewLength() - F) + "px";
            J.style.width = (this._startLabel.length) + "em";
            G.style.left = I + "px";
            G.style.width = (this._endLabel.length) + "em";
        } else {
            B.style.top = F + "px";
            B.style.height = (I - F) + "px";
            J.style.bottom = F + "px";
            J.style.height = "1.5px";
            G.style.top = I + "px";
            G.style.height = "1.5px";
        }
    } this._layerDiv.style.display = "block";
};
Timeline.SpanHighlightDecorator.prototype.softPaint = function () { };
Timeline.PointHighlightDecorator = function (A) {
    this._unit = A.unit != null ? A.unit : SimileAjax.NativeDateUnit;
    this._date = (typeof A.date == "string") ? this._unit.parseFromObject(A.date) : A.date;
    this._width = A.width != null ? A.width : 10;
    this._color = A.color;
    this._cssClass = A.cssClass != null ? A.cssClass : "";
    this._opacity = A.opacity != null ? A.opacity : 100;
};
Timeline.PointHighlightDecorator.prototype.initialize = function (B, A) {
    this._band = B;
    this._timeline = A;
    this._layerDiv = null;
};
Timeline.PointHighlightDecorator.prototype.paint = function () {
    if (this._layerDiv != null) {
        this._band.removeLayerDiv(this._layerDiv);
    } this._layerDiv = this._band.createLayerDiv(10);
    this._layerDiv.setAttribute("name", "span-highlight-decorator");
    this._layerDiv.style.display = "none";
    var C = this._band.getMinDate();
    var E = this._band.getMaxDate();
    if (this._unit.compare(this._date, E) < 0 && this._unit.compare(this._date, C) > 0) {
        var A = this._band.dateToPixelOffset(this._date);
        var B = A - Math.round(this._width / 2);
        var D = this._timeline.getDocument();
        var F = D.createElement("div");
        F.className = "timeline-highlight-point-decorator";
        F.className += " " + this._cssClass;
        if (this._color != null) {
            F.style.backgroundColor = this._color;
        } if (this._opacity < 100) {
            SimileAjax.Graphics.setOpacity(F, this._opacity);
        } this._layerDiv.appendChild(F);
        if (this._timeline.isHorizontal()) {
            F.style.left = B + "px";
            F.style.width = this._width;
        } else {
            F.style.top = B + "px";
            F.style.height = this._width;
        }
    } this._layerDiv.style.display = "block";
};
Timeline.PointHighlightDecorator.prototype.softPaint = function () { };


/* detailed-painter.js */
Timeline.DetailedEventPainter = function (A) {
    this._params = A;
    this._onSelectListeners = [];
    this._filterMatcher = null;
    this._highlightMatcher = null;
    this._frc = null;
    this._eventIdToElmt = {};
};
Timeline.DetailedEventPainter.prototype.initialize = function (B, A) {
    this._band = B;
    this._timeline = A;
    this._backLayer = null;
    this._eventLayer = null;
    this._lineLayer = null;
    this._highlightLayer = null;
    this._eventIdToElmt = null;
};
Timeline.DetailedEventPainter.prototype.getType = function () {
    return "detailed";
};
Timeline.DetailedEventPainter.prototype.addOnSelectListener = function (A) {
    this._onSelectListeners.push(A);
};
Timeline.DetailedEventPainter.prototype.removeOnSelectListener = function (B) {
    for (var A = 0;
        A < this._onSelectListeners.length;
        A++) {
        if (this._onSelectListeners[A] == B) {
            this._onSelectListeners.splice(A, 1);
            break;
        }
    }
};
Timeline.DetailedEventPainter.prototype.getFilterMatcher = function () {
    return this._filterMatcher;
};
Timeline.DetailedEventPainter.prototype.setFilterMatcher = function (A) {
    this._filterMatcher = A;
};
Timeline.DetailedEventPainter.prototype.getHighlightMatcher = function () {
    return this._highlightMatcher;
};
Timeline.DetailedEventPainter.prototype.setHighlightMatcher = function (A) {
    this._highlightMatcher = A;
};
Timeline.DetailedEventPainter.prototype.paint = function () {
    var C = this._band.getEventSource();
    if (C == null) {
        return;
    } this._eventIdToElmt = {};
    this._prepareForPainting();
    var I = this._params.theme.event;
    var G = Math.max(I.track.height, this._frc.getLineHeight());
    var F = { trackOffset: Math.round(this._band.getViewWidth() / 2 - G / 2), trackHeight: G, trackGap: I.track.gap, trackIncrement: G + I.track.gap, icon: I.instant.icon, iconWidth: I.instant.iconWidth, iconHeight: I.instant.iconHeight, labelWidth: I.label.width };
    var D = this._band.getMinDate();
    var B = this._band.getMaxDate();
    var J = (this._filterMatcher != null) ? this._filterMatcher : function (K) {
        return true;
    };
    var A = (this._highlightMatcher != null) ? this._highlightMatcher : function (K) {
        return -1;
    };
    var E = C.getEventReverseIterator(D, B);
    while (E.hasNext()) {
        var H = E.next();
        if (J(H)) {
            this.paintEvent(H, F, this._params.theme, A(H));
        }
    } this._highlightLayer.style.display = "block";
    this._lineLayer.style.display = "block";
    this._eventLayer.style.display = "block";
    this._band.updateEventTrackInfo(this._lowerTracks.length + this._upperTracks.length, F.trackIncrement);
};
Timeline.DetailedEventPainter.prototype.softPaint = function () { };
Timeline.DetailedEventPainter.prototype._prepareForPainting = function () {
    var B = this._band;
    if (this._backLayer == null) {
        this._backLayer = this._band.createLayerDiv(0, "timeline-band-events");
        this._backLayer.style.visibility = "hidden";
        var A = document.createElement("span");
        A.className = "timeline-event-label";
        this._backLayer.appendChild(A);
        this._frc = SimileAjax.Graphics.getFontRenderingContext(A);
    } this._frc.update();
    this._lowerTracks = [];
    this._upperTracks = [];
    if (this._highlightLayer != null) {
        B.removeLayerDiv(this._highlightLayer);
    } this._highlightLayer = B.createLayerDiv(105, "timeline-band-highlights");
    this._highlightLayer.style.display = "none";
    if (this._lineLayer != null) {
        B.removeLayerDiv(this._lineLayer);
    } this._lineLayer = B.createLayerDiv(110, "timeline-band-lines");
    this._lineLayer.style.display = "none";
    if (this._eventLayer != null) {
        B.removeLayerDiv(this._eventLayer);
    } this._eventLayer = B.createLayerDiv(110, "timeline-band-events");
    this._eventLayer.style.display = "none";
};
Timeline.DetailedEventPainter.prototype.paintEvent = function (B, C, D, A) {
    if (B.isInstant()) {
        this.paintInstantEvent(B, C, D, A);
    } else {
        this.paintDurationEvent(B, C, D, A);
    }
};
Timeline.DetailedEventPainter.prototype.paintInstantEvent = function (B, C, D, A) {
    if (B.isImprecise()) {
        this.paintImpreciseInstantEvent(B, C, D, A);
    } else {
        this.paintPreciseInstantEvent(B, C, D, A);
    }
};
Timeline.DetailedEventPainter.prototype.paintDurationEvent = function (B, C, D, A) {
    if (B.isImprecise()) {
        this.paintImpreciseDurationEvent(B, C, D, A);
    } else {
        this.paintPreciseDurationEvent(B, C, D, A);
    }
};
Timeline.DetailedEventPainter.prototype.paintPreciseInstantEvent = function (L, P, S, Q) {
    var T = this._timeline.getDocument();
    var J = L.getText();
    var G = L.getStart();
    var H = Math.round(this._band.dateToPixelOffset(G));
    var A = Math.round(H + P.iconWidth / 2);
    var C = Math.round(H - P.iconWidth / 2);
    var E = this._frc.computeSize(J);
    var F = this._findFreeTrackForSolid(A, H);
    var B = this._paintEventIcon(L, F, C, P, S);
    var K = A + S.event.label.offsetFromLine;
    var O = F;
    var D = this._getTrackData(F);
    if (Math.min(D.solid, D.text) >= K + E.width) {
        D.solid = C;
        D.text = K;
    } else {
        D.solid = C;
        K = H + S.event.label.offsetFromLine;
        O = this._findFreeTrackForText(F, K + E.width, function (U) {
            U.line = H - 2;
        });
        this._getTrackData(O).text = C;
        this._paintEventLine(L, H, F, O, P, S);
    } var N = Math.round(P.trackOffset + O * P.trackIncrement + P.trackHeight / 2 - E.height / 2);
    var R = this._paintEventLabel(L, J, K, N, E.width, E.height, S);
    var M = this;
    var I = function (V, U, W) {
        return M._onClickInstantEvent(B.elmt, U, L);
    };
    SimileAjax.DOM.registerEvent(B.elmt, "mousedown", I);
    SimileAjax.DOM.registerEvent(R.elmt, "mousedown", I);
    this._createHighlightDiv(Q, B, S);
    this._eventIdToElmt[L.getID()] = B.elmt;
};
Timeline.DetailedEventPainter.prototype.paintImpreciseInstantEvent = function (O, S, W, T) {
    var X = this._timeline.getDocument();
    var M = O.getText();
    var I = O.getStart();
    var U = O.getEnd();
    var K = Math.round(this._band.dateToPixelOffset(I));
    var B = Math.round(this._band.dateToPixelOffset(U));
    var A = Math.round(K + S.iconWidth / 2);
    var D = Math.round(K - S.iconWidth / 2);
    var G = this._frc.computeSize(M);
    var H = this._findFreeTrackForSolid(B, K);
    var E = this._paintEventTape(O, H, K, B, W.event.instant.impreciseColor, W.event.instant.impreciseOpacity, S, W);
    var C = this._paintEventIcon(O, H, D, S, W);
    var F = this._getTrackData(H);
    F.solid = D;
    var N = A + W.event.label.offsetFromLine;
    var J = N + G.width;
    var R;
    if (J < B) {
        R = H;
    } else {
        N = K + W.event.label.offsetFromLine;
        J = N + G.width;
        R = this._findFreeTrackForText(H, J, function (Y) {
            Y.line = K - 2;
        });
        this._getTrackData(R).text = D;
        this._paintEventLine(O, K, H, R, S, W);
    } var Q = Math.round(S.trackOffset + R * S.trackIncrement + S.trackHeight / 2 - G.height / 2);
    var V = this._paintEventLabel(O, M, N, Q, G.width, G.height, W);
    var P = this;
    var L = function (Z, Y, a) {
        return P._onClickInstantEvent(C.elmt, Y, O);
    };
    SimileAjax.DOM.registerEvent(C.elmt, "mousedown", L);
    SimileAjax.DOM.registerEvent(E.elmt, "mousedown", L);
    SimileAjax.DOM.registerEvent(V.elmt, "mousedown", L);
    this._createHighlightDiv(T, C, W);
    this._eventIdToElmt[O.getID()] = C.elmt;
};
Timeline.DetailedEventPainter.prototype.paintPreciseDurationEvent = function (K, O, T, Q) {
    var U = this._timeline.getDocument();
    var I = K.getText();
    var E = K.getStart();
    var R = K.getEnd();
    var F = Math.round(this._band.dateToPixelOffset(E));
    var A = Math.round(this._band.dateToPixelOffset(R));
    var C = this._frc.computeSize(I);
    var D = this._findFreeTrackForSolid(A);
    var P = K.getColor();
    P = P != null ? P : T.event.duration.color;
    var B = this._paintEventTape(K, D, F, A, P, 100, O, T);
    var H = this._getTrackData(D);
    H.solid = F;
    var J = F + T.event.label.offsetFromLine;
    var N = this._findFreeTrackForText(D, J + C.width, function (V) {
        V.line = F - 2;
    });
    this._getTrackData(N).text = F - 2;
    this._paintEventLine(K, F, D, N, O, T);
    var M = Math.round(O.trackOffset + N * O.trackIncrement + O.trackHeight / 2 - C.height / 2);
    var S = this._paintEventLabel(K, I, J, M, C.width, C.height, T);
    var L = this;
    var G = function (W, V, X) {
        return L._onClickDurationEvent(B.elmt, V, K);
    };
    SimileAjax.DOM.registerEvent(B.elmt, "mousedown", G);
    SimileAjax.DOM.registerEvent(S.elmt, "mousedown", G);
    this._createHighlightDiv(Q, B, T);
    this._eventIdToElmt[K.getID()] = B.elmt;
};
Timeline.DetailedEventPainter.prototype.paintImpreciseDurationEvent = function (M, T, Y, V) {
    var Z = this._timeline.getDocument();
    var K = M.getText();
    var G = M.getStart();
    var S = M.getLatestStart();
    var W = M.getEnd();
    var O = M.getEarliestEnd();
    var H = Math.round(this._band.dateToPixelOffset(G));
    var E = Math.round(this._band.dateToPixelOffset(S));
    var A = Math.round(this._band.dateToPixelOffset(W));
    var F = Math.round(this._band.dateToPixelOffset(O));
    var C = this._frc.computeSize(K);
    var D = this._findFreeTrackForSolid(A);
    var U = M.getColor();
    U = U != null ? U : Y.event.duration.color;
    var R = this._paintEventTape(M, D, H, A, Y.event.duration.impreciseColor, Y.event.duration.impreciseOpacity, T, Y);
    var B = this._paintEventTape(M, D, E, F, U, 100, T, Y);
    var J = this._getTrackData(D);
    J.solid = H;
    var L = E + Y.event.label.offsetFromLine;
    var Q = this._findFreeTrackForText(D, L + C.width, function (a) {
        a.line = E - 2;
    });
    this._getTrackData(Q).text = E - 2;
    this._paintEventLine(M, E, D, Q, T, Y);
    var P = Math.round(T.trackOffset + Q * T.trackIncrement + T.trackHeight / 2 - C.height / 2);
    var X = this._paintEventLabel(M, K, L, P, C.width, C.height, Y);
    var N = this;
    var I = function (b, a, c) {
        return N._onClickDurationEvent(B.elmt, a, M);
    };
    SimileAjax.DOM.registerEvent(B.elmt, "mousedown", I);
    SimileAjax.DOM.registerEvent(X.elmt, "mousedown", I);
    this._createHighlightDiv(V, B, Y);
    this._eventIdToElmt[M.getID()] = B.elmt;
};
Timeline.DetailedEventPainter.prototype._findFreeTrackForSolid = function (D, A) {
    for (var C = 0;
        true;
        C++) {
        if (C < this._lowerTracks.length) {
            var B = this._lowerTracks[C];
            if (Math.min(B.solid, B.text) > D && (!(A) || B.line > A)) {
                return C;
            }
        } else {
            this._lowerTracks.push({ solid: Number.POSITIVE_INFINITY, text: Number.POSITIVE_INFINITY, line: Number.POSITIVE_INFINITY });
            return C;
        } if (C < this._upperTracks.length) {
            var B = this._upperTracks[C];
            if (Math.min(B.solid, B.text) > D && (!(A) || B.line > A)) {
                return -1 - C;
            }
        } else {
            this._upperTracks.push({ solid: Number.POSITIVE_INFINITY, text: Number.POSITIVE_INFINITY, line: Number.POSITIVE_INFINITY });
            return -1 - C;
        }
    }
};
Timeline.DetailedEventPainter.prototype._findFreeTrackForText = function (C, A, I) {
    var B;
    var E;
    var F;
    var H;
    if (C < 0) {
        B = true;
        F = -C;
        E = this._findFreeUpperTrackForText(F, A);
        H = -1 - E;
    } else {
        if (C > 0) {
            B = false;
            F = C + 1;
            E = this._findFreeLowerTrackForText(F, A);
            H = E;
        } else {
            var G = this._findFreeUpperTrackForText(0, A);
            var J = this._findFreeLowerTrackForText(1, A);
            if (J - 1 <= G) {
                B = false;
                F = 1;
                E = J;
                H = E;
            } else {
                B = true;
                F = 0;
                E = G;
                H = -1 - E;
            }
        }
    } if (B) {
        if (E == this._upperTracks.length) {
            this._upperTracks.push({ solid: Number.POSITIVE_INFINITY, text: Number.POSITIVE_INFINITY, line: Number.POSITIVE_INFINITY });
        } for (var D = F;
            D < E;
            D++) {
            I(this._upperTracks[D]);
        }
    } else {
        if (E == this._lowerTracks.length) {
            this._lowerTracks.push({ solid: Number.POSITIVE_INFINITY, text: Number.POSITIVE_INFINITY, line: Number.POSITIVE_INFINITY });
        } for (var D = F;
            D < E;
            D++) {
            I(this._lowerTracks[D]);
        }
    } return H;
};
Timeline.DetailedEventPainter.prototype._findFreeLowerTrackForText = function (A, C) {
    for (;
        A < this._lowerTracks.length;
        A++) {
        var B = this._lowerTracks[A];
        if (Math.min(B.solid, B.text) >= C) {
            break;
        }
    } return A;
};
Timeline.DetailedEventPainter.prototype._findFreeUpperTrackForText = function (A, C) {
    for (;
        A < this._upperTracks.length;
        A++) {
        var B = this._upperTracks[A];
        if (Math.min(B.solid, B.text) >= C) {
            break;
        }
    } return A;
};
Timeline.DetailedEventPainter.prototype._getTrackData = function (A) {
    return (A < 0) ? this._upperTracks[-A - 1] : this._lowerTracks[A];
};
Timeline.DetailedEventPainter.prototype._paintEventLine = function (J, E, D, A, G, F) {
    var H = Math.round(G.trackOffset + D * G.trackIncrement + G.trackHeight / 2);
    var I = Math.round(Math.abs(A - D) * G.trackIncrement);
    var C = "1px solid " + F.event.label.lineColor;
    var B = this._timeline.getDocument().createElement("div");
    B.style.position = "absolute";
    B.style.left = E + "px";
    B.style.width = F.event.label.offsetFromLine + "px";
    B.style.height = I + "px";
    if (D > A) {
        B.style.top = (H - I) + "px";
        B.style.borderTop = C;
    } else {
        B.style.top = H + "px";
        B.style.borderBottom = C;
    } B.style.borderLeft = C;
    this._lineLayer.appendChild(B);
};
Timeline.DetailedEventPainter.prototype._paintEventIcon = function (J, B, C, F, E) {
    var H = J.getIcon();
    H = H != null ? H : F.icon;
    var G = F.trackOffset + B * F.trackIncrement + F.trackHeight / 2;
    var I = Math.round(G - F.iconHeight / 2);
    var D = SimileAjax.Graphics.createTranslucentImage(H);
    var A = this._timeline.getDocument().createElement("div");
    A.style.position = "absolute";
    A.style.left = C + "px";
    A.style.top = I + "px";
    A.appendChild(D);
    A.style.cursor = "pointer";
    if (J._title != null) {
        A.title = J._title;
    } this._eventLayer.appendChild(A);
    return { left: C, top: I, width: F.iconWidth, height: F.iconHeight, elmt: A };
};
Timeline.DetailedEventPainter.prototype._paintEventLabel = function (I, J, C, F, A, G, E) {
    var H = this._timeline.getDocument();
    var K = H.createElement("div");
    K.style.position = "absolute";
    K.style.left = C + "px";
    K.style.width = A + "px";
    K.style.top = F + "px";
    K.style.height = G + "px";
    K.style.backgroundColor = E.event.label.backgroundColor;
    SimileAjax.Graphics.setOpacity(K, E.event.label.backgroundOpacity);
    this._eventLayer.appendChild(K);
    var B = H.createElement("div");
    B.style.position = "absolute";
    B.style.left = C + "px";
    B.style.width = A + "px";
    B.style.top = F + "px";
    B.innerHTML = J;
    B.style.cursor = "pointer";
    if (I._title != null) {
        B.title = I._title;
    } var D = I.getTextColor();
    if (D == null) {
        D = I.getColor();
    } if (D != null) {
        B.style.color = D;
    } this._eventLayer.appendChild(B);
    return { left: C, top: F, width: A, height: G, elmt: B };
};
Timeline.DetailedEventPainter.prototype._paintEventTape = function (L, B, D, A, G, C, I, H) {
    var F = A - D;
    var E = H.event.tape.height;
    var K = I.trackOffset + B * I.trackIncrement + I.trackHeight / 2;
    var J = Math.round(K - E / 2);
    var M = this._timeline.getDocument().createElement("div");
    M.style.position = "absolute";
    M.style.left = D + "px";
    M.style.width = F + "px";
    M.style.top = J + "px";
    M.style.height = E + "px";
    M.style.backgroundColor = G;
    M.style.overflow = "hidden";
    M.style.cursor = "pointer";
    if (L._title != null) {
        M.title = L._title;
    } SimileAjax.Graphics.setOpacity(M, C);
    this._eventLayer.appendChild(M);
    return { left: D, top: J, width: F, height: E, elmt: M };
};
Timeline.DetailedEventPainter.prototype._createHighlightDiv = function (A, C, E) {
    if (A >= 0) {
        var D = this._timeline.getDocument();
        var G = E.event;
        var B = G.highlightColors[Math.min(A, G.highlightColors.length - 1)];
        var F = D.createElement("div");
        F.style.position = "absolute";
        F.style.overflow = "hidden";
        F.style.left = (C.left - 2) + "px";
        F.style.width = (C.width + 4) + "px";
        F.style.top = (C.top - 2) + "px";
        F.style.height = (C.height + 4) + "px";
        F.style.background = B;
        this._highlightLayer.appendChild(F);
    }
};
Timeline.DetailedEventPainter.prototype._onClickInstantEvent = function (C, A, B) {
    var D = SimileAjax.DOM.getPageCoordinates(C);
    this._showBubble(D.left + Math.ceil(C.offsetWidth / 2), D.top + Math.ceil(C.offsetHeight / 2), B);
    this._fireOnSelect(B.getID());
    A.cancelBubble = true;
    SimileAjax.DOM.cancelEvent(A);
    return false;
};
Timeline.DetailedEventPainter.prototype._onClickDurationEvent = function (F, B, C) {
    if ("pageX" in B) {
        var A = B.pageX;
        var E = B.pageY;
    } else {
        var D = SimileAjax.DOM.getPageCoordinates(F);
        var A = B.offsetX + D.left;
        var E = B.offsetY + D.top;
    } this._showBubble(A, E, C);
    this._fireOnSelect(C.getID());
    B.cancelBubble = true;
    SimileAjax.DOM.cancelEvent(B);
    return false;
};
Timeline.DetailedEventPainter.prototype.showBubble = function (A) {
    var B = this._eventIdToElmt[A.getID()];
    if (B) {
        var C = SimileAjax.DOM.getPageCoordinates(B);
        this._showBubble(C.left + B.offsetWidth / 2, C.top + B.offsetHeight / 2, A);
    }
};
Timeline.DetailedEventPainter.prototype._showBubble = function (B, E, C) {
    var D = document.createElement("div");
    var A = this._params.theme.event.bubble;
    C.fillInfoBubble(D, this._params.theme, this._band.getLabeller());
    SimileAjax.WindowManager.cancelPopups();
    SimileAjax.Graphics.createBubbleForContentAndPoint(D, B, E, A.width, null, A.maxHeight);
};
Timeline.DetailedEventPainter.prototype._fireOnSelect = function (A) {
    for (var B = 0;
        B < this._onSelectListeners.length;
        B++) {
        this._onSelectListeners[B](A);
    }
};


/* ether-painters.js */
Timeline.GregorianEtherPainter = function (A) {
    this._params = A;
    this._theme = A.theme;
    this._unit = A.unit;
    this._multiple = ("multiple" in A) ? A.multiple : 1;
};
Timeline.GregorianEtherPainter.prototype.initialize = function (C, B) {
    this._band = C;
    this._timeline = B;
    this._backgroundLayer = C.createLayerDiv(0);
    this._backgroundLayer.setAttribute("name", "ether-background");
    this._backgroundLayer.className = "timeline-ether-bg";
    this._markerLayer = null;
    this._lineLayer = null;
    var D = ("align" in this._params && this._params.align != undefined) ? this._params.align : this._theme.ether.interval.marker[B.isHorizontal() ? "hAlign" : "vAlign"];
    var A = ("showLine" in this._params) ? this._params.showLine : this._theme.ether.interval.line.show;
    this._intervalMarkerLayout = new Timeline.EtherIntervalMarkerLayout(this._timeline, this._band, this._theme, D, A);
    this._highlight = new Timeline.EtherHighlight(this._timeline, this._band, this._theme, this._backgroundLayer);
};
Timeline.GregorianEtherPainter.prototype.setHighlight = function (A, B) {
    this._highlight.position(A, B);
};
Timeline.GregorianEtherPainter.prototype.paint = function () {
    if (this._markerLayer) {
        this._band.removeLayerDiv(this._markerLayer);
    } this._markerLayer = this._band.createLayerDiv(100);
    this._markerLayer.setAttribute("name", "ether-markers");
    this._markerLayer.style.display = "none";
    if (this._lineLayer) {
        this._band.removeLayerDiv(this._lineLayer);
    } this._lineLayer = this._band.createLayerDiv(1);
    this._lineLayer.setAttribute("name", "ether-lines");
    this._lineLayer.style.display = "none";
    var C = this._band.getMinDate();
    var F = this._band.getMaxDate();
    var A = this._band.getTimeZone();
    var E = this._band.getLabeller();
    SimileAjax.DateTime.roundDownToInterval(C, this._unit, A, this._multiple, this._theme.firstDayOfWeek);
    var D = this;
    var B = function (G) {
        for (var H = 0;
            H < D._multiple;
            H++) {
            SimileAjax.DateTime.incrementByInterval(G, D._unit);
        }
    };
    while (C.getTime() < F.getTime()) {
        this._intervalMarkerLayout.createIntervalMarker(C, E, this._unit, this._markerLayer, this._lineLayer);
        B(C);
    } this._markerLayer.style.display = "block";
    this._lineLayer.style.display = "block";
};
Timeline.GregorianEtherPainter.prototype.softPaint = function () { };
Timeline.GregorianEtherPainter.prototype.zoom = function (A) {
    if (A != 0) {
        this._unit += A;
    }
};
Timeline.HotZoneGregorianEtherPainter = function (G) {
    this._params = G;
    this._theme = G.theme;
    this._zones = [{ startTime: Number.NEGATIVE_INFINITY, endTime: Number.POSITIVE_INFINITY, unit: G.unit, multiple: 1 }];
    for (var F = 0;
        F < G.zones.length;
        F++) {
        var C = G.zones[F];
        var E = SimileAjax.DateTime.parseGregorianDateTime(C.start).getTime();
        var B = SimileAjax.DateTime.parseGregorianDateTime(C.end).getTime();
        for (var D = 0;
            D < this._zones.length && B > E;
            D++) {
            var A = this._zones[D];
            if (E < A.endTime) {
                if (E > A.startTime) {
                    this._zones.splice(D, 0, { startTime: A.startTime, endTime: E, unit: A.unit, multiple: A.multiple });
                    D++;
                    A.startTime = E;
                } if (B < A.endTime) {
                    this._zones.splice(D, 0, { startTime: E, endTime: B, unit: C.unit, multiple: (C.multiple) ? C.multiple : 1 });
                    D++;
                    A.startTime = B;
                    E = B;
                } else {
                    A.multiple = C.multiple;
                    A.unit = C.unit;
                    E = A.endTime;
                }
            }
        }
    }
};
Timeline.HotZoneGregorianEtherPainter.prototype.initialize = function (C, B) {
    this._band = C;
    this._timeline = B;
    this._backgroundLayer = C.createLayerDiv(0);
    this._backgroundLayer.setAttribute("name", "ether-background");
    this._backgroundLayer.className = "timeline-ether-bg";
    this._markerLayer = null;
    this._lineLayer = null;
    var D = ("align" in this._params && this._params.align != undefined) ? this._params.align : this._theme.ether.interval.marker[B.isHorizontal() ? "hAlign" : "vAlign"];
    var A = ("showLine" in this._params) ? this._params.showLine : this._theme.ether.interval.line.show;
    this._intervalMarkerLayout = new Timeline.EtherIntervalMarkerLayout(this._timeline, this._band, this._theme, D, A);
    this._highlight = new Timeline.EtherHighlight(this._timeline, this._band, this._theme, this._backgroundLayer);
};
Timeline.HotZoneGregorianEtherPainter.prototype.setHighlight = function (A, B) {
    this._highlight.position(A, B);
};
Timeline.HotZoneGregorianEtherPainter.prototype.paint = function () {
    if (this._markerLayer) {
        this._band.removeLayerDiv(this._markerLayer);
    } this._markerLayer = this._band.createLayerDiv(100);
    this._markerLayer.setAttribute("name", "ether-markers");
    this._markerLayer.style.display = "none";
    if (this._lineLayer) {
        this._band.removeLayerDiv(this._lineLayer);
    } this._lineLayer = this._band.createLayerDiv(1);
    this._lineLayer.setAttribute("name", "ether-lines");
    this._lineLayer.style.display = "none";
    var C = this._band.getMinDate();
    var A = this._band.getMaxDate();
    var I = this._band.getTimeZone();
    var L = this._band.getLabeller();
    var B = this;
    var J = function (N, M) {
        for (var O = 0;
            O < M.multiple;
            O++) {
            SimileAjax.DateTime.incrementByInterval(N, M.unit);
        }
    };
    var D = 0;
    while (D < this._zones.length) {
        if (C.getTime() < this._zones[D].endTime) {
            break;
        } D++;
    } var E = this._zones.length - 1;
    while (E >= 0) {
        if (A.getTime() > this._zones[E].startTime) {
            break;
        } E--;
    } for (var H = D;
        H <= E;
        H++) {
        var G = this._zones[H];
        var K = new Date(Math.max(C.getTime(), G.startTime));
        var F = new Date(Math.min(A.getTime(), G.endTime));
        SimileAjax.DateTime.roundDownToInterval(K, G.unit, I, G.multiple, this._theme.firstDayOfWeek);
        SimileAjax.DateTime.roundUpToInterval(F, G.unit, I, G.multiple, this._theme.firstDayOfWeek);
        while (K.getTime() < F.getTime()) {
            this._intervalMarkerLayout.createIntervalMarker(K, L, G.unit, this._markerLayer, this._lineLayer);
            J(K, G);
        }
    } this._markerLayer.style.display = "block";
    this._lineLayer.style.display = "block";
};
Timeline.HotZoneGregorianEtherPainter.prototype.softPaint = function () { };
Timeline.HotZoneGregorianEtherPainter.prototype.zoom = function (A) {
    if (A != 0) {
        for (var B = 0;
            B < this._zones.length;
            ++B) {
            if (this._zones[B]) {
                this._zones[B].unit += A;
            }
        }
    }
};
Timeline.YearCountEtherPainter = function (A) {
    this._params = A;
    this._theme = A.theme;
    this._startDate = SimileAjax.DateTime.parseGregorianDateTime(A.startDate);
    this._multiple = ("multiple" in A) ? A.multiple : 1;
};
Timeline.YearCountEtherPainter.prototype.initialize = function (C, B) {
    this._band = C;
    this._timeline = B;
    this._backgroundLayer = C.createLayerDiv(0);
    this._backgroundLayer.setAttribute("name", "ether-background");
    this._backgroundLayer.className = "timeline-ether-bg";
    this._markerLayer = null;
    this._lineLayer = null;
    var D = ("align" in this._params) ? this._params.align : this._theme.ether.interval.marker[B.isHorizontal() ? "hAlign" : "vAlign"];
    var A = ("showLine" in this._params) ? this._params.showLine : this._theme.ether.interval.line.show;
    this._intervalMarkerLayout = new Timeline.EtherIntervalMarkerLayout(this._timeline, this._band, this._theme, D, A);
    this._highlight = new Timeline.EtherHighlight(this._timeline, this._band, this._theme, this._backgroundLayer);
};
Timeline.YearCountEtherPainter.prototype.setHighlight = function (A, B) {
    this._highlight.position(A, B);
};
Timeline.YearCountEtherPainter.prototype.paint = function () {
    if (this._markerLayer) {
        this._band.removeLayerDiv(this._markerLayer);
    } this._markerLayer = this._band.createLayerDiv(100);
    this._markerLayer.setAttribute("name", "ether-markers");
    this._markerLayer.style.display = "none";
    if (this._lineLayer) {
        this._band.removeLayerDiv(this._lineLayer);
    } this._lineLayer = this._band.createLayerDiv(1);
    this._lineLayer.setAttribute("name", "ether-lines");
    this._lineLayer.style.display = "none";
    var B = new Date(this._startDate.getTime());
    var F = this._band.getMaxDate();
    var E = this._band.getMinDate().getUTCFullYear() - this._startDate.getUTCFullYear();
    B.setUTCFullYear(this._band.getMinDate().getUTCFullYear() - E % this._multiple);
    var C = this;
    var A = function (G) {
        for (var H = 0;
            H < C._multiple;
            H++) {
            SimileAjax.DateTime.incrementByInterval(G, SimileAjax.DateTime.YEAR);
        }
    };
    var D = {
        labelInterval: function (G, I) {
            var H = G.getUTCFullYear() - C._startDate.getUTCFullYear();
            return { text: H, emphasized: H == 0 };
        }
    };
    while (B.getTime() < F.getTime()) {
        this._intervalMarkerLayout.createIntervalMarker(B, D, SimileAjax.DateTime.YEAR, this._markerLayer, this._lineLayer);
        A(B);
    } this._markerLayer.style.display = "block";
    this._lineLayer.style.display = "block";
};
Timeline.YearCountEtherPainter.prototype.softPaint = function () { };
Timeline.QuarterlyEtherPainter = function (A) {
    this._params = A;
    this._theme = A.theme;
    this._startDate = SimileAjax.DateTime.parseGregorianDateTime(A.startDate);
};
Timeline.QuarterlyEtherPainter.prototype.initialize = function (C, B) {
    this._band = C;
    this._timeline = B;
    this._backgroundLayer = C.createLayerDiv(0);
    this._backgroundLayer.setAttribute("name", "ether-background");
    this._backgroundLayer.className = "timeline-ether-bg";
    this._markerLayer = null;
    this._lineLayer = null;
    var D = ("align" in this._params) ? this._params.align : this._theme.ether.interval.marker[B.isHorizontal() ? "hAlign" : "vAlign"];
    var A = ("showLine" in this._params) ? this._params.showLine : this._theme.ether.interval.line.show;
    this._intervalMarkerLayout = new Timeline.EtherIntervalMarkerLayout(this._timeline, this._band, this._theme, D, A);
    this._highlight = new Timeline.EtherHighlight(this._timeline, this._band, this._theme, this._backgroundLayer);
};
Timeline.QuarterlyEtherPainter.prototype.setHighlight = function (A, B) {
    this._highlight.position(A, B);
};
Timeline.QuarterlyEtherPainter.prototype.paint = function () {
    if (this._markerLayer) {
        this._band.removeLayerDiv(this._markerLayer);
    } this._markerLayer = this._band.createLayerDiv(100);
    this._markerLayer.setAttribute("name", "ether-markers");
    this._markerLayer.style.display = "none";
    if (this._lineLayer) {
        this._band.removeLayerDiv(this._lineLayer);
    } this._lineLayer = this._band.createLayerDiv(1);
    this._lineLayer.setAttribute("name", "ether-lines");
    this._lineLayer.style.display = "none";
    var B = new Date(0);
    var E = this._band.getMaxDate();
    B.setUTCFullYear(Math.max(this._startDate.getUTCFullYear(), this._band.getMinDate().getUTCFullYear()));
    B.setUTCMonth(this._startDate.getUTCMonth());
    var C = this;
    var A = function (F) {
        F.setUTCMonth(F.getUTCMonth() + 3);
    };
    var D = {
        labelInterval: function (G, H) {
            var F = (4 + (G.getUTCMonth() - C._startDate.getUTCMonth()) / 3) % 4;
            if (F != 0) {
                return { text: "Q" + (F + 1), emphasized: false };
            } else {
                return { text: "Y" + (G.getUTCFullYear() - C._startDate.getUTCFullYear() + 1), emphasized: true };
            }
        }
    };
    while (B.getTime() < E.getTime()) {
        this._intervalMarkerLayout.createIntervalMarker(B, D, SimileAjax.DateTime.YEAR, this._markerLayer, this._lineLayer);
        A(B);
    } this._markerLayer.style.display = "block";
    this._lineLayer.style.display = "block";
};
Timeline.QuarterlyEtherPainter.prototype.softPaint = function () { };
Timeline.EtherIntervalMarkerLayout = function (I, L, C, E, M) {
    var A = I.isHorizontal();
    if (A) {
        if (E == "Top") {
            this.positionDiv = function (O, N) {
                O.style.left = N + "px";
                O.style.top = "0px";
            };
        } else {
            this.positionDiv = function (O, N) {
                O.style.left = N + "px";
                O.style.bottom = "0px";
            };
        }
    } else {
        if (E == "Left") {
            this.positionDiv = function (O, N) {
                O.style.top = N + "px";
                O.style.left = "0px";
            };
        } else {
            this.positionDiv = function (O, N) {
                O.style.top = N + "px";
                O.style.right = "0px";
            };
        }
    } var D = C.ether.interval.marker;
    var K = C.ether.interval.line;
    var B = C.ether.interval.weekend;
    var H = (A ? "h" : "v") + E;
    var G = D[H + "Styler"];
    var J = D[H + "EmphasizedStyler"];
    var F = SimileAjax.DateTime.gregorianUnitLengths[SimileAjax.DateTime.DAY];
    this.createIntervalMarker = function (T, c, a, Y, P) {
        var U = Math.round(L.dateToPixelOffset(T));
        if (M && a != SimileAjax.DateTime.WEEK) {
            var V = I.getDocument().createElement("div");
            V.className = "timeline-ether-lines";
            if (K.opacity < 100) {
                SimileAjax.Graphics.setOpacity(V, K.opacity);
            } if (A) {
                V.style.left = U + "px";
            } else {
                V.style.top = U + "px";
            } P.appendChild(V);
        } if (a == SimileAjax.DateTime.WEEK) {
            var N = C.firstDayOfWeek;
            var R = new Date(T.getTime() + (6 - N - 7) * F);
            var b = new Date(R.getTime() + 2 * F);
            var Q = Math.round(L.dateToPixelOffset(R));
            var S = Math.round(L.dateToPixelOffset(b));
            var W = Math.max(1, S - Q);
            var X = I.getDocument().createElement("div");
            X.className = "timeline-ether-weekends";
            if (B.opacity < 100) {
                SimileAjax.Graphics.setOpacity(X, B.opacity);
            } if (A) {
                X.style.left = Q + "px";
                X.style.width = W + "px";
            } else {
                X.style.top = Q + "px";
                X.style.height = W + "px";
            } P.appendChild(X);
        } var Z = c.labelInterval(T, a);
        var O = I.getDocument().createElement("div");
        O.innerHTML = Z.text;
        O.className = "timeline-date-label";
        if (Z.emphasized) {
            O.className += " timeline-date-label-em";
        } this.positionDiv(O, U);
        Y.appendChild(O);
        return O;
    };
};
Timeline.EtherHighlight = function (B, E, D, C) {
    var A = B.isHorizontal();
    this._highlightDiv = null;
    this._createHighlightDiv = function () {
        if (this._highlightDiv == null) {
            this._highlightDiv = B.getDocument().createElement("div");
            this._highlightDiv.setAttribute("name", "ether-highlight");
            this._highlightDiv.className = "timeline-ether-highlight";
            var F = D.ether.highlightOpacity;
            if (F < 100) {
                SimileAjax.Graphics.setOpacity(this._highlightDiv, F);
            } C.appendChild(this._highlightDiv);
        }
    };
    this.position = function (H, J) {
        this._createHighlightDiv();
        var I = Math.round(E.dateToPixelOffset(H));
        var G = Math.round(E.dateToPixelOffset(J));
        var F = Math.max(G - I, 3);
        if (A) {
            this._highlightDiv.style.left = I + "px";
            this._highlightDiv.style.width = F + "px";
            this._highlightDiv.style.height = (E.getViewWidth() - 4) + "px";
        } else {
            this._highlightDiv.style.top = I + "px";
            this._highlightDiv.style.height = F + "px";
            this._highlightDiv.style.width = (E.getViewWidth() - 4) + "px";
        }
    };
};


/* ethers.js */
Timeline.LinearEther = function (A) {
    this._params = A;
    this._interval = A.interval;
    this._pixelsPerInterval = A.pixelsPerInterval;
};
Timeline.LinearEther.prototype.initialize = function (B, A) {
    this._band = B;
    this._timeline = A;
    this._unit = A.getUnit();
    if ("startsOn" in this._params) {
        this._start = this._unit.parseFromObject(this._params.startsOn);
    } else {
        if ("endsOn" in this._params) {
            this._start = this._unit.parseFromObject(this._params.endsOn);
            this.shiftPixels(-this._timeline.getPixelLength());
        } else {
            if ("centersOn" in this._params) {
                this._start = this._unit.parseFromObject(this._params.centersOn);
                this.shiftPixels(-this._timeline.getPixelLength() / 2);
            } else {
                this._start = this._unit.makeDefaultValue();
                this.shiftPixels(-this._timeline.getPixelLength() / 2);
            }
        }
    }
};
Timeline.LinearEther.prototype.setDate = function (A) {
    this._start = this._unit.cloneValue(A);
};
Timeline.LinearEther.prototype.shiftPixels = function (B) {
    var A = this._interval * B / this._pixelsPerInterval;
    this._start = this._unit.change(this._start, A);
};
Timeline.LinearEther.prototype.dateToPixelOffset = function (B) {
    var A = this._unit.compare(B, this._start);
    return this._pixelsPerInterval * A / this._interval;
};
Timeline.LinearEther.prototype.pixelOffsetToDate = function (B) {
    var A = B * this._interval / this._pixelsPerInterval;
    return this._unit.change(this._start, A);
};
Timeline.LinearEther.prototype.zoom = function (D) {
    var A = 0;
    var B = this._band._zoomIndex;
    var C = B;
    if (D && (B > 0)) {
        C = B - 1;
    } if (!D && (B < (this._band._zoomSteps.length - 1))) {
        C = B + 1;
    } this._band._zoomIndex = C;
    this._interval = SimileAjax.DateTime.gregorianUnitLengths[this._band._zoomSteps[C].unit];
    this._pixelsPerInterval = this._band._zoomSteps[C].pixelsPerInterval;
    A = this._band._zoomSteps[C].unit - this._band._zoomSteps[B].unit;
    return A;
};
Timeline.HotZoneEther = function (A) {
    this._params = A;
    this._interval = A.interval;
    this._pixelsPerInterval = A.pixelsPerInterval;
    this._theme = A.theme;
};
Timeline.HotZoneEther.prototype.initialize = function (I, H) {
    this._band = I;
    this._timeline = H;
    this._unit = H.getUnit();
    this._zones = [{ startTime: Number.NEGATIVE_INFINITY, endTime: Number.POSITIVE_INFINITY, magnify: 1 }];
    var D = this._params;
    for (var E = 0;
        E < D.zones.length;
        E++) {
        var G = D.zones[E];
        var F = this._unit.parseFromObject(G.start);
        var B = this._unit.parseFromObject(G.end);
        for (var C = 0;
            C < this._zones.length && this._unit.compare(B, F) > 0;
            C++) {
            var A = this._zones[C];
            if (this._unit.compare(F, A.endTime) < 0) {
                if (this._unit.compare(F, A.startTime) > 0) {
                    this._zones.splice(C, 0, { startTime: A.startTime, endTime: F, magnify: A.magnify });
                    C++;
                    A.startTime = F;
                } if (this._unit.compare(B, A.endTime) < 0) {
                    this._zones.splice(C, 0, { startTime: F, endTime: B, magnify: G.magnify * A.magnify });
                    C++;
                    A.startTime = B;
                    F = B;
                } else {
                    A.magnify *= G.magnify;
                    F = A.endTime;
                }
            }
        }
    } if ("startsOn" in this._params) {
        this._start = this._unit.parseFromObject(this._params.startsOn);
    } else {
        if ("endsOn" in this._params) {
            this._start = this._unit.parseFromObject(this._params.endsOn);
            this.shiftPixels(-this._timeline.getPixelLength());
        } else {
            if ("centersOn" in this._params) {
                this._start = this._unit.parseFromObject(this._params.centersOn);
                this.shiftPixels(-this._timeline.getPixelLength() / 2);
            } else {
                this._start = this._unit.makeDefaultValue();
                this.shiftPixels(-this._timeline.getPixelLength() / 2);
            }
        }
    }
};
Timeline.HotZoneEther.prototype.setDate = function (A) {
    this._start = this._unit.cloneValue(A);
};
Timeline.HotZoneEther.prototype.shiftPixels = function (A) {
    this._start = this.pixelOffsetToDate(A);
};
Timeline.HotZoneEther.prototype.dateToPixelOffset = function (A) {
    return this._dateDiffToPixelOffset(this._start, A);
};
Timeline.HotZoneEther.prototype.pixelOffsetToDate = function (A) {
    return this._pixelOffsetToDate(A, this._start);
};
Timeline.HotZoneEther.prototype.zoom = function (D) {
    var A = 0;
    var B = this._band._zoomIndex;
    var C = B;
    if (D && (B > 0)) {
        C = B - 1;
    } if (!D && (B < (this._band._zoomSteps.length - 1))) {
        C = B + 1;
    } this._band._zoomIndex = C;
    this._interval = SimileAjax.DateTime.gregorianUnitLengths[this._band._zoomSteps[C].unit];
    this._pixelsPerInterval = this._band._zoomSteps[C].pixelsPerInterval;
    A = this._band._zoomSteps[C].unit - this._band._zoomSteps[B].unit;
    return A;
};
Timeline.HotZoneEther.prototype._dateDiffToPixelOffset = function (H, C) {
    var D = this._getScale();
    var I = H;
    var B = C;
    var E = 0;
    if (this._unit.compare(I, B) < 0) {
        var G = 0;
        while (G < this._zones.length) {
            if (this._unit.compare(I, this._zones[G].endTime) < 0) {
                break;
            } G++;
        } while (this._unit.compare(I, B) < 0) {
            var F = this._zones[G];
            var A = this._unit.earlier(B, F.endTime);
            E += (this._unit.compare(A, I) / (D / F.magnify));
            I = A;
            G++;
        }
    } else {
        var G = this._zones.length - 1;
        while (G >= 0) {
            if (this._unit.compare(I, this._zones[G].startTime) > 0) {
                break;
            } G--;
        } while (this._unit.compare(I, B) > 0) {
            var F = this._zones[G];
            var A = this._unit.later(B, F.startTime);
            E += (this._unit.compare(A, I) / (D / F.magnify));
            I = A;
            G--;
        }
    } return E;
};
Timeline.HotZoneEther.prototype._pixelOffsetToDate = function (E, B) {
    var G = this._getScale();
    var D = B;
    if (E > 0) {
        var F = 0;
        while (F < this._zones.length) {
            if (this._unit.compare(D, this._zones[F].endTime) < 0) {
                break;
            } F++;
        } while (E > 0) {
            var A = this._zones[F];
            var H = G / A.magnify;
            if (A.endTime == Number.POSITIVE_INFINITY) {
                D = this._unit.change(D, E * H);
                E = 0;
            } else {
                var C = this._unit.compare(A.endTime, D) / H;
                if (C > E) {
                    D = this._unit.change(D, E * H);
                    E = 0;
                } else {
                    D = A.endTime;
                    E -= C;
                }
            } F++;
        }
    } else {
        var F = this._zones.length - 1;
        while (F >= 0) {
            if (this._unit.compare(D, this._zones[F].startTime) > 0) {
                break;
            } F--;
        } E = -E;
        while (E > 0) {
            var A = this._zones[F];
            var H = G / A.magnify;
            if (A.startTime == Number.NEGATIVE_INFINITY) {
                D = this._unit.change(D, -E * H);
                E = 0;
            } else {
                var C = this._unit.compare(D, A.startTime) / H;
                if (C > E) {
                    D = this._unit.change(D, -E * H);
                    E = 0;
                } else {
                    D = A.startTime;
                    E -= C;
                }
            } F--;
        }
    } return D;
};
Timeline.HotZoneEther.prototype._getScale = function () {
    return this._interval / this._pixelsPerInterval;
};


/* event-utils.js */
Timeline.EventUtils = {};
Timeline.EventUtils.getNewEventID = function () {
    if (this._lastEventID == null) {
        this._lastEventID = 0;
    } this._lastEventID += 1;
    return "e" + this._lastEventID;
};
Timeline.EventUtils.decodeEventElID = function (C) {
    var D = C.split("-");
    if (D[1] != "tl") {
        alert("Internal Timeline problem 101, please consult support");
        return { band: null, evt: null };
    } var B = Timeline.getTimelineFromID(D[2]);
    var E = B.getBand(D[3]);
    var A = E.getEventSource.getEvent(D[4]);
    return { band: E, evt: A };
};
Timeline.EventUtils.encodeEventElID = function (B, D, C, A) {
    return C + "-tl-" + B.timelineID + "-" + D.getIndex() + "-" + A.getID();
};


/* labellers.js */
Timeline.GregorianDateLabeller = function (B, A) {
    this._locale = B;
    this._timeZone = A;
};
Timeline.GregorianDateLabeller.monthNames = [];
Timeline.GregorianDateLabeller.dayNames = [];
Timeline.GregorianDateLabeller.labelIntervalFunctions = [];
Timeline.GregorianDateLabeller.getMonthName = function (B, A) {
    return Timeline.GregorianDateLabeller.monthNames[A][B];
};
Timeline.GregorianDateLabeller.prototype.labelInterval = function (A, C) {
    var B = Timeline.GregorianDateLabeller.labelIntervalFunctions[this._locale];
    if (B == null) {
        B = Timeline.GregorianDateLabeller.prototype.defaultLabelInterval;
    } return B.call(this, A, C);
};
Timeline.GregorianDateLabeller.prototype.labelPrecise = function (A) {
    return SimileAjax.DateTime.removeTimeZoneOffset(A, this._timeZone).toUTCString();
};
Timeline.GregorianDateLabeller.prototype.defaultLabelInterval = function (B, C) {
    var D;
    var F = false;
    B = SimileAjax.DateTime.removeTimeZoneOffset(B, this._timeZone);
    switch (C) {
        case SimileAjax.DateTime.MILLISECOND: D = B.getUTCMilliseconds();
            break;
        case SimileAjax.DateTime.SECOND: D = B.getUTCSeconds();
            break;
        case SimileAjax.DateTime.MINUTE: var A = B.getUTCMinutes();
            if (A == 0) {
                D = B.getUTCHours() + ":00";
                F = true;
            } else {
                D = A;
            } break;
        case SimileAjax.DateTime.HOUR: D = B.getUTCHours() + "hr";
            break;
        case SimileAjax.DateTime.DAY: D = Timeline.GregorianDateLabeller.getMonthName(B.getUTCMonth(), this._locale) + " " + B.getUTCDate();
            break;
        case SimileAjax.DateTime.WEEK: D = Timeline.GregorianDateLabeller.getMonthName(B.getUTCMonth(), this._locale) + " " + B.getUTCDate();
            break;
        case SimileAjax.DateTime.MONTH: var A = B.getUTCMonth();
            if (A != 0) {
                D = Timeline.GregorianDateLabeller.getMonthName(A, this._locale);
                break;
            } case SimileAjax.DateTime.YEAR: case SimileAjax.DateTime.DECADE: case SimileAjax.DateTime.CENTURY: case SimileAjax.DateTime.MILLENNIUM: var E = B.getUTCFullYear();
            if (E > 0) {
                D = B.getUTCFullYear();
            } else {
                D = (1 - E) + "BC";
            } F = (C == SimileAjax.DateTime.MONTH) || (C == SimileAjax.DateTime.DECADE && E % 100 == 0) || (C == SimileAjax.DateTime.CENTURY && E % 1000 == 0);
            break;
        default: D = B.toUTCString();
    }return { text: D, emphasized: F };
};


/* original-painter.js */
Timeline.OriginalEventPainter = function (A) {
    this._params = A;
    this._onSelectListeners = [];
    this._eventPaintListeners = [];
    this._filterMatcher = null;
    this._highlightMatcher = null;
    this._frc = null;
    this._eventIdToElmt = {};
};
Timeline.OriginalEventPainter.prototype.initialize = function (B, A) {
    this._band = B;
    this._timeline = A;
    this._backLayer = null;
    this._eventLayer = null;
    this._lineLayer = null;
    this._highlightLayer = null;
    this._eventIdToElmt = null;
};
Timeline.OriginalEventPainter.prototype.getType = function () {
    return "original";
};
Timeline.OriginalEventPainter.prototype.addOnSelectListener = function (A) {
    this._onSelectListeners.push(A);
};
Timeline.OriginalEventPainter.prototype.removeOnSelectListener = function (B) {
    for (var A = 0;
        A < this._onSelectListeners.length;
        A++) {
        if (this._onSelectListeners[A] == B) {
            this._onSelectListeners.splice(A, 1);
            break;
        }
    }
};
Timeline.OriginalEventPainter.prototype.addEventPaintListener = function (A) {
    this._eventPaintListeners.push(A);
};
Timeline.OriginalEventPainter.prototype.removeEventPaintListener = function (B) {
    for (var A = 0;
        A < this._eventPaintListeners.length;
        A++) {
        if (this._eventPaintListeners[A] == B) {
            this._eventPaintListeners.splice(A, 1);
            break;
        }
    }
};
Timeline.OriginalEventPainter.prototype.getFilterMatcher = function () {
    return this._filterMatcher;
};
Timeline.OriginalEventPainter.prototype.setFilterMatcher = function (A) {
    this._filterMatcher = A;
};
Timeline.OriginalEventPainter.prototype.getHighlightMatcher = function () {
    return this._highlightMatcher;
};
Timeline.OriginalEventPainter.prototype.setHighlightMatcher = function (A) {
    this._highlightMatcher = A;
};
Timeline.OriginalEventPainter.prototype.paint = function () {
    var C = this._band.getEventSource();
    if (C == null) {
        return;
    } this._eventIdToElmt = {};
    this._fireEventPaintListeners("paintStarting", null, null);
    this._prepareForPainting();
    var I = this._params.theme.event;
    var G = Math.max(I.track.height, I.tape.height + this._frc.getLineHeight());
    var F = { trackOffset: I.track.offset, trackHeight: G, trackGap: I.track.gap, trackIncrement: G + I.track.gap, icon: I.instant.icon, iconWidth: I.instant.iconWidth, iconHeight: I.instant.iconHeight, labelWidth: I.label.width, maxLabelChar: I.label.maxLabelChar, impreciseIconMargin: I.instant.impreciseIconMargin };
    var D = this._band.getMinDate();
    var B = this._band.getMaxDate();
    var J = (this._filterMatcher != null) ? this._filterMatcher : function (K) {
        return true;
    };
    var A = (this._highlightMatcher != null) ? this._highlightMatcher : function (K) {
        return -1;
    };
    var E = C.getEventReverseIterator(D, B);
    while (E.hasNext()) {
        var H = E.next();
        if (J(H)) {
            this.paintEvent(H, F, this._params.theme, A(H));
        }
    } this._highlightLayer.style.display = "block";
    this._lineLayer.style.display = "block";
    this._eventLayer.style.display = "block";
    this._band.updateEventTrackInfo(this._tracks.length, F.trackIncrement);
    this._fireEventPaintListeners("paintEnded", null, null);
};
Timeline.OriginalEventPainter.prototype.softPaint = function () { };
Timeline.OriginalEventPainter.prototype._prepareForPainting = function () {
    var B = this._band;
    if (this._backLayer == null) {
        this._backLayer = this._band.createLayerDiv(0, "timeline-band-events");
        this._backLayer.style.visibility = "hidden";
        var A = document.createElement("span");
        A.className = "timeline-event-label";
        this._backLayer.appendChild(A);
        this._frc = SimileAjax.Graphics.getFontRenderingContext(A);
    } this._frc.update();
    this._tracks = [];
    if (this._highlightLayer != null) {
        B.removeLayerDiv(this._highlightLayer);
    } this._highlightLayer = B.createLayerDiv(105, "timeline-band-highlights");
    this._highlightLayer.style.display = "none";
    if (this._lineLayer != null) {
        B.removeLayerDiv(this._lineLayer);
    } this._lineLayer = B.createLayerDiv(110, "timeline-band-lines");
    this._lineLayer.style.display = "none";
    if (this._eventLayer != null) {
        B.removeLayerDiv(this._eventLayer);
    } this._eventLayer = B.createLayerDiv(115, "timeline-band-events");
    this._eventLayer.style.display = "none";
};
Timeline.OriginalEventPainter.prototype.paintEvent = function (B, C, D, A) {
    if (B.isInstant()) {
        this.paintInstantEvent(B, C, D, A);
    } else {
        this.paintDurationEvent(B, C, D, A);
    }
};
Timeline.OriginalEventPainter.prototype.paintInstantEvent = function (B, C, D, A) {
    if (B.isImprecise()) {
        this.paintImpreciseInstantEvent(B, C, D, A);
    } else {
        this.paintPreciseInstantEvent(B, C, D, A);
    }
};
Timeline.OriginalEventPainter.prototype.paintDurationEvent = function (B, C, D, A) {
    if (B.isImprecise()) {
        this.paintImpreciseDurationEvent(B, C, D, A);
    } else {
        this.paintPreciseDurationEvent(B, C, D, A);
    }
};
Timeline.OriginalEventPainter.prototype.paintPreciseInstantEvent = function (N, S, V, T) {
    var W = this._timeline.getDocument();
    var L = N.getText();
    var H = N.getStart();
    var I = Math.round(this._band.dateToPixelOffset(H));
    var A = Math.round(I + S.iconWidth / 2);
    var C = Math.round(I - S.iconWidth / 2);
    var F = this._getLabelDivClassName(N);
    var D = this._frc.computeSize(L, F);
    var M = A + V.event.label.offsetFromLine;
    var J = M + D.width;
    var Q = J;
    var P = this._findFreeTrack(N, Q);
    var R = Math.round(S.trackOffset + P * S.trackIncrement + S.trackHeight / 2 - D.height / 2);
    var B = this._paintEventIcon(N, P, C, S, V, 0);
    var U = this._paintEventLabel(N, L, M, R, D.width, D.height, V, F, T);
    var E = [B.elmt, U.elmt];
    var O = this;
    var K = function (Y, X, Z) {
        return O._onClickInstantEvent(B.elmt, X, N);
    };
    SimileAjax.DOM.registerEvent(B.elmt, "mousedown", K);
    SimileAjax.DOM.registerEvent(U.elmt, "mousedown", K);
    var G = this._createHighlightDiv(T, B, V, N);
    if (G != null) {
        E.push(G);
    } this._fireEventPaintListeners("paintedEvent", N, E);
    this._eventIdToElmt[N.getID()] = B.elmt;
    this._tracks[P] = C;
};
Timeline.OriginalEventPainter.prototype.paintImpreciseInstantEvent = function (P, U, Z, W) {
    var b = this._timeline.getDocument();
    var N = P.getText();
    var J = P.getStart();
    var X = P.getEnd();
    var K = Math.round(this._band.dateToPixelOffset(J));
    var B = Math.round(this._band.dateToPixelOffset(X));
    var A = Math.round(K + U.iconWidth / 2);
    var D = Math.round(K - U.iconWidth / 2);
    var H = this._getLabelDivClassName(P);
    var F = this._frc.computeSize(N, H);
    var O = A + Z.event.label.offsetFromLine;
    var L = O + F.width;
    var S = Math.max(L, B);
    var R = this._findFreeTrack(P, S);
    var a = Z.event.tape.height;
    var T = Math.round(U.trackOffset + R * U.trackIncrement + a);
    var C = this._paintEventIcon(P, R, D, U, Z, a);
    var Y = this._paintEventLabel(P, N, O, T, F.width, F.height, Z, H, W);
    var V = P.getColor();
    V = V != null ? V : Z.event.instant.impreciseColor;
    var E = this._paintEventTape(P, R, K, B, V, Z.event.instant.impreciseOpacity, U, Z, 0);
    var G = [C.elmt, Y.elmt, E.elmt];
    var Q = this;
    var M = function (d, c, e) {
        return Q._onClickInstantEvent(C.elmt, c, P);
    };
    SimileAjax.DOM.registerEvent(C.elmt, "mousedown", M);
    SimileAjax.DOM.registerEvent(E.elmt, "mousedown", M);
    SimileAjax.DOM.registerEvent(Y.elmt, "mousedown", M);
    var I = this._createHighlightDiv(W, C, Z, P);
    if (I != null) {
        G.push(I);
    } this._fireEventPaintListeners("paintedEvent", P, G);
    this._eventIdToElmt[P.getID()] = C.elmt;
    this._tracks[R] = D;
};
Timeline.OriginalEventPainter.prototype.paintPreciseDurationEvent = function (M, R, W, T) {
    var X = this._timeline.getDocument();
    var K = M.getText();
    var G = M.getStart();
    var U = M.getEnd();
    var H = Math.round(this._band.dateToPixelOffset(G));
    var A = Math.round(this._band.dateToPixelOffset(U));
    var E = this._getLabelDivClassName(M);
    var C = this._frc.computeSize(K, E);
    var L = H;
    var I = L + C.width;
    var P = Math.max(I, A);
    var O = this._findFreeTrack(M, P);
    var Q = Math.round(R.trackOffset + O * R.trackIncrement + W.event.tape.height);
    var S = M.getColor();
    S = S != null ? S : W.event.duration.color;
    var B = this._paintEventTape(M, O, H, A, S, 100, R, W, 0);
    var V = this._paintEventLabel(M, K, L, Q, C.width, C.height, W, E, T);
    var D = [B.elmt, V.elmt];
    var N = this;
    var J = function (Z, Y, a) {
        return N._onClickDurationEvent(B.elmt, Y, M);
    };
    SimileAjax.DOM.registerEvent(B.elmt, "mousedown", J);
    SimileAjax.DOM.registerEvent(V.elmt, "mousedown", J);
    var F = this._createHighlightDiv(T, B, W, M);
    if (F != null) {
        D.push(F);
    } this._fireEventPaintListeners("paintedEvent", M, D);
    this._eventIdToElmt[M.getID()] = B.elmt;
    this._tracks[O] = H;
};
Timeline.OriginalEventPainter.prototype.paintImpreciseDurationEvent = function (O, W, b, Y) {
    var c = this._timeline.getDocument();
    var M = O.getText();
    var I = O.getStart();
    var V = O.getLatestStart();
    var Z = O.getEnd();
    var Q = O.getEarliestEnd();
    var K = Math.round(this._band.dateToPixelOffset(I));
    var F = Math.round(this._band.dateToPixelOffset(V));
    var A = Math.round(this._band.dateToPixelOffset(Z));
    var G = Math.round(this._band.dateToPixelOffset(Q));
    var E = this._getLabelDivClassName(O);
    var C = this._frc.computeSize(M, E);
    var N = F;
    var J = N + C.width;
    var S = Math.max(J, A);
    var R = this._findFreeTrack(O, S);
    var T = Math.round(W.trackOffset + R * W.trackIncrement + b.event.tape.height);
    var X = O.getColor();
    X = X != null ? X : b.event.duration.color;
    var U = this._paintEventTape(O, R, K, A, b.event.duration.impreciseColor, b.event.duration.impreciseOpacity, W, b, 0);
    var B = this._paintEventTape(O, R, F, G, X, 100, W, b, 1);
    var a = this._paintEventLabel(O, M, N, T, C.width, C.height, b, E, Y);
    var D = [U.elmt, B.elmt, a.elmt];
    var P = this;
    var L = function (e, d, f) {
        return P._onClickDurationEvent(B.elmt, d, O);
    };
    SimileAjax.DOM.registerEvent(B.elmt, "mousedown", L);
    SimileAjax.DOM.registerEvent(a.elmt, "mousedown", L);
    var H = this._createHighlightDiv(Y, B, b, O);
    if (H != null) {
        D.push(H);
    } this._fireEventPaintListeners("paintedEvent", O, D);
    this._eventIdToElmt[O.getID()] = B.elmt;
    this._tracks[R] = K;
};
Timeline.OriginalEventPainter.prototype._encodeEventElID = function (B, A) {
    return Timeline.EventUtils.encodeEventElID(this._timeline, this._band, B, A);
};
Timeline.OriginalEventPainter.prototype._findFreeTrack = function (E, D) {
    var A = E.getTrackNum();
    if (A != null) {
        return A;
    } for (var C = 0;
        C < this._tracks.length;
        C++) {
        var B = this._tracks[C];
        if (B > D) {
            break;
        }
    } return C;
};
Timeline.OriginalEventPainter.prototype._paintEventIcon = function (K, B, C, G, F, D) {
    var I = K.getIcon();
    I = I != null ? I : G.icon;
    var J;
    if (D > 0) {
        J = G.trackOffset + B * G.trackIncrement + D + G.impreciseIconMargin;
    } else {
        var H = G.trackOffset + B * G.trackIncrement + G.trackHeight / 2;
        J = Math.round(H - G.iconHeight / 2);
    } var E = SimileAjax.Graphics.createTranslucentImage(I);
    var A = this._timeline.getDocument().createElement("div");
    A.className = this._getElClassName("timeline-event-icon", K, "icon");
    A.id = this._encodeEventElID("icon", K);
    A.style.left = C + "px";
    A.style.top = J + "px";
    A.appendChild(E);
    if (K._title != null) {
        A.title = K._title;
    } this._eventLayer.appendChild(A);
    return { left: C, top: J, width: G.iconWidth, height: G.iconHeight, elmt: A };
};
Timeline.OriginalEventPainter.prototype._paintEventLabel = function (K, L, D, H, A, J, G, E, C) {
    var I = this._timeline.getDocument();
    var B = I.createElement("div");
    B.className = E;
    B.id = this._encodeEventElID("label", K);
    B.style.left = D + "px";
    B.style.width = A + "px";
    B.style.top = H + "px";
    B.innerHTML = L;
    if (K._title != null) {
        B.title = K._title;
    } var F = K.getTextColor();
    if (F == null) {
        F = K.getColor();
    } if (F != null) {
        B.style.color = F;
    } if (G.event.highlightLabelBackground && C >= 0) {
        B.style.background = this._getHighlightColor(C, G);
    } this._eventLayer.appendChild(B);
    return { left: D, top: H, width: A, height: J, elmt: B };
};
Timeline.OriginalEventPainter.prototype._paintEventTape = function (N, B, D, A, G, C, J, I, M) {
    var F = A - D;
    var E = I.event.tape.height;
    var K = J.trackOffset + B * J.trackIncrement;
    var O = this._timeline.getDocument().createElement("div");
    O.className = this._getElClassName("timeline-event-tape", N, "tape");
    O.id = this._encodeEventElID("tape" + M, N);
    O.style.left = D + "px";
    O.style.width = F + "px";
    O.style.height = E + "px";
    O.style.top = K + "px";
    if (N._title != null) {
        O.title = N._title;
    } if (G != null) {
        O.style.backgroundColor = G;
    } var L = N.getTapeImage();
    var H = N.getTapeRepeat();
    H = H != null ? H : "repeat";
    if (L != null) {
        O.style.backgroundImage = "url(" + L + ")";
        O.style.backgroundRepeat = H;
    } SimileAjax.Graphics.setOpacity(O, C);
    this._eventLayer.appendChild(O);
    return { left: D, top: K, width: F, height: E, elmt: O };
};
Timeline.OriginalEventPainter.prototype._getLabelDivClassName = function (A) {
    return this._getElClassName("timeline-event-label", A, "label");
};
Timeline.OriginalEventPainter.prototype._getElClassName = function (D, C, A) {
    var E = C.getClassName(), B = [];
    if (E) {
        if (A) {
            B.push(A + "-" + E + " ");
        } B.push(E + " ");
    } B.push(D);
    return (B.join(""));
};
Timeline.OriginalEventPainter.prototype._getHighlightColor = function (A, B) {
    var C = B.event.highlightColors;
    return C[Math.min(A, C.length - 1)];
};
Timeline.OriginalEventPainter.prototype._createHighlightDiv = function (A, D, F, B) {
    var G = null;
    if (A >= 0) {
        var E = this._timeline.getDocument();
        var C = this._getHighlightColor(A, F);
        G = E.createElement("div");
        G.className = this._getElClassName("timeline-event-highlight", B, "highlight");
        G.id = this._encodeEventElID("highlight0", B);
        G.style.position = "absolute";
        G.style.overflow = "hidden";
        G.style.left = (D.left - 2) + "px";
        G.style.width = (D.width + 4) + "px";
        G.style.top = (D.top - 2) + "px";
        G.style.height = (D.height + 4) + "px";
        G.style.background = C;
        this._highlightLayer.appendChild(G);
    } return G;
};
Timeline.OriginalEventPainter.prototype._onClickInstantEvent = function (C, A, B) {
    var D = SimileAjax.DOM.getPageCoordinates(C);
    this._showBubble(D.left + Math.ceil(C.offsetWidth / 2), D.top + Math.ceil(C.offsetHeight / 2), B);
    this._fireOnSelect(B.getID());
    A.cancelBubble = true;
    SimileAjax.DOM.cancelEvent(A);
    return false;
};
Timeline.OriginalEventPainter.prototype._onClickDurationEvent = function (F, B, C) {
    if ("pageX" in B) {
        var A = B.pageX;
        var E = B.pageY;
    } else {
        var D = SimileAjax.DOM.getPageCoordinates(F);
        var A = B.offsetX + D.left;
        var E = B.offsetY + D.top;
    } this._showBubble(A, E, C);
    this._fireOnSelect(C.getID());
    B.cancelBubble = true;
    SimileAjax.DOM.cancelEvent(B);
    return false;
};
Timeline.OriginalEventPainter.prototype.showBubble = function (A) {
    var B = this._eventIdToElmt[A.getID()];
    if (B) {
        var C = SimileAjax.DOM.getPageCoordinates(B);
        this._showBubble(C.left + B.offsetWidth / 2, C.top + B.offsetHeight / 2, A);
    }
};
Timeline.OriginalEventPainter.prototype._showBubble = function (B, E, C) {
    var D = document.createElement("div");
    var A = this._params.theme.event.bubble;
    C.fillInfoBubble(D, this._params.theme, this._band.getLabeller());
    SimileAjax.WindowManager.cancelPopups();
    SimileAjax.Graphics.createBubbleForContentAndPoint(D, B, E, A.width, null, A.maxHeight);
};
Timeline.OriginalEventPainter.prototype._fireOnSelect = function (A) {
    for (var B = 0;
        B < this._onSelectListeners.length;
        B++) {
        this._onSelectListeners[B](A);
    }
};
Timeline.OriginalEventPainter.prototype._fireEventPaintListeners = function (D, A, C) {
    for (var B = 0;
        B < this._eventPaintListeners.length;
        B++) {
        this._eventPaintListeners[B](this._band, D, A, C);
    }
};


/* overview-painter.js */
Timeline.OverviewEventPainter = function (A) {
    this._params = A;
    this._onSelectListeners = [];
    this._filterMatcher = null;
    this._highlightMatcher = null;
};
Timeline.OverviewEventPainter.prototype.initialize = function (B, A) {
    this._band = B;
    this._timeline = A;
    this._eventLayer = null;
    this._highlightLayer = null;
};
Timeline.OverviewEventPainter.prototype.getType = function () {
    return "overview";
};
Timeline.OverviewEventPainter.prototype.addOnSelectListener = function (A) {
    this._onSelectListeners.push(A);
};
Timeline.OverviewEventPainter.prototype.removeOnSelectListener = function (B) {
    for (var A = 0;
        A < this._onSelectListeners.length;
        A++) {
        if (this._onSelectListeners[A] == B) {
            this._onSelectListeners.splice(A, 1);
            break;
        }
    }
};
Timeline.OverviewEventPainter.prototype.getFilterMatcher = function () {
    return this._filterMatcher;
};
Timeline.OverviewEventPainter.prototype.setFilterMatcher = function (A) {
    this._filterMatcher = A;
};
Timeline.OverviewEventPainter.prototype.getHighlightMatcher = function () {
    return this._highlightMatcher;
};
Timeline.OverviewEventPainter.prototype.setHighlightMatcher = function (A) {
    this._highlightMatcher = A;
};
Timeline.OverviewEventPainter.prototype.paint = function () {
    var C = this._band.getEventSource();
    if (C == null) {
        return;
    } this._prepareForPainting();
    var H = this._params.theme.event;
    var F = { trackOffset: H.overviewTrack.offset, trackHeight: H.overviewTrack.height, trackGap: H.overviewTrack.gap, trackIncrement: H.overviewTrack.height + H.overviewTrack.gap };
    var D = this._band.getMinDate();
    var B = this._band.getMaxDate();
    var I = (this._filterMatcher != null) ? this._filterMatcher : function (J) {
        return true;
    };
    var A = (this._highlightMatcher != null) ? this._highlightMatcher : function (J) {
        return -1;
    };
    var E = C.getEventReverseIterator(D, B);
    while (E.hasNext()) {
        var G = E.next();
        if (I(G)) {
            this.paintEvent(G, F, this._params.theme, A(G));
        }
    } this._highlightLayer.style.display = "block";
    this._eventLayer.style.display = "block";
    this._band.updateEventTrackInfo(this._tracks.length, F.trackIncrement);
};
Timeline.OverviewEventPainter.prototype.softPaint = function () { };
Timeline.OverviewEventPainter.prototype._prepareForPainting = function () {
    var A = this._band;
    this._tracks = [];
    if (this._highlightLayer != null) {
        A.removeLayerDiv(this._highlightLayer);
    } this._highlightLayer = A.createLayerDiv(105, "timeline-band-highlights");
    this._highlightLayer.style.display = "none";
    if (this._eventLayer != null) {
        A.removeLayerDiv(this._eventLayer);
    } this._eventLayer = A.createLayerDiv(110, "timeline-band-events");
    this._eventLayer.style.display = "none";
};
Timeline.OverviewEventPainter.prototype.paintEvent = function (B, C, D, A) {
    if (B.isInstant()) {
        this.paintInstantEvent(B, C, D, A);
    } else {
        this.paintDurationEvent(B, C, D, A);
    }
};
Timeline.OverviewEventPainter.prototype.paintInstantEvent = function (I, H, E, A) {
    var F = I.getStart();
    var B = Math.round(this._band.dateToPixelOffset(F));
    var C = I.getColor(), D = I.getClassName();
    if (D) {
        C = null;
    } else {
        C = C != null ? C : E.event.duration.color;
    } var G = this._paintEventTick(I, B, C, 100, H, E);
    this._createHighlightDiv(A, G, E);
};
Timeline.OverviewEventPainter.prototype.paintDurationEvent = function (L, K, H, B) {
    var A = L.getLatestStart();
    var I = L.getEarliestEnd();
    var J = Math.round(this._band.dateToPixelOffset(A));
    var C = Math.round(this._band.dateToPixelOffset(I));
    var F = 0;
    for (;
        F < this._tracks.length;
        F++) {
        if (C < this._tracks[F]) {
            break;
        }
    } this._tracks[F] = C;
    var E = L.getColor(), G = L.getClassName();
    if (G) {
        E = null;
    } else {
        E = E != null ? E : H.event.duration.color;
    } var D = this._paintEventTape(L, F, J, C, E, 100, K, H, G);
    this._createHighlightDiv(B, D, H);
};
Timeline.OverviewEventPainter.prototype._paintEventTape = function (K, B, D, L, E, C, H, G, F) {
    var I = H.trackOffset + B * H.trackIncrement;
    var A = L - D;
    var J = H.trackHeight;
    var M = this._timeline.getDocument().createElement("div");
    M.className = "timeline-small-event-tape";
    if (F) {
        M.className += " small-" + F;
    } M.style.left = D + "px";
    M.style.width = A + "px";
    M.style.top = I + "px";
    M.style.height = J + "px";
    if (E) {
        M.style.backgroundColor = E;
    } if (C < 100) {
        SimileAjax.Graphics.setOpacity(M, C);
    } this._eventLayer.appendChild(M);
    return { left: D, top: I, width: A, height: J, elmt: M };
};
Timeline.OverviewEventPainter.prototype._paintEventTick = function (J, C, D, B, G, F) {
    var I = F.event.overviewTrack.tickHeight;
    var H = G.trackOffset - I;
    var A = 1;
    var K = this._timeline.getDocument().createElement("div");
    K.className = "timeline-small-event-icon";
    K.style.left = C + "px";
    K.style.top = H + "px";
    var E = J.getClassName();
    if (E) {
        K.className += " small-" + E;
    } if (B < 100) {
        SimileAjax.Graphics.setOpacity(K, B);
    } this._eventLayer.appendChild(K);
    return { left: C, top: H, width: A, height: I, elmt: K };
};
Timeline.OverviewEventPainter.prototype._createHighlightDiv = function (A, C, E) {
    if (A >= 0) {
        var D = this._timeline.getDocument();
        var G = E.event;
        var B = G.highlightColors[Math.min(A, G.highlightColors.length - 1)];
        var F = D.createElement("div");
        F.style.position = "absolute";
        F.style.overflow = "hidden";
        F.style.left = (C.left - 1) + "px";
        F.style.width = (C.width + 2) + "px";
        F.style.top = (C.top - 1) + "px";
        F.style.height = (C.height + 2) + "px";
        F.style.background = B;
        this._highlightLayer.appendChild(F);
    }
};
Timeline.OverviewEventPainter.prototype.showBubble = function (A) { };


/* sources.js */
Timeline.DefaultEventSource = function (A) {
    this._events = (A instanceof Object) ? A : new SimileAjax.EventIndex();
    this._listeners = [];
};
Timeline.DefaultEventSource.prototype.addListener = function (A) {
    this._listeners.push(A);
};
Timeline.DefaultEventSource.prototype.removeListener = function (B) {
    for (var A = 0;
        A < this._listeners.length;
        A++) {
        if (this._listeners[A] == B) {
            this._listeners.splice(A, 1);
            break;
        }
    }
};
Timeline.DefaultEventSource.prototype.loadXML = function (G, A) {
    var C = this._getBaseURL(A);
    var H = G.documentElement.getAttribute("wiki-url");
    var J = G.documentElement.getAttribute("wiki-section");
    var F = G.documentElement.getAttribute("date-time-format");
    var E = this._events.getUnit().getParser(F);
    var D = G.documentElement.firstChild;
    var I = false;
    while (D != null) {
        if (D.nodeType == 1) {
            var L = "";
            if (D.firstChild != null && D.firstChild.nodeType == 3) {
                L = D.firstChild.nodeValue;
            } var B = (D.getAttribute("isDuration") === null && D.getAttribute("durationEvent") === null) || D.getAttribute("isDuration") == "false" || D.getAttribute("durationEvent") == "false";
            var K = new Timeline.DefaultEventSource.Event({ id: D.getAttribute("id"), start: E(D.getAttribute("start")), end: E(D.getAttribute("end")), latestStart: E(D.getAttribute("latestStart")), earliestEnd: E(D.getAttribute("earliestEnd")), instant: B, text: D.getAttribute("title"), description: L, image: this._resolveRelativeURL(D.getAttribute("image"), C), link: this._resolveRelativeURL(D.getAttribute("link"), C), icon: this._resolveRelativeURL(D.getAttribute("icon"), C), color: D.getAttribute("color"), textColor: D.getAttribute("textColor"), hoverText: D.getAttribute("hoverText"), classname: D.getAttribute("classname"), tapeImage: D.getAttribute("tapeImage"), tapeRepeat: D.getAttribute("tapeRepeat"), caption: D.getAttribute("caption"), eventID: D.getAttribute("eventID"), trackNum: D.getAttribute("trackNum") });
            K._node = D;
            K.getProperty = function (M) {
                return this._node.getAttribute(M);
            };
            K.setWikiInfo(H, J);
            this._events.add(K);
            I = true;
        } D = D.nextSibling;
    } if (I) {
        this._fire("onAddMany", []);
    }
};
Timeline.DefaultEventSource.prototype.loadJSON = function (H, B) {
    var D = this._getBaseURL(B);
    var J = false;
    if (H && H.events) {
        var I = ("wikiURL" in H) ? H.wikiURL : null;
        var K = ("wikiSection" in H) ? H.wikiSection : null;
        var F = ("dateTimeFormat" in H) ? H.dateTimeFormat : null;
        var E = this._events.getUnit().getParser(F);
        for (var G = 0;
            G < H.events.length;
            G++) {
            var A = H.events[G];
            var C = A.isDuration || (A.durationEvent != null && !A.durationEvent);
            var L = new Timeline.DefaultEventSource.Event({ id: ("id" in A) ? A.id : undefined, start: E(A.start), end: E(A.end), latestStart: E(A.latestStart), earliestEnd: E(A.earliestEnd), instant: C, text: A.title, description: A.description, image: this._resolveRelativeURL(A.image, D), link: this._resolveRelativeURL(A.link, D), icon: this._resolveRelativeURL(A.icon, D), color: A.color, textColor: A.textColor, hoverText: A.hoverText, classname: A.classname, tapeImage: A.tapeImage, tapeRepeat: A.tapeRepeat, caption: A.caption, eventID: A.eventID, trackNum: A.trackNum });
            L._obj = A;
            L.getProperty = function (M) {
                return this._obj[M];
            };
            L.setWikiInfo(I, K);
            this._events.add(L);
            J = true;
        }
    } if (J) {
        this._fire("onAddMany", []);
    }
};
Timeline.DefaultEventSource.prototype.loadSPARQL = function (I, B) {
    var E = this._getBaseURL(B);
    var H = "iso8601";
    var G = this._events.getUnit().getParser(H);
    if (I == null) {
        return;
    } var F = I.documentElement.firstChild;
    while (F != null && (F.nodeType != 1 || F.nodeName != "results")) {
        F = F.nextSibling;
    } var J = null;
    var L = null;
    if (F != null) {
        J = F.getAttribute("wiki-url");
        L = F.getAttribute("wiki-section");
        F = F.firstChild;
    } var K = false;
    while (F != null) {
        if (F.nodeType == 1) {
            var D = {};
            var A = F.firstChild;
            while (A != null) {
                if (A.nodeType == 1 && A.firstChild != null && A.firstChild.nodeType == 1 && A.firstChild.firstChild != null && A.firstChild.firstChild.nodeType == 3) {
                    D[A.getAttribute("name")] = A.firstChild.firstChild.nodeValue;
                } A = A.nextSibling;
            } if (D["start"] == null && D["date"] != null) {
                D["start"] = D["date"];
            } var C = (D["isDuration"] === null && D["durationEvent"] === null) || D["isDuration"] == "false" || D["durationEvent"] == "false";
            var M = new Timeline.DefaultEventSource.Event({ id: D["id"], start: G(D["start"]), end: G(D["end"]), latestStart: G(D["latestStart"]), earliestEnd: G(D["earliestEnd"]), instant: C, text: D["title"], description: D["description"], image: this._resolveRelativeURL(D["image"], E), link: this._resolveRelativeURL(D["link"], E), icon: this._resolveRelativeURL(D["icon"], E), color: D["color"], textColor: D["textColor"], hoverText: D["hoverText"], caption: D["caption"], classname: D["classname"], tapeImage: D["tapeImage"], tapeRepeat: D["tapeRepeat"], eventID: D["eventID"], trackNum: D["trackNum"] });
            M._bindings = D;
            M.getProperty = function (N) {
                return this._bindings[N];
            };
            M.setWikiInfo(J, L);
            this._events.add(M);
            K = true;
        } F = F.nextSibling;
    } if (K) {
        this._fire("onAddMany", []);
    }
};
Timeline.DefaultEventSource.prototype.add = function (A) {
    this._events.add(A);
    this._fire("onAddOne", [A]);
};
Timeline.DefaultEventSource.prototype.addMany = function (A) {
    for (var B = 0;
        B < A.length;
        B++) {
        this._events.add(A[B]);
    } this._fire("onAddMany", []);
};
Timeline.DefaultEventSource.prototype.clear = function () {
    this._events.removeAll();
    this._fire("onClear", []);
};
Timeline.DefaultEventSource.prototype.getEvent = function (A) {
    return this._events.getEvent(A);
};
Timeline.DefaultEventSource.prototype.getEventIterator = function (A, B) {
    return this._events.getIterator(A, B);
};
Timeline.DefaultEventSource.prototype.getEventReverseIterator = function (A, B) {
    return this._events.getReverseIterator(A, B);
};
Timeline.DefaultEventSource.prototype.getAllEventIterator = function () {
    return this._events.getAllIterator();
};
Timeline.DefaultEventSource.prototype.getCount = function () {
    return this._events.getCount();
};
Timeline.DefaultEventSource.prototype.getEarliestDate = function () {
    return this._events.getEarliestDate();
};
Timeline.DefaultEventSource.prototype.getLatestDate = function () {
    return this._events.getLatestDate();
};
Timeline.DefaultEventSource.prototype._fire = function (B, A) {
    for (var C = 0;
        C < this._listeners.length;
        C++) {
        var D = this._listeners[C];
        if (B in D) {
            try {
                D[B].apply(D, A);
            } catch (E) {
                SimileAjax.Debug.exception(E);
            }
        }
    }
};
Timeline.DefaultEventSource.prototype._getBaseURL = function (A) {
    if (A.indexOf("://") < 0) {
        var C = this._getBaseURL(document.location.href);
        if (A.substr(0, 1) == "/") {
            A = C.substr(0, C.indexOf("/", C.indexOf("://") + 3)) + A;
        } else {
            A = C + A;
        }
    } var B = A.lastIndexOf("/");
    if (B < 0) {
        return "";
    } else {
        return A.substr(0, B + 1);
    }
};
Timeline.DefaultEventSource.prototype._resolveRelativeURL = function (A, B) {
    if (A == null || A == "") {
        return A;
    } else {
        if (A.indexOf("://") > 0) {
            return A;
        } else {
            if (A.substr(0, 1) == "/") {
                return B.substr(0, B.indexOf("/", B.indexOf("://") + 3)) + A;
            } else {
                return B + A;
            }
        }
    }
};
Timeline.DefaultEventSource.Event = function (A) {
    function D(E) {
        return (A[E] != null && A[E] != "") ? A[E] : null;
    } var C = A.id ? A.id.trim() : "";
    this._id = C.length > 0 ? C : Timeline.EventUtils.getNewEventID();
    this._instant = A.instant || (A.end == null);
    this._start = A.start;
    this._end = (A.end != null) ? A.end : A.start;
    this._latestStart = (A.latestStart != null) ? A.latestStart : (A.instant ? this._end : this._start);
    this._earliestEnd = (A.earliestEnd != null) ? A.earliestEnd : this._end;
    var B = [];
    if (this._start > this._latestStart) {
        this._latestStart = this._start;
        B.push("start is > latestStart");
    } if (this._start > this._earliestEnd) {
        this._earliestEnd = this._latestStart;
        B.push("start is > earliestEnd");
    } if (this._start > this._end) {
        this._end = this._earliestEnd;
        B.push("start is > end");
    } if (this._latestStart > this._earliestEnd) {
        this._earliestEnd = this._latestStart;
        B.push("latestStart is > earliestEnd");
    } if (this._latestStart > this._end) {
        this._end = this._earliestEnd;
        B.push("latestStart is > end");
    } if (this._earliestEnd > this._end) {
        this._end = this._earliestEnd;
        B.push("earliestEnd is > end");
    } this._eventID = D("eventID");
    this._text = (A.text != null) ? SimileAjax.HTML.deEntify(A.text) : "";
    if (B.length > 0) {
        this._text += " PROBLEM: " + B.join(", ");
    } this._description = SimileAjax.HTML.deEntify(A.description);
    this._image = D("image");
    this._link = D("link");
    this._title = D("hoverText");
    this._title = D("caption");
    this._icon = D("icon");
    this._color = D("color");
    this._textColor = D("textColor");
    this._classname = D("classname");
    this._tapeImage = D("tapeImage");
    this._tapeRepeat = D("tapeRepeat");
    this._trackNum = D("trackNum");
    if (this._trackNum != null) {
        this._trackNum = parseInt(this._trackNum);
    } this._wikiURL = null;
    this._wikiSection = null;
};
Timeline.DefaultEventSource.Event.prototype = {
    getID: function () {
        return this._id;
    }, isInstant: function () {
        return this._instant;
    }, isImprecise: function () {
        return this._start != this._latestStart || this._end != this._earliestEnd;
    }, getStart: function () {
        return this._start;
    }, getEnd: function () {
        return this._end;
    }, getLatestStart: function () {
        return this._latestStart;
    }, getEarliestEnd: function () {
        return this._earliestEnd;
    }, getEventID: function () {
        return this._eventID;
    }, getText: function () {
        return this._text;
    }, getDescription: function () {
        return this._description;
    }, getImage: function () {
        return this._image;
    }, getLink: function () {
        return this._link;
    }, getIcon: function () {
        return this._icon;
    }, getColor: function () {
        return this._color;
    }, getTextColor: function () {
        return this._textColor;
    }, getClassName: function () {
        return this._classname;
    }, getTapeImage: function () {
        return this._tapeImage;
    }, getTapeRepeat: function () {
        return this._tapeRepeat;
    }, getTrackNum: function () {
        return this._trackNum;
    }, getProperty: function (A) {
        return null;
    }, getWikiURL: function () {
        return this._wikiURL;
    }, getWikiSection: function () {
        return this._wikiSection;
    }, setWikiInfo: function (B, A) {
        this._wikiURL = B;
        this._wikiSection = A;
    }, fillDescription: function (A) {
        A.innerHTML = this._description;
    }, fillWikiInfo: function (D) {
        D.style.display = "none";
        if (this._wikiURL == null || this._wikiSection == null) {
            return;
        } var C = this.getProperty("wikiID");
        if (C == null || C.length == 0) {
            C = this.getText();
        } if (C == null || C.length == 0) {
            return;
        } D.style.display = "inline";
        C = C.replace(/\s/g, "_");
        var B = this._wikiURL + this._wikiSection.replace(/\s/g, "_") + "/" + C;
        var A = document.createElement("a");
        A.href = B;
        A.target = "new";
        //ccadena
        //A.innerHTML=Timeline.strings[Timeline.clientLocale].wikiLinkLabel;
        //D.appendChild(document.createTextNode("["));
        //D.appendChild(A);
        //D.appendChild(document.createTextNode("]"));
    },
    fillTime: function (A, B) {
        if (this._instant) {
            if (this.isImprecise()) {
                A.appendChild(A.ownerDocument.createTextNode(B.labelPrecise(this._start)));
                A.appendChild(A.ownerDocument.createElement("br"));
                A.appendChild(A.ownerDocument.createTextNode(B.labelPrecise(this._end)));
            } else {
                A.appendChild(A.ownerDocument.createTextNode(B.labelPrecise(this._start)));
            }
        } else {
            if (this.isImprecise()) {
                A.appendChild(A.ownerDocument.createTextNode(B.labelPrecise(this._start) + " ~ " + B.labelPrecise(this._latestStart)));
                A.appendChild(A.ownerDocument.createElement("br"));
                A.appendChild(A.ownerDocument.createTextNode(B.labelPrecise(this._earliestEnd) + " ~ " + B.labelPrecise(this._end)));
            } else {
                A.appendChild(A.ownerDocument.createTextNode(B.labelPrecise(this._start)));
                A.appendChild(A.ownerDocument.createElement("br"));
                A.appendChild(A.ownerDocument.createTextNode(B.labelPrecise(this._end)));
            }
        }
    },

    fillInfoBubble: function (A, E, M) {
        var K = A.ownerDocument;
        var J = this.getText();
        var H = this.getLink();
        var B = this.getImage();
        if (B != null) {
            var D = K.createElement("img");
            D.src = B;
            E.event.bubble.imageStyler(D);
            A.appendChild(D);
        } var L = K.createElement("div");
        var C = K.createTextNode(J);
        if (H != null) {
            var I = K.createElement("a");
            I.href = H;
            I.appendChild(C);
            L.appendChild(I);
        } else {
            L.appendChild(C);
        } E.event.bubble.titleStyler(L);
        A.appendChild(L);
        var N = K.createElement("div");
        this.fillDescription(N);
        E.event.bubble.bodyStyler(N);
        A.appendChild(N);
        var G = K.createElement("div");
        this.fillTime(G, M);
        E.event.bubble.timeStyler(G);
        A.appendChild(G);
        var F = K.createElement("div");
        this.fillWikiInfo(F);
        E.event.bubble.wikiStyler(F);
        A.appendChild(F);
    }
};


/* themes.js */
Timeline.ClassicTheme = new Object();
Timeline.ClassicTheme.implementations = [];
Timeline.ClassicTheme.create = function (B) {
    if (B == null) {
        B = Timeline.getDefaultLocale();
    } var A = Timeline.ClassicTheme.implementations[B];
    if (A == null) {
        A = Timeline.ClassicTheme._Impl;
    } return new A();
};
Timeline.ClassicTheme._Impl = function () {
    this.firstDayOfWeek = 0;
    this.autoWidth = false;
    this.autoWidthAnimationTime = 500;
    this.timeline_start = null;
    this.timeline_stop = null;
    this.ether = { backgroundColors: [], highlightOpacity: 50, interval: { line: { show: true, opacity: 25 }, weekend: { opacity: 30 }, marker: { hAlign: "Bottom", vAlign: "Right" } } };
    this.event = {
        track: { height: 10, gap: 2, offset: 2, autoWidthMargin: 1.5 }, overviewTrack: { offset: 20, tickHeight: 6, height: 2, gap: 1, autoWidthMargin: 5 }, tape: { height: 4 }, instant: { icon: Timeline.urlPrefix + "images/dull-blue-circle.png", iconWidth: 10, iconHeight: 10, impreciseOpacity: 20, impreciseIconMargin: 3 }, duration: { impreciseOpacity: 20 }, label: { backgroundOpacity: 50, offsetFromLine: 3 }, highlightColors: ["#FFFF00", "#FFC000", "#FF0000", "#0000FF"], highlightLabelBackground: false, bubble: {
            width: 250, maxHeight: 0, titleStyler: function (A) {
                A.className = "timeline-event-bubble-title";
            }, bodyStyler: function (A) {
                A.className = "timeline-event-bubble-body";
            }, imageStyler: function (A) {
                A.className = "timeline-event-bubble-image";
            }, wikiStyler: function (A) {
                A.className = "timeline-event-bubble-wiki";
            }, timeStyler: function (A) {
                A.className = "timeline-event-bubble-time";
            }
        }
    };
    this.mouseWheel = "scroll";
};


/* timeline.js */
Timeline.version = "2.3.0";
Timeline.ajax_lib_version = SimileAjax.version;
Timeline.display_version = Timeline.version + " (with Ajax lib " + Timeline.ajax_lib_version + ")";
Timeline.strings = {};
Timeline.HORIZONTAL = 0;
Timeline.VERTICAL = 1;
Timeline._defaultTheme = null;
Timeline.getDefaultLocale = function () {
    return Timeline.clientLocale;
};
Timeline.create = function (D, C, E, F) {
    if (Timeline.timelines == null) {
        Timeline.timelines = [];
    } var B = Timeline.timelines.length;
    Timeline.timelines[B] = null;
    var A = new Timeline._Impl(D, C, E, F, B);
    Timeline.timelines[B] = A;
    return A;
};
Timeline.createBandInfo = function (F) {
    var G = ("theme" in F) ? F.theme : Timeline.getDefaultTheme();
    var D = ("eventSource" in F) ? F.eventSource : null;
    var H = new Timeline.LinearEther({ centersOn: ("date" in F) ? F.date : new Date(), interval: SimileAjax.DateTime.gregorianUnitLengths[F.intervalUnit], pixelsPerInterval: F.intervalPixels, theme: G });
    var C = new Timeline.GregorianEtherPainter({ unit: F.intervalUnit, multiple: ("multiple" in F) ? F.multiple : 1, theme: G, align: ("align" in F) ? F.align : undefined });
    var I = { showText: ("showEventText" in F) ? F.showEventText : true, theme: G };
    if ("eventPainterParams" in F) {
        for (var A in F.eventPainterParams) {
            I[A] = F.eventPainterParams[A];
        }
    } if ("trackHeight" in F) {
        I.trackHeight = F.trackHeight;
    } if ("trackGap" in F) {
        I.trackGap = F.trackGap;
    } var B = ("overview" in F && F.overview) ? "overview" : ("layout" in F ? F.layout : "original");
    var E;
    if ("eventPainter" in F) {
        E = new F.eventPainter(I);
    } else {
        switch (B) {
            case "overview": E = new Timeline.OverviewEventPainter(I);
                break;
            case "detailed": E = new Timeline.DetailedEventPainter(I);
                break;
            default: E = new Timeline.OriginalEventPainter(I);
        }
    } return { width: F.width, eventSource: D, timeZone: ("timeZone" in F) ? F.timeZone : 0, ether: H, etherPainter: C, eventPainter: E, theme: G, zoomIndex: ("zoomIndex" in F) ? F.zoomIndex : 0, zoomSteps: ("zoomSteps" in F) ? F.zoomSteps : null };
};
Timeline.createHotZoneBandInfo = function (F) {
    var G = ("theme" in F) ? F.theme : Timeline.getDefaultTheme();
    var D = ("eventSource" in F) ? F.eventSource : null;
    var H = new Timeline.HotZoneEther({ centersOn: ("date" in F) ? F.date : new Date(), interval: SimileAjax.DateTime.gregorianUnitLengths[F.intervalUnit], pixelsPerInterval: F.intervalPixels, zones: F.zones, theme: G });
    var C = new Timeline.HotZoneGregorianEtherPainter({ unit: F.intervalUnit, zones: F.zones, theme: G, align: ("align" in F) ? F.align : undefined });
    var I = { showText: ("showEventText" in F) ? F.showEventText : true, theme: G };
    if ("eventPainterParams" in F) {
        for (var A in F.eventPainterParams) {
            I[A] = F.eventPainterParams[A];
        }
    } if ("trackHeight" in F) {
        I.trackHeight = F.trackHeight;
    } if ("trackGap" in F) {
        I.trackGap = F.trackGap;
    } var B = ("overview" in F && F.overview) ? "overview" : ("layout" in F ? F.layout : "original");
    var E;
    if ("eventPainter" in F) {
        E = new F.eventPainter(I);
    } else {
        switch (B) {
            case "overview": E = new Timeline.OverviewEventPainter(I);
                break;
            case "detailed": E = new Timeline.DetailedEventPainter(I);
                break;
            default: E = new Timeline.OriginalEventPainter(I);
        }
    } return { width: F.width, eventSource: D, timeZone: ("timeZone" in F) ? F.timeZone : 0, ether: H, etherPainter: C, eventPainter: E, theme: G, zoomIndex: ("zoomIndex" in F) ? F.zoomIndex : 0, zoomSteps: ("zoomSteps" in F) ? F.zoomSteps : null };
};
Timeline.getDefaultTheme = function () {
    if (Timeline._defaultTheme == null) {
        Timeline._defaultTheme = Timeline.ClassicTheme.create(Timeline.getDefaultLocale());
    } return Timeline._defaultTheme;
};
Timeline.setDefaultTheme = function (A) {
    Timeline._defaultTheme = A;
};
Timeline.loadXML = function (A, C) {
    var D = function (G, F, E) {
        alert("Failed to load data xml from " + A + "\n" + G);
    };
    var B = function (F) {
        var E = F.responseXML;
        if (!E.documentElement && F.responseStream) {
            E.load(F.responseStream);
        } C(E, A);
    };
    SimileAjax.XmlHttp.get(A, D, B);
};
Timeline.loadJSON = function (url, f) {
    var fError = function (statusText, status, xmlhttp) {
        alert("Failed to load json data from " + url + "\n" + statusText);
    };
    var fDone = function (xmlhttp) {
        f(eval("(" + xmlhttp.responseText + ")"), url);
    };
    SimileAjax.XmlHttp.get(url, fError, fDone);
};
Timeline.getTimelineFromID = function (A) {
    return Timeline.timelines[A];
};
Timeline.writeVersion = function (A) {
    document.getElementById(A).innerHTML = this.display_version;
};
Timeline._Impl = function (C, B, D, E, A) {
    SimileAjax.WindowManager.initialize();
    this._containerDiv = C;
    this._bandInfos = B;
    this._orientation = D == null ? Timeline.HORIZONTAL : D;
    this._unit = (E != null) ? E : SimileAjax.NativeDateUnit;
    this._starting = true;
    this._autoResizing = false;
    this.autoWidth = B && B[0] && B[0].theme && B[0].theme.autoWidth;
    this.autoWidthAnimationTime = B && B[0] && B[0].theme && B[0].theme.autoWidthAnimationTime;
    this.timelineID = A;
    this.timeline_start = B && B[0] && B[0].theme && B[0].theme.timeline_start;
    this.timeline_stop = B && B[0] && B[0].theme && B[0].theme.timeline_stop;
    this.timeline_at_start = false;
    this.timeline_at_stop = false;
    this._initialize();
};
Timeline._Impl.prototype.dispose = function () {
    for (var A = 0;
        A < this._bands.length;
        A++) {
        this._bands[A].dispose();
    } this._bands = null;
    this._bandInfos = null;
    this._containerDiv.innerHTML = "";
    Timeline.timelines[this.timelineID] = null;
};
Timeline._Impl.prototype.getBandCount = function () {
    return this._bands.length;
};
Timeline._Impl.prototype.getBand = function (A) {
    return this._bands[A];
};
Timeline._Impl.prototype.finishedEventLoading = function () {
    this._autoWidthCheck(true);
    this._starting = false;
};
Timeline._Impl.prototype.layout = function () {
    this._autoWidthCheck(true);
    this._distributeWidths();
};
Timeline._Impl.prototype.paint = function () {
    for (var A = 0;
        A < this._bands.length;
        A++) {
        this._bands[A].paint();
    }
};
Timeline._Impl.prototype.getDocument = function () {
    return this._containerDiv.ownerDocument;
};
Timeline._Impl.prototype.addDiv = function (A) {
    this._containerDiv.appendChild(A);
};
Timeline._Impl.prototype.removeDiv = function (A) {
    this._containerDiv.removeChild(A);
};
Timeline._Impl.prototype.isHorizontal = function () {
    return this._orientation == Timeline.HORIZONTAL;
};
Timeline._Impl.prototype.isVertical = function () {
    return this._orientation == Timeline.VERTICAL;
};
Timeline._Impl.prototype.getPixelLength = function () {
    return this._orientation == Timeline.HORIZONTAL ? this._containerDiv.offsetWidth : this._containerDiv.offsetHeight;
};
Timeline._Impl.prototype.getPixelWidth = function () {
    return this._orientation == Timeline.VERTICAL ? this._containerDiv.offsetWidth : this._containerDiv.offsetHeight;
};
Timeline._Impl.prototype.getUnit = function () {
    return this._unit;
};
Timeline._Impl.prototype.getWidthStyle = function () {
    return this._orientation == Timeline.HORIZONTAL ? "height" : "width";
};
Timeline._Impl.prototype.loadXML = function (B, D) {
    var A = this;
    var E = function (H, G, F) {
        alert("Failed to load data xml from " + B + "\n" + H);
        A.hideLoadingMessage();
    };
    var C = function (G) {
        try {
            var F = G.responseXML;
            if (!F.documentElement && G.responseStream) {
                F.load(G.responseStream);
            } D(F, B);
        } finally {
            A.hideLoadingMessage();
        }
    };
    this.showLoadingMessage();
    window.setTimeout(function () {
        SimileAjax.XmlHttp.get(B, E, C);
    }, 0);
};
Timeline._Impl.prototype.loadJSON = function (url, f) {
    var tl = this;
    var fError = function (statusText, status, xmlhttp) {
        alert("Failed to load json data from " + url + "\n" + statusText);
        tl.hideLoadingMessage();
    };
    var fDone = function (xmlhttp) {
        try {
            f(eval("(" + xmlhttp.responseText + ")"), url);
        } finally {
            tl.hideLoadingMessage();
        }
    };
    this.showLoadingMessage();
    window.setTimeout(function () {
        SimileAjax.XmlHttp.get(url, fError, fDone);
    }, 0);
};
Timeline._Impl.prototype._autoWidthScrollListener = function (A) {
    A.getTimeline()._autoWidthCheck(false);
};
Timeline._Impl.prototype._autoWidthCheck = function (C) {
    var A = this;
    var B = A._starting;
    var D = 0;
    function E() {
        var G = A.getWidthStyle();
        if (B) {
            A._containerDiv.style[G] = D + "px";
        } else {
            A._autoResizing = true;
            var H = {};
            H[G] = D + "px";
            SimileAjax.jQuery(A._containerDiv).animate(H, A.autoWidthAnimationTime, "linear", function () {
                A._autoResizing = false;
            });
        }
    } function F() {
        var H = 0;
        var G = A.getPixelWidth();
        if (A._autoResizing) {
            return;
        } for (var I = 0;
            I < A._bands.length;
            I++) {
            A._bands[I].checkAutoWidth();
            H += A._bandInfos[I].width;
        } if (H > G || C) {
            D = H;
            E();
            A._distributeWidths();
        }
    } if (!A.autoWidth) {
        return;
    } F();
};
Timeline._Impl.prototype._initialize = function () {
    var H = this._containerDiv;
    var E = H.ownerDocument;
    H.className = H.className.split(" ").concat("timeline-container").join(" ");
    var C = (this.isHorizontal()) ? "horizontal" : "vertical";
    H.className += " timeline-" + C;
    while (H.firstChild) {
        H.removeChild(H.firstChild);
    } var A = SimileAjax.Graphics.createTranslucentImage(Timeline.urlPrefix + (this.isHorizontal() ? "images/copyright-vertical.png" : "images/copyright.png"));
    A.className = "timeline-copyright";
    A.title = "Timeline copyright SIMILE - www.code.google.com/p/simile-widgets/";
    SimileAjax.DOM.registerEvent(A, "click", function () {
        window.location = "http://code.google.com/p/simile-widgets/";
    });
    H.appendChild(A);
    this._bands = [];
    for (var B = 0;
        B < this._bandInfos.length;
        B++) {
        var G = new Timeline._Band(this, this._bandInfos[B], B);
        this._bands.push(G);
    } this._distributeWidths();
    for (var B = 0;
        B < this._bandInfos.length;
        B++) {
        var F = this._bandInfos[B];
        if ("syncWith" in F) {
            this._bands[B].setSyncWithBand(this._bands[F.syncWith], ("highlight" in F) ? F.highlight : false);
        }
    } if (this.autoWidth) {
        for (var B = 0;
            B < this._bands.length;
            B++) {
            this._bands[B].addOnScrollListener(this._autoWidthScrollListener);
        }
    } var D = SimileAjax.Graphics.createMessageBubble(E);
    D.containerDiv.className = "timeline-message-container";
    H.appendChild(D.containerDiv);
    D.contentDiv.className = "timeline-message";
    D.contentDiv.innerHTML = "<img src='" + Timeline.urlPrefix + "images/progress-running.gif' /> Loading...";
    this.showLoadingMessage = function () {
        D.containerDiv.style.display = "block";
    };
    this.hideLoadingMessage = function () {
        D.containerDiv.style.display = "none";
    };
};
Timeline._Impl.prototype._distributeWidths = function () {
    var G = this.getPixelLength();
    var B = this.getPixelWidth();
    var C = 0;
    for (var F = 0;
        F < this._bands.length;
        F++) {
        var J = this._bands[F];
        var I = this._bandInfos[F];
        var E = I.width;
        var D;
        if (typeof E == "string") {
            var H = E.indexOf("%");
            if (H > 0) {
                var A = parseInt(E.substr(0, H));
                D = Math.round(A * B / 100);
            } else {
                D = parseInt(E);
            }
        } else {
            D = E;
        } J.setBandShiftAndWidth(C, D);
        J.setViewLength(G);
        C += D;
    }
};
Timeline._Impl.prototype.shiftOK = function (C, B) {
    var F = B > 0, A = B < 0;
    if ((F && this.timeline_start == null) || (A && this.timeline_stop == null) || (B == 0)) {
        return (true);
    } var H = false;
    for (var E = 0;
        E < this._bands.length && !H;
        E++) {
        H = this._bands[E].busy();
    } if (H) {
        return (true);
    } if ((F && this.timeline_at_start) || (A && this.timeline_at_stop)) {
        return (false);
    } var D = false;
    for (var E = 0;
        E < this._bands.length && !D;
        E++) {
        var G = this._bands[E];
        if (F) {
            D = (E == C ? G.getMinVisibleDateAfterDelta(B) : G.getMinVisibleDate()) >= this.timeline_start;
        } else {
            D = (E == C ? G.getMaxVisibleDateAfterDelta(B) : G.getMaxVisibleDate()) <= this.timeline_stop;
        }
    } if (F) {
        this.timeline_at_start = !D;
        this.timeline_at_stop = false;
    } else {
        this.timeline_at_stop = !D;
        this.timeline_at_start = false;
    } return (D);
};
Timeline._Impl.prototype.zoom = function (D, A, G, F) {
    var C = new RegExp("^timeline-band-([0-9]+)$");
    var E = null;
    var B = C.exec(F.id);
    if (B) {
        E = parseInt(B[1]);
    } if (E != null) {
        this._bands[E].zoom(D, A, G, F);
    } this.paint();
};


/* units.js */
Timeline.NativeDateUnit = new Object();
Timeline.NativeDateUnit.createLabeller = function (B, A) {
    return new Timeline.GregorianDateLabeller(B, A);
};
Timeline.NativeDateUnit.makeDefaultValue = function () {
    return new Date();
};
Timeline.NativeDateUnit.cloneValue = function (A) {
    return new Date(A.getTime());
};
Timeline.NativeDateUnit.getParser = function (A) {
    if (typeof A == "string") {
        A = A.toLowerCase();
    } return (A == "iso8601" || A == "iso 8601") ? Timeline.DateTime.parseIso8601DateTime : Timeline.DateTime.parseGregorianDateTime;
};
Timeline.NativeDateUnit.parseFromObject = function (A) {
    return Timeline.DateTime.parseGregorianDateTime(A);
};
Timeline.NativeDateUnit.toNumber = function (A) {
    return A.getTime();
};
Timeline.NativeDateUnit.fromNumber = function (A) {
    return new Date(A);
};
Timeline.NativeDateUnit.compare = function (D, C) {
    var B, A;
    if (typeof D == "object") {
        B = D.getTime();
    } else {
        B = Number(D);
    } if (typeof C == "object") {
        A = C.getTime();
    } else {
        A = Number(C);
    } return B - A;
};
Timeline.NativeDateUnit.earlier = function (B, A) {
    return Timeline.NativeDateUnit.compare(B, A) < 0 ? B : A;
};
Timeline.NativeDateUnit.later = function (B, A) {
    return Timeline.NativeDateUnit.compare(B, A) > 0 ? B : A;
};
Timeline.NativeDateUnit.change = function (A, B) {
    return new Date(A.getTime() + B);
};