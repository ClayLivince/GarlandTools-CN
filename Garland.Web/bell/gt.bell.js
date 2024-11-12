gt = {
    countdownWarning: '1:00',
    countdownWarning2: '0:05',
    isTouchDevice: false,
    timerData: { },

    t: function(obj) {
        return gt.locale.translate(obj);
    },

    tw: function(str) {
        // So nasty
        var regex = /[a-zA-Z'\s]+[a-zA-Z'$]+/;
        try{
            var word = regex.exec(str)[0];
            var value = str.split(regex)[1];
            return gt.locale.translate(word) + value;
        } catch (e){
            return str;
        }
    }
};

gt.bell = {
    nodes: null,
    fish: null,
    bait: null,
    timers: null,
    timerMap: null,
    is24Hour: false,
    timeOffset: 0,
    isLive: window.location.hostname != 'localhost'
        && window.location.hostname != '127.0.0.1',
    //isLive: true,

    settings: {
        filters: ['.patch-2', '.patch-3', '.patch-4', '.patch-5', '.patch-6', '.patch-7', '.fish', '.GATE', '.hunt'],
        lists: [],
        tone: 'alarm1',
        tone2: 'alarm2',
        volume: 50,
        volume2: 50,
        warning: 60,
        warning2: 3,
        mute: false,
        list: false,
        unlimitedColumns: true,
        compact: false,
        colorblind: false,
        search: '',
        serverTime: false,
        timeline: true,
        maps: true,
        rotations: false,
        rotationsFilter: 'stormblood',
        hidden: {},
        layout: 'block',
        hiddenWarnings: {},
        timersActive: true
    },
    timerElements: { },

    initialize: function() {
        try {
            if (window.Sentry && gt.bell.isLive) {
                window.Sentry.init({
                    dsn: 'https://953f84152b6e41749c98236cb9e3f664@sentry.io/172375',
                    environment: gt.bell.isLive ? 'prod' : 'dev'
                });
            }

            if ('ontouchstart' in window) {
                    if (window.FastClick)
                        window.FastClick(document.body);
                gt.isTouchDevice = true;
                $('body').addClass('touch');
            }

            // Miscellany
            var sample = gt.time.formatTime(new Date());
            if (sample.indexOf('M') == -1)
                gt.bell.is24Hour = true;

            // Layout
            gt.layout.initialize();
            gt.layout.table.initialize();
            gt.layout.block.initialize();

            gt.bell.initializeDisplay();

            gt.timer.updateKey = setInterval(gt.timer.update, 1000);
        } catch (ex) {
            if (!gt.bell.retryLoad())
                throw ex;
        }
    },

    retryLoad: function() {
        try {
            // Force a server refresh once a day if errors encountered.
            var lastRetry = localStorage.bellRetry ? new Date(parseInt(localStorage.bellRetry)) : null;
            var now = new Date();
            if (lastRetry) {
                var diffDays = (now - lastRetry) / (1000 * 60 * 60 * 24);
                if (diffDays < 1)
                    return;
            }

            localStorage.bellRetry = now.getTime();
            window.location.reload(true);
            return true;
        } catch (ex) {
            // Ignore, fall back to error writing.
            console.error(ex);
        }

        return false;
    },

    preloadAudioTags: function() {
        if (!gt.bell.settings.mute) {
            try {
                if (gt.bell.settings.tone)
                    $('#' + gt.bell.settings.tone).attr("preload", "auto");
            
                if (gt.bell.settings.tone2)
                    $('#' + gt.bell.settings.tone2).attr("preload", "auto");
            } catch (ex) {
                // Primarily from IE.
                gt.bell.showWarning('preload-failed');
            }
        }
    },

    initializeDisplay: function() {
        // Main layout
        var mainTemplate = doT.template($('#main-template').text());
        $('body').html(mainTemplate());

        gt.bell.updateTime(new Date());

        // Settings
        var settings = gt.bell.loadSettings();

        // Timers
        var allTimers = _.union(gt.bell.nodes, gt.bell.fish, gt.bell.timers, gt.timerData.tripletriad);
        gt.bell.timerMap = _.reduce(allTimers, function(memo, t) { memo[t.id] = t; return memo; }, {});

        // Main container
        var mainList = { name: 'Timers', main: true, hidden: gt.bell.settings.timersHidden };
        var $mainList = $(gt.layout.engine.templates.timerList(mainList));
        $mainList.data('list', mainList);

        $('#timer-container').append($mainList);
        gt.layout.engine.setupList(mainList, $mainList);
            
        gt.bell.initializeStarred();
        gt.bell.reactivateTimers();

        gt.timeline.render();
        gt.map.render();

        // Event handlers
        $('#change-lang').click(gt.locale.changeLang);
        $('#filters .filter').click(gt.bell.filterClicked);
        $('#alarm-toggle').click(gt.bell.alarmToggleClicked);
        $('#settings-toggle').click(gt.bell.settingToggleClicked);
        $('#mode-toggle').click(gt.bell.modeToggleClicked);
        $('#unlimited-columns-setting').click(gt.bell.unlimitedColumnsClicked);
        $('#compact-setting').click(gt.bell.compactSettingClicked);
        $('#colorblind-setting').click(gt.bell.colorblindSettingClicked);
        $('#servertime-setting').click(gt.bell.serverTimeSettingClicked);
        $('#volume').change(gt.bell.alarmVolumeChanged);
        $('#tone').change(gt.bell.alarmToneChanged);
        $('#warning').change(gt.bell.alarmWarningChanged);
        $('#volume2').change(gt.bell.alarmVolume2Changed);
        $('#tone2').change(gt.bell.alarmTone2Changed);
        $('#warning2').change(gt.bell.alarmWarning2Changed);
        $('#search').bind('input', gt.bell.searchInput);
        $('#timeline-header').click(gt.bell.timelineHeaderClicked);
        $('#maps-header').click(gt.bell.mapsHeaderClicked);
        $('#rotation-header').click(gt.bell.rotationsHeaderClicked);
        $('#rotations-filter .button').click(gt.bell.rotationsFilterClicked);
        $('#global-popover-overlay').click(gt.bell.dismissListPopover);
        $('#list-popover-check').click(gt.bell.listPopoverCheckClicked);
        $('#timer-remove-overlay').click(gt.bell.timerRemoveOverlayClicked);
        $('#warnings .dismiss-link').click(gt.bell.dismissWarningClicked);
        $('#lmain .header').click(gt.bell.timerListHeaderClicked);

        gt.bell.preloadAudioTags();
    },

    initializeStarred: function() {
        var now = gt.time.now();

        var lists = gt.bell.settings.lists;
        for (var i = 0; i < lists.length; i++)
            gt.bell.initializeStarredList(lists[i], now);
    },

    initializeStarredList: function(list, now) {
        var $timerList = $(gt.layout.engine.templates.timerList(list));
        $timerList.data('list', list);
        $('#lmain').before($timerList);

        gt.layout.engine.setupList(list, $timerList);

        var removedIds = [];
        for (var i = 0 ; i < list.timers.length; i++) {
            var def = gt.bell.timerMap[list.timers[i]];
            if (!def) {
                // Node probably removed.
                removedIds.push(list.timers[i]);
                continue;
            }

            def.isStarred = 1;
            gt.bell.activateTimer(def, now, list);
        }

        if (removedIds.length) {
            for (var i = 0; i < removedIds.length; i++)
                list.timers = _.without(list.timers, removedIds[i]);
        }

        gt.layout.engine.sort(list.name);

        $('.header', $timerList).click(gt.bell.timerListHeaderClicked);
    },

    reactivateTimers: function() {
        var now = gt.time.now();
        var filters = gt.bell.convertFilters(gt.bell.settings.filters);
        var mainList = { name: 'Timers', main: true }; // hack

        // Mark existing timers inactive.
        for (var key in gt.bell.timerElements)
            gt.bell.timerElements[key].active = 0;

        var allDefs = _.union(gt.bell.nodes, gt.bell.fish, gt.bell.timers, gt.timerData.tripletriad);
        var visibleCount = 0;
        for (var i = 0; i < allDefs.length; i++) {
            var def = allDefs[i];
            if (gt.bell.isFiltered(def, filters))
                continue;

            visibleCount++;
            gt.bell.activateTimer(def, now, mainList);
        }

        // Remove any inactive timers.
        for (var key in gt.bell.timerElements) {
            var info = gt.bell.timerElements[key];
            if (!info.active) {
                gt.layout.engine.remove(mainList, info.element);
                delete gt.bell.timerElements[key];
            }
        }

        // Arrange the new timers.
        gt.layout.engine.sort(mainList.name);

        // Stats
        var total = gt.bell.timers.length + gt.bell.fish.length + gt.bell.nodes.length;
        var hidden = total - visibleCount;
        var parts = [visibleCount + ' ' + gt.t('timers')];
        if (hidden > 0)
            parts.push(hidden + ' ' + gt.t('hidden'));
        var stats = parts.join(', ');
        $('#node-stats').text(stats);
    },

    convertFilters: function(filters) {
        var patches = [];
        if (!_.contains(filters, '.patch-2')) {
            patches.push('1');
            patches.push('2');
        }
        if (!_.contains(filters, '.patch-3'))
            patches.push('3');
        if (!_.contains(filters, '.patch-4'))
            patches.push('4');
        if (!_.contains(filters, '.patch-5'))
            patches.push('5');
        if (!_.contains(filters, '.patch-6'))
            patches.push('6');
        if (!_.contains(filters, '.patch-7'))
            patches.push('7');

        return {
            // Classes
            miner: !_.contains(filters, '.miner'),
            botanist: !_.contains(filters, '.botanist'),
            fish: !_.contains(filters, '.fish'),

            // Types
            unspoiled: !_.contains(filters, '.unspoiled'),
            ephemeral: !_.contains(filters, '.ephemeral'),
            legendary: !_.contains(filters, '.legendary'),

            // Tasks (inverted)
            reducibleOnly: _.contains(filters, '.reducible'),
            whitescripsOnly: _.contains(filters, '.whitescrips'),
            purplescripsOnly: _.contains(filters, '.purplescrips'),
            orangescripsOnly: _.contains(filters, '.orangescrips'),
            hiddenOnly: _.contains(filters, '.hidden'),

            // Other
            gate: !_.contains(filters, '.GATE'),
            hunt: !_.contains(filters, '.hunt'),
            patches: patches
        };
    },

    isFiltered: function(def, filters) {
        // Temporary hack until always-available stuff is working.
        if (def.func == 'fish' && !def.during && !def.weather)
            return true;

        // Search terms take precedence over other filters and hiding.
        var query = gt.bell.settings.search;
        if (query && query.length > 1) {
            // Check contained items.
            if (def.items) {
                if (_.find(def.items, function(i) { return i.item.toLowerCase().indexOf(query) != -1; }))
                    return false;
            }

            if (def.title && def.title.toLowerCase().indexOf(query) != -1)
                return false;
            if (def.name && def.name.toLowerCase().indexOf(query) != -1)
                return false;
            if (def.desc && def.desc.toLowerCase().indexOf(query) != -1)
                return false;
            if (def.zone && def.zone.toLowerCase().indexOf(query) != -1)
                return false;

            // Not found, filter out.
            return true;
        }

        // Hidden only overrides others.
        if (filters.hiddenOnly)
            return !gt.bell.settings.hidden[def.id];

        // Manually hidden timers.
        if (gt.bell.settings.hidden[def.id])
            return true;

        // Patch filtering.
        if (def.zone){
            let zonePatch = gt.location.toPatch[def.zone];
            if (zonePatch == null) {
                if (def.patch)
                    zonePatch = def.patch;
                else zonePatch = 2;
            }

            var patch = Number(zonePatch).toFixed(1);
            if (!_.any(filters.patches, function(p) { return patch.indexOf(p) == 0; } ))
                return true;
        }

        // No search, proceed with normal filtering.
        if (def.func == 'node') {
            if (!filters.miner && (def.type == "矿脉" || def.type == "石场"))
                return true;
            if (!filters.botanist && (def.type == "良材" || def.type == "草场"))
                return true;
            if (!filters.unspoiled && def.name == "Unspoiled")
                return true;
            if (!filters.ephemeral && def.name == "Ephemeral")
                return true;
            if (!filters.legendary && def.name == "Legendary")
                return true;
            if (filters.reducibleOnly && !_.any(def.items, function(i) { return i.reduce; }))
                return true;
            if (filters.whitescripsOnly && !_.any(def.items, function(i) { return i.scrip == "大地白票"; }))
                return true;
            if (filters.purplescripsOnly && !_.any(def.items, function(i) { return i.scrip == "大地紫票"; }))
                return true;
            if (filters.orangescripsOnly && !_.any(def.items, function(i) { return i.scrip == "大地橙票"; }))
                return true;
        } else if (def.func == 'fish') {
            if (!filters.fish)
                return true;
            if (filters.reducibleOnly && !def.reduce)
                return true;
            if (filters.whitescripsOnly && def.scrip != "大地白票")
                return true;
            if (filters.purplescripsOnly && def.scrip != "大地紫票")
                return true;
            if (filters.orangescripsOnly && def.scrip != "大地橙票")
                return true;
        } else if (def.func == 'hunt') {
            if (!filters.hunt)
                return true;
        } else if (def.func == 'GATE' || def.func == 'tripletriad') {
            if (!filters.gate)
                return true;
        }

        // Not filtered - visible.
        return false;
    },

    activateTimer: function(def, now, list) {
        if (list && list.main && gt.bell.timerElements[def.id]) {
            gt.bell.timerElements[def.id].active = true;
            return;
        }

        var timer = gt.bell.createTimer(def, now);
        timer.star = def.isStarred;
        timer.hidden = gt.bell.settings.hidden[def.id] ? 1 : 0;

        var $timer = $(gt.layout.engine.templates.timer(timer));
        $timer.data('view', timer);
        
        if (timer.progress)
            $timer.data('next-spawn-change', timer.progress.change.getTime() + 1001);

        if (list && list.main)
            gt.bell.timerElements[def.id] = { element: $timer, active: true };

        if (list)
            gt.layout.engine.append(list, $timer);

        $timer.click(gt.bell.timerClicked);

        return $timer;
    },

    createTimer: function(def, now) {
        var timer = new gt.timer[def.func](now, def);
        if (timer.isTimed) {
            for (var i = 0; i < 1000; i++) {
                // 1000 iterations is just a precaution, should break before that.
                if (!timer.next(now))
                    break;
            }

            timer.progress = gt.timer.progress(now, timer.period);
        }

        timer.title = def.title;
        timer.id = def.id;
        timer.desc = def.desc;
        timer.def = def;
        return timer;
    },

    updateTime: function(now) {
        var eNow = gt.time.localToEorzea(now);
        var currentEorzeaTime = gt.bell.formatHoursMinutesUTC(eNow);

        // Set time value.
        var timeElement = document.getElementById('time');
        if (timeElement)
            timeElement.innerText = currentEorzeaTime;

        // Set title.
        if (gt.layout.engine) {
            var soonestView = gt.layout.engine.getSoonestView();
            var title = currentEorzeaTime;
            if (soonestView && soonestView.progress) {
                var progress = soonestView.progress;
                title += ' [' + progress.countdown + (progress.state == "active" ? "+" : "") + ']';
            }

            var titleElement = document.getElementsByTagName('title')[0];
            if (titleElement)
                titleElement.innerText = title + ' Garland Bell';

            // Tick the timeline.
            gt.timeline.tick(eNow);
        }
    },

    formatHours: function(hour) {
        if (gt.bell.is24Hour)
            return hour;

        if (hour == 0)
            hour = 24;

        return ((hour - 1) % 12 + 1) + ' ' + (hour > 11 && hour < 24 ? 'PM' : 'AM');
    },

    formatHoursMinutesUTC: function(date) {
        var hours = date.getUTCHours();
        var minutes = gt.util.zeroPad(date.getUTCMinutes(), 2);

        if (gt.bell.is24Hour)
            return hours + ':' + minutes

        if (hours == 0)
            hours = 24;

        return ((hours - 1) % 12 + 1) + ':' + minutes + ' ' + (hours > 11 && hours < 24 ? 'PM' : 'AM');
    },

    filterClicked: function(e) {
        e.stopPropagation();

        var $this = $(this);

        // Handle exclusive tasks.
        var exclusiveTag = $this.data('exclusive');
        if (exclusiveTag && !$this.hasClass('active'))
            $('#filters .filter[data-exclusive=' + exclusiveTag + '].active').removeClass('active');

        $this.toggleClass('active');

        // Record filter state.
        var filters = _.map($('#filters .filter[data-invert=0]:not(.active)'), function(e) { return $(e).data('filter'); });
        var invertedFilters = _.map($('#filters .filter[data-invert=1].active'), function(e) { return $(e).data('filter'); });
        gt.bell.settings.filters = _.union(filters, invertedFilters);

        // Reactivate hidden timers if needed.
        if (gt.bell.settings.timersHidden)
            gt.bell.unhideMainList();

        gt.bell.reactivateTimers();
        gt.bell.saveSettings();

        return false;
    },

    unhideMainList: function() {
        gt.bell.settings.timersHidden = false;
        $('#lmain.timer-list').removeClass('hidden');
    },

    dismissListPopover: function(e) {
        if (e)
            e.stopPropagation();

        $('#list-popover, #global-popover-overlay').hide();
        return false;
    },

    listPopoverCheckClicked: function(e) {
        e.stopPropagation();

        var timerid = $('#list-popover-entries').data('id');

        var hidden = gt.bell.settings.hidden;
        if (hidden[timerid])
            delete hidden[timerid];
        else
            hidden[timerid] = 1;

        gt.bell.reactivateTimers();
        gt.bell.dismissListPopover();
        gt.bell.saveSettings();

        return false;
    },

    timerClicked: function(e) {
        if ($(e.target).closest('a').length)
            return true;

        e.stopPropagation();

        var $this = $(this);
        var $timer = $this.closest('.timer');
        var $main = $timer.closest('#lmain');
        if ($main.length || !$this.hasClass('star'))
            gt.bell.star($timer);
        else {
            var $overlay = $('#timer-remove-overlay');

            // Need special positioning for the table.
            if (gt.bell.settings.layout == 'table') {            
                var rect = $timer[0].getBoundingClientRect();
                var scrollTop = window.scrollY + (document.body.scrollTop == window.scrollY ? 0 : document.body.scrollTop);
                var scrollLeft = window.scrollX + (document.body.scrollLeft == window.scrollX ? 0 : document.body.scrollLeft);
                $overlay.css('top', (rect.top + scrollTop) + 'px');
                $overlay.css('left', (rect.left + scrollLeft) + 'px');
                $overlay.css('width', (rect.right - rect.left) + 'px');
                $overlay.css('height', (rect.bottom - rect.top) + 'px');
            }

            $timer.append($overlay);

            // Remove the overlay after 3 seconds.
            setTimeout(function() {
                if ($overlay.closest('.timer')[0] == $timer[0]) {
                    $('body').append($overlay);
                }
            }, 2000);
        }

        return false;
    },

    timerRemoveOverlayClicked: function(e) {
        e.stopPropagation();

        var $timer = $(this).closest('.timer');
        $('body').append($('#timer-remove-overlay'));
        gt.bell.unstar($timer);

        return false;
    },

    star: function($timer) {
        var view = $timer.data('view');
        var timerid = $timer.data('id');

        // Not starred.  Find the list to add this timer to.
        var $popover = $('#list-popover-entries');
        $popover.data('id', timerid);

        // Create the popover list entries, with a constant list for favorites.
        var entries = gt.bell.settings.lists.slice();
        if (!_.any(gt.bell.settings.lists, function(l) { return l.name == gt.t('Favorites'); }))
            entries.push({ name: gt.t('Favorites') });

        // Append entries with metadata.
        $popover.empty();
        for (var i = 0; i < entries.length; i++) {
            var entry = entries[i];
            var $entry = $(gt.layout.templates.listEntry(entry));
            $entry.data('listname', entry.name);
            $popover.append($entry);
        }

        $popover.append($('<div class="entry new">' + gt.t('Create new list') + '</div>'));

        // Create a timer block to display.
        var currentLayoutEngine = gt.layout.engine;
        gt.layout.engine = gt.layout.block;

        var timer = gt.bell.createTimer(view.def, gt.time.now());
        var $popoverTimer = $(gt.layout.block.templates.timer(timer));
        $popoverTimer.data('view', timer);
        if (timer.progress)
            $popoverTimer.data('next-spawn-change', timer.progress.change.getTime() + 1001);

        gt.layout.engine = currentLayoutEngine;

        // Show the popover.
        $('#list-popover-timer').empty().append($popoverTimer);
        $('#global-popover-overlay, #list-popover').show();

        // Bind events
        $('.entry', $popover).click(gt.bell.listEntryClicked);
    },

    unstar: function($timer) {
        if ($timer.closest('#lmain').length)
            return;
        
        var view = $timer.data('view');
        var timerid = $timer.data('id');

        var $containerList = $timer.closest('.timer-list');
        var list = $containerList.data('list');
        if (!list)
            return;
            
        gt.layout.engine.remove(list, $timer);

        // Sort lists that still have some entries.
        if (list.timers.length)
            gt.layout.engine.sort(list.name);

        // Remove filled star from main list if this is the last one.
        var $otherTimers = $('.user-list .timer[data-id="' + timerid + '"]').not($timer);
        if (!$otherTimers.length) {
            view.def.isStarred = 0;
            $('#lmain .timer[data-id="' + timerid + '"]').removeClass('star');
        }

        gt.timeline.render();
        gt.map.render();

        gt.bell.saveSettings();
    },

    listEntryClicked: function(e) {
        e.stopPropagation();

        var $this = $(this);
        var timerid = $('#list-popover-entries').data('id');
        var def = gt.bell.timerMap[timerid];
        var now = gt.time.now();

        if ($this.hasClass('new')) {
            // Create new list for this timer.
            var name = prompt(gt.t("Name the new list"));
            if (!name)
                return false;

            if (name == 'Timers' || _.any(gt.bell.settings.lists, function(l) { return l.name == name; })) {
                alert('A list with this name already exists.');
                return false;
            }

            var list = { name: name, timers: [timerid], active: true };
            gt.bell.initializeStarredList(list, now);
            gt.bell.settings.lists.push(list);

            gt.bell.saveSettings();
        } else {
            // Add to the existing list.
            var listName = $this.data('listname');
            var list = _.find(gt.bell.settings.lists, function(l) { return l.name == listName; });

            // Special lists (Favorites) are created on the fly.
            if (!list) {
                list = { name: listName, timers: [], active: true };
                gt.bell.initializeStarredList(list, now);
                gt.bell.settings.lists.push(list);
            }

            if (!_.contains(list.timers, timerid)) {
                // Add only when the list doesn't already contain the timer.
                list.timers.push(timerid);

                def.isStarred = 1;
                gt.bell.activateTimer(def, now, list);
                gt.layout.engine.sort(list.name);

                gt.bell.saveSettings();
            }
        }

        gt.timeline.render();
        gt.map.render();

        if (window.Notification && window.Notification.permission != "granted")
            window.Notification.requestPermission();

        gt.bell.dismissListPopover();
        return false;
    },

    loadSettings: function() {
        var settings = gt.bell.settings;

        try {
            if (localStorage.bellSettings) {
                // Compat to be removed.
                if (!localStorage.bellSettings.locationDisplay)
                    settings = JSON.parse(localStorage.bellSettings);
            }
        } catch (ex) {
            // Ignore.  Can be caused by users blocking access to localStorage, and private browsing modes.
        }

        if (settings.lang) {
            gt.locale.lang = settings.lang
            $("#change-lang").text(settings.lang.toUpperCase())
        }

        if (settings.favorites) {
            settings.lists = [{name: gt.t('Favorites'), timers: settings.favorites}];
            delete settings.favorites;
        }

        if (settings.filters) {
            for (var i = 0; i < settings.filters.length; i++)
                $('#filters .filter[data-filter="' + settings.filters[i] + '"]').toggleClass('active');
        }

        if (settings.mute)
            $('#alarm-toggle').removeClass('active');

        if (settings.tone)
            $('#tone').val(settings.tone);
        else
            settings.tone = 'alarm1';

        if (settings.volume)
            $('#volume').val(settings.volume);
        else
            settings.volume = 50;

        if (settings.warning === null || settings.warning === undefined)
            settings.warning = 60;

        gt.countdownWarning = settings.warning ? gt.time.formatHoursMinutesSeconds(settings.warning) : null;
        $('#warning').val(settings.warning);

        if (settings.tone2)
            $('#tone2').val(settings.tone2);
        else
            settings.tone2 = 'alarm2';

        if (settings.volume2)
            $('#volume2').val(settings.volume2);
        else
            settings.volume2 = 50;

        if (settings.warning2 === null || settings.warning2 === undefined)
            settings.warning2 = 5;

        gt.countdownWarning2 = settings.warning2 ? gt.time.formatHoursMinutesSeconds(settings.warning2) : null;
        $('#warning2').val(settings.warning2);

        if (settings.search)
            $('#search').val(settings.search);
            
        if (settings.timeline)
            $('#timeline, #timeline-header').addClass('active');

        if (settings.maps)
            $('#maps, #maps-header').addClass('active');

        if (settings.rotations)
            $('#rotations, #rotation-header').addClass('active');

        if (settings.unlimitedColumns) {
            $('#unlimited-columns-setting').prop('checked', true);
            $('body').addClass('unlimited-columns');
        }

        if (settings.compact) {
            $('#compact-setting').prop('checked', true);
            $('body').addClass('compact');
        }

        if (settings.colorblind) {
            $('#colorblind-setting').prop('checked', true);
            $('body').addClass('colorblind');
        }

        if (settings.serverTime) {
            $('#servertime-setting').prop('checked', true);
            gt.bell.getServerTime();
        }       

        if (!settings.hidden)
            settings.hidden = { };

        if (!settings.rotationsFilter)
            settings.rotationsFilter = 'stormblood';

        if (settings.rotationsFilter != 'stormblood') {
            $('#rotations .radio .option').removeClass('active');
            $('#rotations .radio .option.' + settings.rotationsFilter).addClass('active');
            $('#rotations .rotation').removeClass('active');
            $('#rotations .rotation.' + settings.rotationsFilter).addClass('active');
        }

        // Layout
        if (!settings.layout)
            settings.layout = 'block';

        if (settings.layout == 'table')
            $('#mode-toggle').addClass('active');

        $('#main-content').addClass(settings.layout + "-layout");

        gt.layout.engine = gt.layout[settings.layout];

        gt.bell.settings = settings;
        return settings;
    },

    saveSettings: function() {
        try {
            localStorage.bellSettings = JSON.stringify(gt.bell.settings);
        } catch (ex) {
            // Warn.  Can be caused by users blocking access to localStorage, and private browsing modes.
            gt.bell.showWarning('storage-blocked');
        }
    },

    alarmToggleClicked: function(e) {
        e.stopPropagation();

        $('#alarm-toggle').toggleClass('active');
        gt.bell.settings.mute = !gt.bell.settings.mute;
        if (!gt.bell.settings.mute) {
            if (!gt.bell.playAlarm())
                gt.bell.playAlarm2();
        }

        gt.bell.saveSettings();

        return false;
    },

    settingToggleClicked: function(e) {
        $('#settings').toggle();
        $('#settings-toggle').toggleClass('active');
    },
    
    timelineHeaderClicked: function(e) {
        gt.bell.settings.timeline = !gt.bell.settings.timeline;
        $('#timeline, #timeline-header').toggleClass('active');
        gt.bell.saveSettings();
    },

    mapsHeaderClicked: function(e) {
        if (gt.bell.settings.maps) {
            $('#maps').empty();
            gt.bell.settings.maps = false;
        } else {
            gt.bell.settings.maps = true;
            gt.map.render();
        }

        $('#maps-header').toggleClass('active');
        gt.bell.saveSettings();
    },

    rotationsHeaderClicked: function(e) {
        gt.bell.settings.rotations = !gt.bell.settings.rotations;
        $('#rotations, #rotation-header').toggleClass('active', gt.bell.settings.rotations);
        gt.bell.saveSettings();
    },

    rotationsFilterClicked: function(e) {
        e.stopPropagation();

        var $this = $(this);
        if ($this.hasClass('active'))
            return false;

        var $radio = $this.closest('.radio');
        $('.option', $radio).removeClass('active');
        $this.addClass('active');

        var filter = $this.data('filter');
        $('#rotations .rotation').removeClass('active');
        $('#rotations .rotation.' + filter).addClass('active');

        gt.bell.settings.rotationsFilter = filter;
        gt.bell.saveSettings();

        return false;
    },

    timerListHeaderClicked: function(e) {
        var $this = $(this);
        var $containerList = $this.closest('.timer-list');
        var isUserList = $containerList.hasClass('user-list');

        if (isUserList) {
            var list = $containerList.data('list');
            list.active = !list.active;

            $containerList.toggleClass('active', list.active);

            gt.timeline.render();
            gt.map.render();
        } else {
            gt.bell.settings.timersHidden = !gt.bell.settings.timersHidden;
            $containerList.toggleClass('hidden', gt.bell.settings.timersHidden);
        }

        gt.layout.engine.update();
        gt.bell.saveSettings();
    },

    modeToggleClicked: function(e) {
        $('#mode-toggle').toggleClass('active');

        var engine = gt.layout.engine;
        gt.layout.engine = null;
        engine.destroy();
        gt.bell.timerElements = { };

        if (gt.bell.settings.layout == 'block')
            gt.bell.settings.layout = 'table';
        else
            gt.bell.settings.layout = 'block';

        gt.bell.saveSettings();
        gt.bell.initializeDisplay();
    },

    unlimitedColumnsClicked: function(e) {
        gt.bell.settings.unlimitedColumns = $(this).is(':checked');
        $('body').toggleClass('unlimited-columns', gt.bell.settings.unlimitedColumns);
        gt.layout.engine.update();
        gt.bell.saveSettings();
    },

    compactSettingClicked: function(e) {
        gt.bell.settings.compact = $(this).is(':checked');
        $('body').toggleClass('compact', gt.bell.settings.compact);
        gt.layout.engine.update();
        gt.bell.saveSettings();
    },

    colorblindSettingClicked: function(e) {
        gt.bell.settings.colorblind = $(this).is(':checked');
        $('body').toggleClass('colorblind', gt.bell.settings.colorblind);
        gt.bell.saveSettings();
    },

    serverTimeSettingClicked: function(e) {
        gt.bell.settings.serverTime = $(this).is(':checked');
        gt.bell.saveSettings();

        if (gt.bell.settings.serverTime)
            gt.bell.getServerTime();
        else 
            gt.time.timeOffset = 0;
    },

    alarmVolumeChanged: function(e) {
        gt.bell.settings.volume = $(this).val();
        gt.bell.playAlarm();
        gt.bell.saveSettings();
    },

    alarmToneChanged: function(e) {
        gt.bell.settings.tone = $(this).val();
        gt.bell.playAlarm();
        gt.bell.saveSettings();
    },

    alarmWarningChanged: function(e) {
        gt.bell.settings.warning = Number($(this).val());
        gt.countdownWarning = gt.time.formatHoursMinutesSeconds(gt.bell.settings.warning);
        gt.bell.saveSettings();
    },

    alarmVolume2Changed: function(e) {
        gt.bell.settings.volume2 = $(this).val();
        gt.bell.playAlarm2();
        gt.bell.saveSettings();
    },

    alarmTone2Changed: function(e) {
        gt.bell.settings.tone2 = $(this).val();
        gt.bell.playAlarm2();
        gt.bell.saveSettings();
    },

    alarmWarning2Changed: function(e) {
        gt.bell.settings.warning2 = Number($(this).val());
        gt.countdownWarning2 = gt.time.formatHoursMinutesSeconds(gt.bell.settings.warning2);
        gt.bell.saveSettings();
    },

    playAlarm: function() {
        return gt.bell.playAlarmTone(gt.bell.settings.tone, gt.bell.settings.volume);
    },

    playAlarm2: function() {
        return gt.bell.playAlarmTone(gt.bell.settings.tone2, gt.bell.settings.volume2);
    },

    playAlarmTone: function(tone, volume) {
        var alarm = $('#' + tone)[0];
        if (!alarm)
            return false;

        volume = parseInt(volume);
        if (!volume || volume < 0)
            return false;
        else if (volume > 100)
            volume = 100;

        alarm.volume = volume / 100;
        var promise = alarm.play();
        if (promise) {
            promise.catch(function(err) {
                $('#audio-blocked').show();
            });
        }

        return true;
    },

    searchInput: function(e) {
        if (gt.bell.settings.timersHidden)
            gt.bell.unhideMainList();

        gt.bell.executeSearch($(this).val().toLowerCase());
        gt.bell.saveSettings();
    },

    executeSearch: function(query) {
        gt.bell.settings.search = query;
        gt.bell.reactivateTimers();
    },

    tokenizeBait: function(baitList) {
        var tokens = [];
        var separateBait = false;
        for (var i = 0; i < baitList.length; i++) {
            var name = baitList[i];
            if (!name) {
                separateBait = false;
                tokens.push({comma: 1});
                continue;
            }

            var bait = gt.bell.bait[name];
            if (separateBait)
                tokens.push({arrow: 1});

            tokens.push(bait);
            separateBait = true;
        }
        return tokens;
    },

    getServerTime: function() {
        $.get('/api/time.php', function(result) {
            var date = new Date();
            gt.time.timeOffset = parseInt(result) - date.getTime();
        });
    },

    showNotification: function(title, options) {
        try {
            var n = new window.Notification(title, options);
            setTimeout(function() {
                try {
                    n.close();
                } catch (ex) {
                    // Ignore authorization errors, probably from the notification disappearing already.
                }
            }, 45 * 1000);
        } catch (ex) {
            // Ignore illegal constructor errors.
        }
    },

    showWarning: function(warning) {
        if (gt.bell.settings.hiddenWarnings && gt.bell.settings.hiddenWarnings[warning])
            return;

        $('#' + warning).show();
    },

    dismissWarningClicked: function(e) {
        e.stopPropagation();

        var $warning = $(this).parents('.warning');
        var id = $warning.attr('id');

        if (!gt.bell.settings.hiddenWarnings)
            gt.bell.settings.hiddenWarnings = {};
        gt.bell.settings.hiddenWarnings[id] = 1;
        gt.bell.saveSettings();

        $warning.hide();

        return false;
    }
};

// gt.layout.js

gt.layout = {
    engine: null,
    templates: { },

    initialize: function() {
        gt.layout.templates = {
            listEntry: doT.template($('#list-entry-template').text()),
            map: doT.template($('#page-map-template').text()),
            fishBait: doT.template($('#fish-bait-template').text())
        };
    }
};

gt.layout.block = {
    isotope: { },
    isotopeOptions: {
        layoutMode: 'masonry',
        itemSelector: '.timer',
        masonry: {
            gutter: 6,
            columnWidth: '.timer'
        },
        getSortData: {
            active: '[data-active]',
            time: '[data-time]'
        },
        sortBy: ['active', 'time'],
        sortAscending: {
            active: false,
            time: true
        },
        transitionDuration: '0.6s'
    },
    templates: { },

    initialize: function() {
        // Firefox isn't firing isotope transition end events, causing all kinds
        // of wackiness.  Disabled for now.
        if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1)
            gt.layout.block.isotopeOptions.transitionDuration = 0;

        gt.layout.block.templates = {
            timer: doT.template($('#timer-block-template').text()),
            timerList: doT.template($('#timer-list-block-template').text()),
            nodeContent: doT.template($('#node-content-block-template').text()),
            fishContent: doT.template($('#fish-content-block-template').text()),
            fishEntry: doT.template($('#fish-entry-block-template').text()),
            huntContent: doT.template($('#hunt-content-block-template').text())
        };
    },

    destroy: function() {
        for (var key in gt.layout.block.isotope) {
            var isotope = gt.layout.block.isotope[key];
            isotope.destroy();
        }

        gt.layout.block.isotope = { };
    },

    setupList: function(list, $list) {
        var $nodeList = $('.node-list', $list);
        var isotope = new Isotope($nodeList[0], gt.layout.block.isotopeOptions);
        gt.layout.block.isotope[list.name] = isotope;
    },

    sort: function(listName, noAnimation) {
        var isotope = gt.layout.block.isotope[listName];

        if (noAnimation) {
            isotope.options.transitionDuration = 0;
            isotope.arrange();
            isotope.options.transitionDuration = gt.layout.block.isotopeOptions.transitionDuration;
        } else
            isotope.arrange();

    },

    update: function() {
        for (var key in gt.layout.block.isotope) {
            var isotope = gt.layout.block.isotope[key];

            for (var i = 0; i < isotope.filteredItems.length; i++) {
                var $timer = $(isotope.filteredItems[i].element);
                gt.layout.block.setHeight($timer);
            }

            isotope.updateSortData();
            isotope.arrange();
        }
    },

    setHeight: function($timer) {
        $timer.removeClass('small medium large xlarge');

        var step = gt.bell.settings.compact ? 95 : 135;
        var height = $timer[0].scrollHeight;
        var size = Math.ceil(height / step);

        switch (size) {
            case 1: $timer.addClass('small'); break;
            case 2: $timer.addClass('medium'); break;
            case 3: $timer.addClass('large'); break;
            default: $timer.addClass('xlarge'); break;
        }
    },

    calcStepCss: function() {
        gt.layout.block.calcStepCssCore(135);
        gt.layout.block.calcStepCssCore(95, 'compact');
    },

    calcStepCssCore: function(step, bodyClass) {
        var step = 135;
        var margin = 6;

        var sizes = [];
        for (var i = 1; i <= 4; i++) {
            var height = i * step;
            height += (i - 1) * margin;
            sizes.push(height);
        }

        var prefix = bodyClass ? "body." + bodyClass + " " : "";

        var rules = [];
        rules.push(prefix + '.block-layout .timer.small { height: ' + sizes[0] + 'px; }');
        rules.push(prefix + '.block-layout .timer.medium { height: ' + sizes[1] + 'px; }');
        rules.push(prefix + '.block-layout .timer.large { height: ' + sizes[2] + 'px; }');
        rules.push(prefix + '.block-layout .timer.xlarge { height: ' + sizes[3] + 'px; overflow-y: auto; overflow-x: hidden; }');
        console.log(rules.join("\n"));
    },

    append: function(list, $timer) {
        var isotope = gt.layout.block.isotope[list.name];
        isotope.$element.append($timer);
        isotope.addItems($timer);

        gt.layout.block.setHeight($timer);
    },

    remove: function(list, timerElement) {
        var $timer = $(timerElement);
        var $containerList = $timer.closest('.timer-list');

        var isotope = gt.layout.block.isotope[list.name];
        isotope.remove(timerElement);

        if (list.timers) {
            var timerid = $timer.data('id');
            list.timers = _.without(list.timers, timerid);
            
            if (!list.timers.length && !list.main) {
                $containerList.remove();
                isotope.destroy();
                delete gt.layout.block.isotope[list.name];
                gt.bell.settings.lists = _.without(gt.bell.settings.lists, list);
            }
        }
    },

    getDisplayedElements: function(list) {
        return _.map(gt.layout.block.isotope[list.name].filteredItems, function(i) { return i.element; });
    },

    getSoonestView: function() {
        var soonestItem = null;
        for (var i = 0; i < gt.bell.settings.lists.length; i++) {
            var list = gt.bell.settings.lists[i];
            if (!list.active)
                continue;

            var isotope = gt.layout.block.isotope[list.name];
            var item = isotope.filteredItems[0];
            if (item && (soonestItem == null || item.sortData.time < soonestItem.sortData.time))
                soonestItem = item;
        }

        return soonestItem ? $(soonestItem.element).data('view') : null;
    },

    updateSpawnTime: function(view, $timer) {
        $('.spawn-time', $timer).text(view.progress.countdown + ' / ' + view.progress.time);
    }
};

gt.layout.table = {
    tables: { },
    templates: { },

    initialize: function() {
        gt.layout.table.templates = {
            timer: doT.template($('#timer-table-template').text()),
            timerList: doT.template($('#timer-list-table-template').text()),
            nodeContent: doT.template($('#node-content-table-template').text()),
            fishContent: doT.template($('#fish-content-table-template').text()),
            huntContent: doT.template($('#hunt-content-table-template').text())
        };

        gt.layout.engine = gt.layout.table;
    },

    destroy: function() {
        gt.layout.table.tables = { };
    },

    setupList: function(list, $list) {
        var table = {
            $element: $list.is('.node-list') ? $list : $('.node-list', $list)
        };

        gt.layout.table.tables[list.name] = table;
    },

    sort: function(listName) {
        // Un-jquery'd for performance.
        var table = gt.layout.table.tables[listName];
        var $timers = $('.timer', table.$element);
        $timers.sort(gt.layout.table.compareElementTime);

        var elem = table.$element[0];
        for (var i = 0; i < $timers.length; i++)
            elem.appendChild($timers[i]);
    },

    compareElementTime: function(a, b) {
        var view1 = $(a).data('view');
        var view2 = $(b).data('view');

        if (!view1 || !view2)
            return view1 ? 1 : view2 ? -1 : 0;

        if (!view1.isTimed || !view2.isTimed) {
            if (view1.isTimed && !view2.isTimed)
                return 1;
            else if (view2.isTimed && !view1.isTimed)
                return -1;

            return view1.title > view2.title ? 1 : view1.title < view2.title ? -1 : 0;
        }

        var time1 = view1.progress.state == 'active' ? view1.progress.start.getTime() : view1.progress.end.getTime();
        var time2 = view2.progress.state == 'active' ? view2.progress.start.getTime() : view2.progress.end.getTime();

        if (view1.progress.state == 'active' && view2.progress.state != 'active')
            return -1;
        if (view2.progress.state == 'active' && view1.progress.state != 'active')
            return 1;

        if (time1 > time2)
            return 1;
        if (time1 < time2)
            return -1;

        return view1.id > view2.id ? 1 : view1.id < view2.id ? -1 : 0;
    },

    update: function() {
        for (var key in gt.layout.table.tables)
            gt.layout.table.sort(key);
    },

    append: function(list, $timer) {
        var table = gt.layout.table.tables[list.name];
        table.$element.append($timer);
    },

    remove: function(list, timerElement) {
        var $timer = $(timerElement);
        var timerid = $timer.data('id');

        if (list.timers) {
            list.timers = _.without(list.timers, timerid);

            if (!list.timers.length && !list.main) {
                var $containerList = $timer.closest('.timer-list');
                $containerList.remove();
                delete gt.layout.table.tables[list.name];
                gt.bell.settings.lists = _.without(gt.bell.settings.lists, list);
                return;
            }
        }

        $timer.remove();
    },

    getDisplayedElements: function(list) {
        var table = gt.layout.table.tables[list.name];
        return $('.timer', table.$element);
    },

    getSoonestView: function() {
        var soonestElement;
        for (var i = 0; i < gt.bell.settings.lists.length; i++) {
            var list = gt.bell.settings.lists[i];
            if (!list.active)
                continue;

            var table = gt.layout.table.tables[list.name];
            var $elements = $('.timer', table.$element);
            for (var ii = 0; ii < $elements.length; ii++) {
                var element = $elements[ii];
                var view = $(element).data('view');
                if (!view || !view.isTimed)
                    continue;

                if (soonestElement == null || gt.layout.table.compareElementTime(element, soonestElement) == -1)
                    soonestElement = element;
            }
        }

        return soonestElement ? $(soonestElement).data('view') : null;
    },

    updateSpawnTime: function(view, $timer) {
        // Un-jquery'd for performance.
        var $countdown = $('.countdown', $timer);
        for (var i = 0; i < $countdown.length; i++)
            $countdown[i].innerText = view.progress.countdown;

        var $spawntime = $('.spawn-time', $timer);
        for (var i = 0; i < $spawntime.length; i++)
            $spawntime[i].innerText = view.progress.time;
    }
};

// gt.timer.js

gt.timer = {
    updateKey: null,

    baseline: function(current, daysBack) {
        var start = new Date(current);
        start.setUTCDate(start.getUTCDate() - daysBack);
        start.setUTCMinutes(0);
        start.setUTCHours(0);
        start.setUTCSeconds(0);
        return start;
    },

    progress: function(current, period) {
        // Start from a position of dormancy.
        var progress = {
            start: period.lastExpire,
            end: period.active,
            change: period.active,
            percent: null,
            time: null,
            countdown: null,
            sort: period.active.getTime()
        };

        var minutesDiff = (period.active.getTime() - current.getTime()) / 60000;
        if (minutesDiff > 0 && minutesDiff <= 5) {
            // Active within 5 minutes.
            progress.state = 'spawning';
            progress.time = gt.time.formatTime(gt.time.removeOffset(progress.change));
        } else if (minutesDiff < 0 && minutesDiff > -period.mUp) {
            // Active for {mUp} minutes.
            progress.state = 'active';
            progress.start  = period.expire;
            progress.end = period.active;
            progress.change = period.expire;
            progress.sort = period.expire.getTime();
            progress.time = gt.time.formatTime(gt.time.removeOffset(period.expire));
        } else {
            // Dormant until 5 minutes before the next spawn.
            var spawning = new Date(period.active);
            spawning.setUTCMinutes(spawning.getUTCMinutes() - 5);
            progress.state = 'dormant';
            progress.change = spawning;

            if (minutesDiff >= 1440)
                progress.time = gt.time.formatDateTime(gt.time.removeOffset(period.active));
            else
                progress.time = gt.time.formatTime(gt.time.removeOffset(period.active));
        }

        progress.percent = gt.time.getPercentTimeDifference(progress.start, progress.end);
        progress.countdown = gt.time.formatCountdown(progress.start > progress.end ? progress.start : progress.end);

        return progress;
    },

    update: function() {
        var now = gt.time.now();
        var epoch = now.getTime();
        var update = false;
        var starUpdate = false;

        _.each($('.timer'), function(element) {
            var $timer = $(element);
            var view = $timer.data('view');

            // No need to update untimed views.
            if (!view || !view.isTimed)
                return;

            // Update progress
            var nextChange = $timer.data('next-spawn-change');
            if (epoch >= nextChange) {
                view.next(now);
                view.progress = gt.timer.progress(now, view.period);

                $timer.removeClass('spawning active dormant').addClass(view.progress.state);
                $timer.data('next-spawn-change', view.progress.change.getTime() + 1001);
                $timer.attr('data-time', view.progress.sort);
                $timer.attr('data-active', view.progress.state == 'active' ? 1 : 0);
                update = true;

                if (!starUpdate && $timer.hasClass('star'))
                    starUpdate = true;
            }

            // Update the progress bar.
            view.progress.percent = gt.time.getPercentTimeDifference(view.progress.start, view.progress.end);
            $('.progress', $timer).css('width', view.progress.percent + '%');

            // Update the remaining time.
            view.progress.countdown = gt.time.formatCountdown(view.progress.start > view.progress.end ? view.progress.start : view.progress.end);
            gt.layout.engine.updateSpawnTime(view, $timer);

            // Play an alarm if spawning node is a favorite.
            if (view.progress.state == 'spawning' && (view.progress.countdown === gt.countdownWarning || view.progress.countdown === gt.countdownWarning2)) {
                if (!gt.bell.settings.mute && $timer.closest('.timer-list.active').length) {
                    if (view.progress.countdown === gt.countdownWarning)
                        gt.bell.playAlarm();
                    else
                        gt.bell.playAlarm2();

                    if (window.Notification && window.Notification.permission == "granted")
                        view.notify();
                }
            }
        });

        gt.bell.updateTime(now);

        if (update)
            gt.layout.engine.update();

        if (starUpdate)
            gt.map.render();
    }
};

// gt.timer.tripletriad

gt.timer.tripletriad = function(now, def) {
    this.type = 'tripletriad';
    this.def = def;
    //this.contentTemplate = gt.layout.engine.templates.tripletriadContent;
    this.icon = '../db/images/marker/TripleTriad.png';
    this.zone = def.zone;
    this.timeText = gt.bell.formatHours(def.during.start) + " - " + gt.bell.formatHours(def.during.end);
    this.typeIcon = 'icons/GoldSaucer.png';
    this.isTimed = true;

    if (def.rules)
        this.conditions = def.rules.join(', ');

    if (def.zone && def.coords)
        this.map = gt.map.getViewModel(def.zone, def.coords);

    var eNow = gt.time.localToEorzea(now);
    var hUp = (24 + def.during.end - def.during.start) % 24;

    var active = new Date(eNow);
    active.setUTCMinutes(0);
    active.setUTCSeconds(0);
    active.setUTCHours(def.during.start);

    var expire = new Date(active);
    expire.setUTCHours(def.during.start + hUp);

    var lastExpire = new Date(expire);
    lastExpire.setUTCDate(lastExpire.getUTCDate() - 1);

    this.period = {
        active: gt.time.eorzeaToLocal(active),
        expire: gt.time.eorzeaToLocal(expire),
        lastExpire: gt.time.eorzeaToLocal(lastExpire),
        mUp: hUp * 60
    };

    this.next(now);
};

gt.timer.tripletriad.prototype.next = function(now) {
    if (this.period && this.period.expire > now)
        return false; // No period changes if this one hasn't expired yet.

    var expire = gt.time.localToEorzea(this.period.expire);
    expire.setUTCDate(expire.getUTCDate() + 1);

    var active = gt.time.localToEorzea(this.period.active);
    active.setUTCDate(active.getUTCDate() + 1);

    this.period.lastExpire = this.period.expire;
    this.period.expire = gt.time.eorzeaToLocal(expire);
    this.period.active = gt.time.eorzeaToLocal(active);
};

gt.timer.tripletriad.prototype.notify = function(now) {
    gt.bell.showNotification(this.title, {
        icon: this.icon,
        body: this.desc + '\r\n' + this.progress.time + '\r\n',
        tag: this.id
    });
};

// gt.timer.GATE

gt.timer.GATE = function(now, def) {
    var active = gt.timer.baseline(now, 0);
    active.setUTCMinutes(def.minute);

    var expire = new Date(active);
    expire.setUTCMinutes(def.minute + def.uptime);

    var lastExpire = new Date(expire);
    lastExpire.setUTCHours(lastExpire.getUTCHours() - 1);

    // Members
    this.period = { active: active, expire: expire, lastExpire: lastExpire, mUp: def.uptime };
    this.progress = null;
    this.type = 'GATE';
    this.title = null;
    this.desc = null;
    this.zone = 'Gold Saucer';
    this.icon = 'icons/GATE.png';
    this.tooltip = def.title;
    this.typeIcon = 'icons/GoldSaucer.png';
    this.isTimed = true;
};

gt.timer.GATE.prototype.next = function(now) {
    if (this.period.expire > now)
        return false; // No period changes if this one hasn't expired yet.

    this.period.lastExpire = this.period.expire;
    this.period.expire = new Date(this.period.expire);
    this.period.expire.setUTCHours(this.period.expire.getUTCHours() + 1);
    this.period.active.setUTCHours(this.period.active.getUTCHours() + 1);

    return true;
};

gt.timer.GATE.prototype.notify = function() {
    gt.bell.showNotification(this.title, {
        icon: this.icon,
        body: this.desc + '\r\n' + this.progress.time + '\r\n',
        tag: this.id
    });
};

// gt.timer.hunt

gt.timer.hunt = function(now, def) {
    this.progress = null;
    this.period = null;
    this.type = 'hunt';
    this.def = def;
    this.contentTemplate = gt.layout.engine.templates.huntContent;
    this.icon = 'icons/' + def.name + '.png';
    this.tooltip = def.name;
    this.cooldown = def.cooldown + 'h CD (maint. ' + def.maintenanceCooldown + 'h)';
    this.typeIcon = 'icons/Hunt.png';
    this.isTimed = true;
    def.zone = def.title;

    if (def.fish)
        this.fish = new gt.timer.fish(0, def.fish);

    // Calculate initial period.
    var lStart = new Date(now);
    lStart.setUTCHours(lStart.getUTCHours() - 8);
    this.next(lStart);
};

gt.timer.hunt.prototype.next = function(now) {
    if (this.period && this.period.expire > now)
        return false; // No period changes if this one hasn't expired yet.

    if (this.def.weather)
        gt.skywatcher.calculateNextPeriod(this, now);
    else if (this.def.fish)
        gt.skywatcher.calculateNextPeriod(this, now);
    else if (this.def.moon) {
        var active = gt.skywatcher.nextMoonPhase(gt.time.localToEorzea(now), this.def.moon.phase, this.def.moon.offset);

        var expire = new Date(active);
        expire.setUTCHours((expire.getUTCHours()- this.def.moon.offset) + 96);

        this.period = {
            active: gt.time.eorzeaToLocal(active),
            expire: gt.time.eorzeaToLocal(expire),
            lastExpire: this.period ? this.period.expire : now
        };
    } else if (this.def.time) {
        var spawnTimes = gt.time.getSpawnTimes(gt.time.localToEorzea(now), this.def.time, this.def.uptime);

        this.period = {
            active: gt.time.eorzeaToLocal(spawnTimes.eNextSpawn),
            expire: gt.time.eorzeaToLocal(spawnTimes.eNextExpire),
            lastExpire: gt.time.eorzeaToLocal(spawnTimes.eExpire),
            mUp: this.uptime / gt.time.epochTimeFactor
        };
    } else if (this.def.name == "The Garlok") {
        this.period = { lastExpire: this.period ? this.period.expire : now };

        var period = this.period;
        var eStart = gt.skywatcher.getWeatherInterval(gt.time.localToEorzea(now));
        var eSpawnTicks = null;
        var lSpawnTime = null;
        var findExpiration = false;
        gt.skywatcher.iterateWeather(eStart, this.def.zone, this.def.name, function(weather, transitionWeather, eTime) {
            if (eSpawnTicks && eSpawnTicks < eTime.getTime()) {
                // This spawn time was accurate.
                findExpiration = true;
            }

            if (weather == "下雨" || weather == "暴雨") {
                if (findExpiration) {
                    period.expire = gt.time.eorzeaToLocal(eTime);
                    return true;
                }

                var eCurrent = new Date(eTime);
                eCurrent.setUTCHours(eTime.getUTCHours() + 8);
                period.active = gt.time.eorzeaToLocal(eCurrent);
                period.active.setUTCMinutes(period.active.getUTCMinutes() + 200);
                eSpawnTicks = gt.time.localToEorzea(period.active).getTime();
            }
        });
    }

    this.period.mUp = (this.period.expire - this.period.active) / 60000;
    return true;
};

gt.timer.hunt.prototype.notify = function() {
    gt.bell.showNotification(this.title, {
        icon: this.icon,
        body: this.def.name + '\r\n' + this.progress.time + '\r\n',
        tag: this.id
    });
};

// gt.timer.fish

gt.timer.fish = function(now, def) {
    this.progress = null;
    this.period = null;
    this.type = 'fish';
    this.def = def;
    this.contentTemplate = gt.layout.engine.templates.fishContent;
    this.icon = '../files/icons/item/' + def.icon + '.png';
    this.typeIcon = '../files/icons/job/FSH.png';
    this.tooltip = def.name;
    this.title = def.title;
    this.isTimed = def.during || def.weather;

    if (def.zone && def.coords)
        if (def.zone == "Limsa Lominsa")
            this.map = gt.map.getViewModel(def.title, def.coords);
        else
            this.map = gt.map.getViewModel(def.zone, def.coords);

    def.baitTokens = [];
    if (def.baits){
        for (var i = 0; i < def.baits.length; i++){
            def.baitTokens.push(gt.bell.tokenizeBait(def.baits[i]));
        }
    } else if (def.bait){
        def.baitTokens = gt.bell.tokenizeBait(def.bait);
    }

    if (def.predator) {
        this.predator = [];
        for (var i = 0; i < def.predator.length; i++) {
            var pred = def.predator[i];
            pred.zone = def.zone; // hacks to remove
            pred.title = def.title;
            var predatorTimer = new gt.timer.fish(0, pred);
            predatorTimer.title = def.title;
            predatorTimer.id = pred.id;
            this.predator.push(predatorTimer);
        }
    }

    // Calculate initial period.
    if (this.isTimed && now) {
        var lStart = new Date(now);
        lStart.setUTCHours(lStart.getUTCHours() - 8);
        this.next(lStart);
    }
};

gt.timer.fish.prototype.next = function(now) {
    if (this.period && this.period.expire > now)
        return false; // No period changes if this one hasn't expired yet.

    gt.skywatcher.calculateNextPeriod(this, now);
    return this.period ? true : false;
};

gt.timer.fish.prototype.notify = function() {
    var stars = this.def.stars ? (' ' + gt.util.repeat('*', this.def.stars)) : '';
    var spot = 'Lv. ' + this.def.lvl + stars + ' ' + this.def.category;
    var bait = this.def.bait.join(' -> ');

    gt.bell.showNotification(this.def.name, {
        icon: this.icon,
        body: this.def.title + ', ' + this.def.zone + '\r\n' + spot + ' @ ' + this.progress.time + '\r\n' + bait,
        tag: this.id
    });
};

// gt.timer.node

gt.timer.node = function(now, def) {
    this.node = def;
    this.progress = null;
    this.type = 'node';
    this.contentTemplate = gt.layout.engine.templates.nodeContent;
    this.icon = '../files/icons/item/' + def.items[0].icon + '.png';
    this.tooltip = def.items[0].item;
    this.zone = def.zone;
    this.isTimed = true;

    if (def.zone && def.coords)
        this.map = gt.map.getViewModel(def.zone, def.coords);

    if (def.condition) {
        this.condition = gt.tw(def.condition);
        this.conditionAbbr = this.condition.replace(' < ', ' ');
    }
    if (def.bonus)
        this.bonus = gt.tw(def.bonus);

    if (def.type == '良材' || def.type == '草场') {
        this.requiredClass = 'botanist';
        this.typeIcon = '../files/icons/job/BTN.png';
    }
    else {
        this.requiredClass = 'miner';
        this.typeIcon = '../files/icons/job/MIN.png';
    }

    this.timeText = _.map(def.time, function(t) {
        return gt.bell.formatHours(t);
    }).join(', ');

    // Calculate initial period.
    this.mUp = def.uptime / gt.time.epochTimeFactor;
    this.next(now); // fixme remove, unnecessary
};

gt.timer.node.prototype.next = function(now) {
    if (this.period && this.period.expire > now)
        return false; // No period changes if this one hasn't expired yet.

    var nextPeriod = this.getPeriod(gt.time.localToEorzea(now));
    if (!this.period) {
        var lastActive = gt.time.localToEorzea(nextPeriod.lastExpire);
        lastActive.setUTCMinutes(lastActive.getUTCMinutes() - this.mUp);
        this.lastPeriod = this.getPeriod(lastActive);
    } else
        this.lastPeriod = this.period;

    this.period = nextPeriod;
    return true;
};

gt.timer.node.prototype.getPeriod = function(from) {
    var spawnTimes = gt.time.getSpawnTimes(from, this.node.time, this.node.uptime);

    return {
        active: gt.time.eorzeaToLocal(spawnTimes.eNextSpawn),
        expire: gt.time.eorzeaToLocal(spawnTimes.eNextExpire),
        lastExpire: gt.time.eorzeaToLocal(spawnTimes.eExpire),
        mUp: this.mUp
    };

};

gt.timer.node.prototype.notify = function() {
    var stars = this.node.stars ? (' ' + gt.util.repeat('*', this.node.stars)) : '';
    var title = 'Lv. ' + this.node.lvl + stars + ' ' + this.title;
    var items = _.map(this.node.items, function(i) { return (i.slot ? '[' + i.slot + '] ' : '') + i.item; });
    gt.bell.showNotification(title, {
        icon: this.icon,
        body: this.node.zone + ' ' + this.progress.time + '\r\n' + items.join(', '),
        tag: this.id
    });
};

// gt.time.js

gt.time = {
    epochTimeFactor: 20.571428571428573, // 60 * 24 Eorzean minutes (one day) per 70 real-world minutes.
    millisecondsPerEorzeaMinute: (2 + 11/12) * 1000,
    millisecondsPerDay: 24 * 60 * 60 * 1000,
    monthDay: {month: 'numeric', day: 'numeric'},
    timeOffset: 0,

    localToEorzea: function(date) {
        return new Date(date.getTime() * gt.time.epochTimeFactor);
    },

    eorzeaToLocal: function(date) {
        return new Date(date.getTime() / gt.time.epochTimeFactor);
    },

    eCurrentTime: function() {
        return gt.time.localToEorzea(gt.time.now());
    },

    formatTime: function(date, options) {
        if (options) // Optimization: Chrome slow path.
            return date.toLocaleTimeString(navigator.language || "en-US", options);
        return date.toLocaleTimeString();
    },

    formatDateTime: function(date) {
        if (!date)
            return '(error)';
        
        return date.toLocaleDateString(navigator.language || "en-US", gt.time.monthDay) + ' ' + gt.time.formatTime(date);
    },

    formatEorzeaHour: function(eDate) {
        return gt.util.zeroPad(eDate.getUTCHours(), 2);
    },

    getPercentTimeDifference: function(start, end) {
        var start = start.getTime();
        var end = end.getTime();
        var now = (gt.time.now()).getTime();
        return ((now - start) / (end - start)) * 100;
    },

    formatCountdown: function(end) {
        var remainingSeconds = (end.getTime() - (gt.time.now()).getTime()) / 1000;
        if (remainingSeconds <= 0)
            return '0:00';

        if (remainingSeconds > 60 * 3)
            return gt.time.formatHoursMinutes(remainingSeconds);

        return gt.time.formatHoursMinutesSeconds(remainingSeconds);
    },

    formatHoursMinutes: function(totalSeconds) {
        var hours = Math.floor(totalSeconds / 3600);
        var minutes = Math.floor((totalSeconds % 3600) / 60);

        if (hours)  
            return hours + 'h ' + gt.util.zeroPad(minutes, 2) + 'm';
        else
            return minutes + 'm';
    },

    formatHoursMinutesSeconds: function(totalSeconds) {
        var hours = Math.floor(totalSeconds / 3600);
        var minutes = Math.floor((totalSeconds % 3600) / 60);
        var seconds = Math.floor((totalSeconds % 3600) % 60);

        if (hours)  
            return hours + ':' + gt.util.zeroPad(minutes, 2) + ':' + gt.util.zeroPad(seconds, 2);
        else
            return minutes + ':' + gt.util.zeroPad(seconds, 2);
    },

    now: function() {
        var date = new Date();
        if (gt.time.timeOffset)
            date.setTime(date.getTime() + gt.time.timeOffset);
        return date;
    },

    removeOffset: function(offsetDate) {
        if (!gt.time.timeOffset)
            return offsetDate;

        var date = new Date(offsetDate);
        date.setTime(date.getTime() - gt.time.timeOffset);
        return date;
    },

    getSpawnTimes: function(eStart, time, uptime) {
        var eSpawn = new Date(eStart);
        eSpawn.setUTCDate(eSpawn.getUTCDate() - 2);
        eSpawn.setUTCMinutes(0);
        eSpawn.setUTCHours(0);
        eSpawn.setUTCSeconds(0);

        var eSpawnPrevious, eExpirePrevious;
        while (true) {
            for (var i = 0; i < time.length; i++) {
                eSpawn.setUTCHours(time[i]);
                var eExpire = new Date(eSpawn);
                eExpire.setUTCMinutes(uptime);

                if (eExpire > eStart) {
                    return { eSpawn: eSpawnPrevious, eExpire: eExpirePrevious, eNextSpawn: eSpawn, eNextExpire: eExpire  };
                } else {
                    eSpawnPrevious = new Date(eSpawn);
                    eExpirePrevious = new Date(eExpire);
                }
            }

            eSpawn.setUTCHours(0);
            eSpawn.setUTCDate(eSpawn.getUTCDate() + 1);
        }
    }
};

// gt.skywatcher.js

gt.skywatcher = {
    forecast: function(lDate, zone) {
        zone = zone.trim();
        var location = _.find(_.values(gt.location.index), function(l) { return l.name === zone; });

        var weatherRate = gt.skywatcher.weatherRateIndex[location.name];
        if (!weatherRate) {
            console.error("Weather rates do not exist. rate: zone: ", zone);
            return null;
        }

        var forecastTarget = gt.skywatcher.calculateForecastTarget(lDate);
        var rate = _.find(weatherRate.rates, function(r) { return forecastTarget < r.rate; });
        return gt.skywatcher.weatherIndex[rate.weather];
    },

    calculateForecastTarget: function(lDate) {
        // Thanks to Rogueadyn's SaintCoinach library for this calculation.

        var unixSeconds = parseInt(lDate.getTime() / 1000);
        // Get Eorzea hour for weather start
        var bell = unixSeconds / 175;

        // Do the magic 'cause for calculations 16:00 is 0, 00:00 is 8 and 08:00 is 16
        var increment = (bell + 8 - (bell % 8)) % 24;

        // Take Eorzea days since unix epoch
        var totalDays = unixSeconds / 4200;
        totalDays = (totalDays << 32) >>> 0; // uint

        // 0x64 = 100
        var calcBase = totalDays * 100 + increment;

        // 0xB = 11
        var step1 = ((calcBase << 11) ^ calcBase) >>> 0; // uint
        var step2 = ((step1 >>> 8) ^ step1) >>> 0; // uint

        // 0x64 = 100
        return step2 % 100;
    },

    getWeatherInterval: function(eDate) {
        var eWeather = new Date(eDate ? eDate : gt.time.eCurrentTime());
        eWeather.setUTCHours(parseInt(eWeather.getUTCHours() / 8) * 8);
        eWeather.setUTCMinutes(0);
        eWeather.setUTCSeconds(0);
        return eWeather;
    },

    iterateWeather: function(eStart, zone, name, callback)  {
        var eCurrent = new Date(eStart);
        eCurrent.setUTCHours(eCurrent.getUTCHours() - 8);
        var transitionWeather = gt.skywatcher.forecast(gt.time.eorzeaToLocal(eCurrent), zone);
        if (!transitionWeather) {
            console.error('Invalid weather zone, aborting.');
            return null;
        }

        for (var i = 0; i < 200000; i++) {
            eCurrent.setUTCHours(eCurrent.getUTCHours() + 8);
            var weather = gt.skywatcher.forecast(gt.time.eorzeaToLocal(eCurrent), zone);
            var result = callback(weather, transitionWeather, eCurrent);
            if (result)
                return result;

            transitionWeather = weather;
        }

        console.error('Infinite iteration detected', zone, name, eStart);
        return null;
    },

    calculateNextPeriod: function(timer, now) {
        var eStart;
        if (timer.period) {
            eStart = gt.time.localToEorzea(timer.period.expire);
            eStart.setUTCHours(eStart.getUTCHours() + 8);
        } else
            eStart = gt.time.localToEorzea(now);

        var results = gt.skywatcher.calculateWindow(eStart, timer.def);
        if (!results) {
            timer.isTimed = false;
            timer.period = null;
            return;
        }

        timer.period = {
            active: gt.time.eorzeaToLocal(results.active),
            expire: gt.time.eorzeaToLocal(results.expire),
            lastExpire: timer.period ? timer.period.expire : null
        };

        timer.period.mUp = (timer.period.expire - timer.period.active) / 60000;

        // If no expiration was encountered in the last 8 hours default to now.
        if (!timer.period.lastExpire)
            timer.period.lastExpire = now;
    },

    calculateWindow: function(eStart, options) {
        var eStartInterval = gt.skywatcher.getWeatherInterval(eStart);

        var hourCheck = null;
        if (options.during) {
            if (options.during.start < options.during.end)
                hourCheck = function(h) { return h >= options.during.start && h < options.during.end; };
            else
                hourCheck = function(h) { return h >= options.during.start || h < options.during.end; };
        }

        var results = { };

        results.active = gt.skywatcher.iterateWeather(eStartInterval, options.zone, options.name, function(weather, transitionWeather, eTime) {
            if (options.transition && !_.contains(options.transition, transitionWeather))
                return;

            if (options.weather && !_.contains(options.weather, weather))
                return;

            if (hourCheck) {
                var eCheckTime = new Date(eTime);
                // Check all the hours between the time this weather starts and the time it ends.
                for (var i = 0; i < 8; i++) {
                    var hour = eCheckTime.getUTCHours();
                    if (hourCheck(hour)) {
                        // Last check, it's happening!!
                        return eCheckTime;
                    }

                    eCheckTime.setUTCHours(hour + 1);
                }

                return;
            }

            // All other checks passed.
            return eTime;
        });

        if (!results.active)
            return null;

        // Additional transforms after conditions are met.
        if (options.after) {
            if (options.after.eorzeaHours)
                results.active.setUTCHours(results.active.getUTCHours() + options.after.eorzeaHours);
        }

        // Now find when it expires.
        var eActive = gt.skywatcher.getWeatherInterval(results.active);
        results.expire = gt.skywatcher.iterateWeather(eActive, options.zone, options.name, function(weather, transitionWeather, eTime) {
            var eEnd = new Date(eTime);
            eEnd.setUTCHours(eEnd.getUTCHours() + 8);

            if (eEnd < results.active)
                return; // Doesn't start fast enough.

            if (options.transition && !_.contains(options.transition, transitionWeather))
                return eTime;

            if (options.weather && !_.contains(options.weather, weather))
                return eTime;

            if (hourCheck) {
                var eCheckTime = new Date(eTime);
                // Check all the hours between the time this weather starts and the time it ends.
                for (var i = 0; i < 8; i++) {
                    var hour = eCheckTime.getUTCHours();
                    if (eCheckTime > results.active && !hourCheck(hour))
                        return eCheckTime;

                    eCheckTime.setUTCHours(hour + 1);
                }
            }

            // Must still be happening.
        });

        if (!results.expire) {
            console.error("No expiration detected.  Possible 24/7 or all-weather duration.", options);
            return null;
        }

        return results;
    },

    daysIntoLunarCycle: function(eDate) {
        // Moon is visible starting around 6pm.  Change phase around noon when
        // it can't be seen.
        return ((eDate.getTime() / (1000 * 60 * 60 * 24)) + .5) % 32;
    },

    nextMoonPhase: function(eDate, moon, interCycleHourOffset) {
        var daysIntoCycle = gt.skywatcher.daysIntoLunarCycle(eDate);
        var daysNeeded = moon * 4;

        var offsetDays = (daysNeeded - daysIntoCycle) + (interCycleHourOffset / 24);

        // Use next month if this time is in the past.
        if (offsetDays <= 0)
            offsetDays += 32;

        var ticks = eDate.getTime() + (offsetDays * gt.time.millisecondsPerDay);
        return new Date(ticks);
    }
};

// gt.timeline.js

gt.timeline = {
    addSlot: function(timeslots, active, timer) {
        // Fit an icon into this timeslot.
        var activeSeconds = (active.getUTCHours() * 3600) + (active.getUTCMinutes() * 60) + active.getUTCSeconds();
        var slot = timeslots[activeSeconds];
        if (!slot)
            timeslots[activeSeconds] = slot = [];

        slot.push('<img src="' + timer.icon + '" title="' + timer.tooltip + '">');
    },

    render: function() {
        // Render a 24 Eorzea-hour period (70 minutes)
        var now = gt.time.eCurrentTime();
        var end = new Date(now);
        end.setUTCMinutes(0);
        end.setUTCSeconds(1);
        end.setUTCHours(24);
        var end2 = new Date(now);
        end2.setUTCHours(end2.getUTCHours() + 24);

        // Find the items to generate a timeline for.
        var items = [];
        for (var i = 0; i < gt.bell.settings.lists.length; i++) {
            var list = gt.bell.settings.lists[i];
            if (!list.active)
                continue;

            var elements = gt.layout.engine.getDisplayedElements(list);
            for (var ii = 0; ii < elements.length; ii++)
                items.push(elements[ii]);
        }

        // Generate timeslots.
        var timeslots = {};
        var activeItems = {};
        var timers = _.map(items, function(i) { return $(i).data('view'); });
        for (var i = 0; i < timers.length; i++) {
            var timer = timers[i];
            if (!timer.isTimed)
                continue;

            var active = gt.time.localToEorzea(timer.period.active);
            if (active > end && active > end2)
                continue;

            if (activeItems[timer.id])
                continue;
            else
                activeItems[timer.id] = 1;

            gt.timeline.addSlot(timeslots, active, timer);

            if (timer.lastPeriod) {
                var lastActive = gt.time.localToEorzea(timer.lastPeriod.active);
                if (lastActive.getUTCHours() == active.getUTCHours())
                    continue; // Don't log to the same slot.

                if (lastActive > end && lastActive > end2)
                    continue;

                gt.timeline.addSlot(timeslots, lastActive, timer);

            }
        }

        // Display all the slots.
        var max = 0;
        var $timeslots = $('#timeslots');
        $timeslots.empty();
        for (var activeSeconds in timeslots) {
            var images = timeslots[activeSeconds];
            max = Math.max(max, images.length);
            var activePercent = (activeSeconds / (24 * 60 * 60)) * 100;
            var $slot = $('<div class="slot" style="left: ' + activePercent + '%"></div>');
            $slot.append(images);
            $timeslots.append($slot);
        }

        max = Math.min(max, 5); // Cap at 5.
        $timeslots.css('height', (8 + (30 * max)) + 'px');

        // Render hours
        var $hours = $('#timeline .hours');
        $hours.empty();
        for (var h = 0; h < 24; h++) {
            var percent = (h / 24) * 100;
            var formatted = h;
            if (!gt.bell.is24Hour) {
                var hour = h == 0 ? 24 : h;
                formatted = ((hour - 1) % 12 + 1);
                if (formatted == 12)
                    formatted += (hour > 11 && hour < 24 ? 'P' : 'A');
            }
            var $hour = $('<span class="hour" style="left: ' + percent + '%">' + formatted + '</span>');
            $hours.append($hour);
        }
    },

    tick: function(now) {
        var seconds = (now.getUTCHours() * 3600) + (now.getUTCMinutes() * 60) + now.getUTCSeconds();
        var percent = (seconds / (24 * 60 * 60)) * 100;
        $('#timeline .hand').css('left', percent + '%');

        // Rerender at the start of the day to catch new stuff.
        if (seconds <= 21)
            gt.timeline.render();
    }
};

// gt.map.js

gt.map = {
    dragOriginX: 0,
    dragOriginY: 0,
    dragging: null,
    pixelsPerGrid: 50,
    canvasSize: 381,
    canvasScale: 381 / 2048,
    stateFillStyles: {
        active: 'rgba(60, 99, 60, 0.7)',
        spawning: 'rgba(150, 72, 51, 0.7)'
    },

    setup: function ($wrapper) {
        var $container = $('.map-container', $wrapper);
        if (!$container.length)
            return;

        var view = $wrapper.data('view');
        var location = view.location;
        var size = gt.map.pixelsPerGrid * location.size * gt.map.canvasScale;

        if (!gt.isTouchDevice) {
            // Dragging, at least, works fine with touch by default.
            //$container.bind('wheel', gt.map.wheel);

            //$container.bind('mousedown', gt.map.dragDown);
            $container.bind('mousemove', gt.map.mousemove);
            $container.bind('mouseout', gt.map.mouseout);
        }

        $container.data('location', location);

        // Paint the image
        var $base = $('canvas.base', $container);

        gt.cache.whenImages([view.image]).done(function() {
            var image = gt.cache.images[view.image];

            // Draw base map image.
            var baseContext = $base[0].getContext('2d');
            baseContext.drawImage(image, 0, 0, gt.map.canvasSize, gt.map.canvasSize);

            // Draw grid tiles.
            baseContext.beginPath();
            baseContext.strokeStyle = 'rgba(50, 50, 50, 0.05)';
            for (var i = 0; i < gt.map.canvasSize; i += size) {
                for (var ii = 0; ii < gt.map.canvasSize; ii += size)
                    baseContext.strokeRect(i, ii, size, size);
            }
            baseContext.closePath();

            gt.map.renderPoints($container, view);
        });
    },

    renderPoints: function($container, view) {
        var pointScale = 4;

        var points = view.points;
        var size = gt.map.pixelsPerGrid * view.location.size;
        var iconSize = gt.map.pixelsPerGrid * pointScale * gt.map.canvasScale;

        var $points = $('canvas.points', $container);
        var pointContext = $points[0].getContext('2d');

        var imageSources = _.map(view.points, function(p) {
            return { src: p.icon, rarity: p.origin.def.rarity || 1 };
        });

        gt.display.paintItemsWithoutBackground(imageSources).done(function() {
            for (var i = 0; i < view.points.length; i++) {
                var p = view.points[i];
                var img = gt.cache.imagesWithoutBackground[p.icon];
                var progress = p.origin.progress;
                var state = progress ? progress.state : 'dormant';

                if (state != 'dormant') {
                    var adj = (iconSize / 2) - 12;
                    pointContext.beginPath();
                    pointContext.arc(p.x + adj, p.y + adj, p.r * (pointScale / view.location.size) * gt.map.canvasScale * 1.2, 0, Math.PI * 2, false);
                    pointContext.fillStyle = gt.map.stateFillStyles[state];
                    pointContext.fill();
                    pointContext.closePath();
                }

                pointContext.drawImage(img, p.x - (gt.map.pixelsPerGrid / pointScale), p.y - (gt.map.pixelsPerGrid / pointScale), iconSize, iconSize);
            }
        });
    },

    getViewModel: function(zoneName, coords, radius) {
        var location = _.find(_.values(gt.location.index), function(l) { return l.name == zoneName; });
        if (!location || !location.parentId)
            return null;

        var view = {
            location: location,
            parent: gt.location.index[location.parentId],
            displayCoords: coords
        };

        var offset = 1;
        var x = (coords[0] - offset) * gt.map.pixelsPerGrid * location.size * gt.map.canvasScale;
        var y = (coords[1] - offset) * gt.map.pixelsPerGrid * location.size * gt.map.canvasScale;
        view.coords = [x, y];

        if (radius)
            view.radius = gt.map.toMapCoordinate(radius, location.size) * Math.PI * 2;
        else {
            view.radius = gt.map.pixelsPerGrid / 2;
            view.radius *= location.size;
        }

        view.image = '../files/maps/' + view.parent.name + '/' + gt.map.sanitizeLocationName(location.name) + '.png';

        return view;
    },

    sanitizeLocationName: function(name) {
        if (name.indexOf('The Diadem') == 0)
            return 'The Diadem';
        else
            return name;
    },

    toMapCoordinate: function(value, size) {
        return ((50 / size) * ((value * size) / 2048));
    },

    getGridPosition: function(e, mapContainer) {
        var x = e.offsetX + mapContainer.scrollLeft;
        var y = e.offsetY + mapContainer.scrollTop;

        var zoom = Number($('.map', mapContainer).css('zoom') || 1);

        var location = $(mapContainer).data('location');
        var mapX = (x / (gt.map.pixelsPerGrid * zoom)) / location.size;
        var mapY = (y / (gt.map.pixelsPerGrid * zoom)) / location.size;
        return {x: mapX, y: mapY};
    },

    getAbsolutePosition: function(pos, mapContainer) {
        var location = $(mapContainer).data('location');
        var pixelsPerGrid = gt.map.pixelsPerGrid * Number($('.map', mapContainer).css('zoom') || 1);
        var scrollX = pos.x * pixelsPerGrid * location.size;
        var scrollY = pos.y * pixelsPerGrid * location.size;
        return {x: scrollX, y: scrollY};
    },

    mousemove: function(e) {
        var pos = gt.map.getGridPosition(e, this);
        pos.x /= gt.map.canvasScale;
        pos.y /= gt.map.canvasScale;
        $('.position', this).text(parseInt(pos.x + 1) + ", " + parseInt(pos.y + 1));
    },

    wheel: function(e) {
        e.stopPropagation();
        e = e.originalEvent;

        var gridPos = gt.map.getGridPosition(e, this);

        var delta = gt.display.normalizeWheelDelta(e.deltaY) * .0015;

        var $map = $('.map', this);
        var currentZoom = Number($map.css('zoom') || 1);
        var zoom = Math.min(Math.max(currentZoom - delta, 0.1857), 1.75);

        $map.css('zoom', zoom);

        // Zooming shifts location.  Readjust scrollbar to account for changes.
        var absolutePos = gt.map.getAbsolutePosition(gridPos, this);
        this.scrollLeft = absolutePos.x - e.offsetX;
        this.scrollTop = absolutePos.y - e.offsetY;

        return false;
    },

    mouseout: function(e) {
        // Reset coords when moving the mouse out of the map.
        var $position = $('.position', this);
        $position.empty();
    },

    dragDown: function(e) {
        gt.map.dragOriginX = e.pageX;
        gt.map.dragOriginY = e.pageY;
        gt.map.dragging = this;

        $('html')
            .bind('mouseup touchend', gt.map.dragUp)
            .bind('mousemove touchmove', gt.map.dragMove);

        $(this).addClass('dragging');
    },

    dragUp: function(e) {
        $('html')
            .unbind('mouseup')
            .unbind('mousemove')
            .unbind('touchup')
            .unbind('touchmove');

        $('.dragging').removeClass('dragging');

        gt.map.dragOriginX = 0;
        gt.map.dragOriginY = 0;
        gt.map.dragging = null;
    },

    dragMove: function(e) {
        var x = e.pageX;
        var y = e.pageY;

        var maxDelta = 15;
        var acceleration = 1.15;
        xDelta = Math.min(Math.max(gt.map.dragOriginX - x, -maxDelta), maxDelta) * acceleration;
        yDelta = Math.min(Math.max(gt.map.dragOriginY - y, -maxDelta), maxDelta) * acceleration;

        if (xDelta > 1 || xDelta < 1)
            gt.map.dragging.scrollLeft += xDelta;

        if (yDelta > 1 || yDelta < 1)
            gt.map.dragging.scrollTop += yDelta;

        gt.map.dragOriginX = x;
        gt.map.dragOriginY = y;

        return false;
    },

    render: function() {
        if (!gt.bell.settings.maps)
            return;

        // Collect map data.
        var zoneMaps = {};
        var lists = gt.bell.settings.lists;
        for (var i = 0; i < lists.length; i++) {
            var list = lists[i];
            if (!list.active)
                continue;

            var elements = gt.layout.engine.getDisplayedElements(list);
            for (var ii = 0; ii < elements.length; ii++) {
                var $element = $(elements[ii]);
                var view = $element.data('view');
                if (!view.map)
                    continue;

                var mapView = zoneMaps[view.map.location.name];
                if (!mapView) {
                    mapView = zoneMaps[view.map.location.name] = {
                        points: [],
                        location: view.map.location,
                        image: view.map.image
                    };
                }

                mapView.points.push({
                    x: view.map.coords[0], y: view.map.coords[1],
                    dx: view.map.displayCoords[0], dy: view.map.displayCoords[1],
                    r: view.map.radius, icon: view.icon,
                    origin: view
                });
            }
        }

        // Display the maps
        var sortedMapKeys = _.keys(zoneMaps).sort();
        var $maps = $('#maps').empty();
        for (var i = 0; i < sortedMapKeys.length; i++) {
            var mapView = zoneMaps[sortedMapKeys[i]];
            mapView.displayCoords = _.map(mapView.points, function(p) { return p.dx + ", " + p.dy }).join("<br/>");

            var $map = $(gt.layout.templates.map(mapView));
            $map.data('view', mapView);
            $maps.append($map);
            gt.map.setup($map);
        }
    }
};

// gt.display.js

gt.display = {
    normalizeWheelDelta: function(d) {
        var min = 50;

        if (d < 0 && d > -min)
            return -min;
        else if (d > 0 && d < min)
            return min;
        return d;
    },

    paintItemsWithoutBackground: function(set) {
        set.unshift({ src: 'icons/Blank Item Backdrop.png', rarity: 1, backdrop: 1 });
        set.unshift({ src: 'icons/Blank Uncommon Backdrop.png', rarity: 2, backdrop: 1 });
        var imageSet = _.map(set, function(i) { return i.src; });

        var completed = $.Deferred();
        gt.cache.whenImages(imageSet).done(function() {
            var blankImages = { };
            var loads = [];

            for (var i = 0; i < set.length; i++) {
                var item = set[i];
                if (item.backdrop) {
                    blankImages[item.rarity] = gt.cache.images[item.src];
                    continue;
                }

                var src = item.src;
                var blankImg = blankImages[item.rarity];

                var image = gt.cache.imagesWithoutBackground[src];
                if (image)
                    loads.push(image.deferred);
                else {
                    var load = $.Deferred();

                    var newImage = new Image();
                    newImage.deferred = load;
                    gt.cache.imagesWithoutBackground[src] = newImage;

                    newImage.onload = function() { this.deferred.resolve(this); };
                    newImage.src = gt.display.paintItemWithoutBackground(blankImg, gt.cache.images[src], 128);
                    loads.push(load);
                }
            }

            $.when.apply($, loads).done(function() { completed.resolve(); });
        });

        return completed;
    },

    paintItemWithoutBackground: function(blankImg, itemImg, size) {
        var canvas = document.createElement('canvas');
        canvas.height = size * 2;
        canvas.width = size * 2;
        var context = canvas.getContext('2d');

        context.drawImage(blankImg, size, size, size, size);
        var blankPixels = context.getImageData(size, size, size, size);
        var blankData = blankPixels.data;

        context.drawImage(itemImg, 0, 0, size, size);
        var itemPixels = context.getImageData(0, 0, size, size);
        var itemData = itemPixels.data;

        for (var i = 0; i < itemData.length; i += 4) {
            // Skip already transparent pixels.
            if (itemData[i+3] == 0)
                continue;

            // Generate a difference score.
            var diff = 0;
            for (var ii = 0; ii < 3; ii++)
                diff += Math.abs(itemData[i+ii] - blankData[i+ii]);

            // Make this pixel transparent if the difference is not over our threshold.
            if (diff < 45)
                itemData[i+3] = 0;
        }

        canvas.height = size;
        canvas.width = size;
        context.clearRect(0, 0, size, size);
        context.putImageData(itemPixels, 0, 0);

        return canvas.toDataURL();
    }
};

// gt.cache.js

gt.cache = {
    images: {},
    imagesWithoutBackground: {},

    whenImages: function(set) {
        var loads = [];

        for (var i = 0; i < set.length; i++) {
            var src = set[i];
            var image = gt.cache.images[src];
            if (image)
                loads.push(image.deferred);
            else {
                var load = $.Deferred();

                var newImage = new Image();
                newImage.deferred = load;
                gt.cache.images[src] = newImage;

                newImage.onload = function() { this.deferred.resolve(this); };
                newImage.src = src;
                loads.push(load);
            } 
        }

        return $.when.apply($, loads);
    }
}

// gt.util.js

gt.util = {
    repeat: function(str, times) {
        var result = "";
        for (var i = 0; i < times; i++)
            result += str;
        return result;
    },

    stars: function(stars) {
        return stars ? (' ' + gt.util.repeat('&#x2605', stars)) : '';
    },

    zeroPad: function(num, digits) {
        return ("00000000" + num).slice(-digits);
    },

    sanitize: function(str) {
        return str.replace(/[\s'\?\(\)\.\:/\!"<>\\\+]/g, '');
    }
};

// gt.data.core.js

gt.scrips = { "大地红票": 65029, "大地黄票": 65043, "大地白票": 65069, "大地紫票": 65087 , "大地橙票": 65109};
gt.location = { };
// Stupid, but at least usable. maybe marked inside node.js later.
gt.location.toPatch = {
    "The Sea of Clouds": 3, "Coerthas Western Highlands": 3, "The Dravanian Forelands": 3, "The Dravanian Hinterlands": 3, "The Churning Mists": 3, "Azys Lla":3, "The Diadem": 3,
    "The Fringes": 4, "The Peaks": 4, "The Lochs": 4, "The Ruby Sea": 4, "Yanxia": 4, "The Azim Steppe": 4,
    "Lakeland": 5, "Il Mheg": 5, "The Rak'tika Greatwood": 5, "Amh Araeng": 5, "Kholusia": 5, "The Tempest": 5,
    "Labyrinthos": 6, "Garlemald": 6, "Thavnair": 6, "Ultima Thule": 6, "Mare Lamentorum": 6, "Elpis": 6,
    "Tuliyollal": 7, "Solution Nine": 7, "Urqopacha": 7, "Kozama'uka": 7, "Yak T'el": 7, "Shaaloani": 7, "Heritage Found": 7, "Living Memory": 7,
};
gt.location.index = {"20":{"id":20,"name":"海德林","parentId":20,"size":1},"21":{"id":21,"name":"艾欧泽亚","parentId":21,"size":1},"22":{"id":22,"name":"拉诺西亚","parentId":22,"size":1},"23":{"id":23,"name":"黑衣森林","parentId":23,"size":1},"24":{"id":24,"name":"萨纳兰","parentId":24,"size":1},"25":{"id":25,"name":"库尔札斯","parentId":25,"size":1},"26":{"id":26,"name":"摩杜纳","parentId":26,"size":1},"27":{"id":27,"name":"利姆萨·罗敏萨","parentId":22,"weatherRate":14},"28":{"id":28,"name":"利姆萨·罗敏萨上层甲板","parentId":22,"size":2,"weatherRate":14},"29":{"id":29,"name":"利姆萨·罗敏萨下层甲板","parentId":22,"size":2,"weatherRate":15},"30":{"id":30,"name":"中拉诺西亚","parentId":22,"size":1,"weatherRate":16},"31":{"id":31,"name":"拉诺西亚低地","parentId":22,"size":1,"weatherRate":17},"32":{"id":32,"name":"东拉诺西亚","parentId":22,"size":1,"weatherRate":18},"33":{"id":33,"name":"西拉诺西亚","parentId":22,"size":1,"weatherRate":19},"34":{"id":34,"name":"拉诺西亚高地","parentId":22,"size":1,"weatherRate":20},"35":{"id":35,"name":"沙斯塔夏溶洞","parentId":22,"size":2},"36":{"id":36,"name":"布雷福洛克斯野营地","parentId":22,"size":2},"37":{"id":37,"name":"放浪神古神殿","parentId":22,"size":2},"39":{"id":39,"name":"格里达尼亚","parentId":23,"weatherRate":1},"40":{"id":40,"name":"乌尔达哈现世回廊","parentId":24,"size":2,"weatherRate":7},"41":{"id":41,"name":"乌尔达哈来生回廊","parentId":24,"size":2,"weatherRate":8},"42":{"id":42,"name":"西萨纳兰","parentId":24,"size":1,"weatherRate":9},"43":{"id":43,"name":"中萨纳兰","parentId":24,"size":1,"weatherRate":10},"44":{"id":44,"name":"东萨纳兰","parentId":24,"size":1,"weatherRate":11},"45":{"id":45,"name":"南萨纳兰","parentId":24,"size":1,"weatherRate":12},"46":{"id":46,"name":"北萨纳兰","parentId":24,"size":1,"weatherRate":13},"47":{"id":47,"name":"樵鸣洞","parentId":24,"size":2},"48":{"id":48,"name":"铜铃铜山","parentId":24,"size":2},"49":{"id":49,"name":"日影地修炼所","parentId":24,"size":2},"50":{"id":50,"name":"喀恩埋没圣堂","parentId":24,"size":2},"51":{"id":51,"name":"乌尔达哈","parentId":24,"weatherRate":7},"52":{"id":52,"name":"格里达尼亚新街","parentId":23,"size":2,"weatherRate":1},"53":{"id":53,"name":"格里达尼亚旧街","parentId":23,"size":2,"weatherRate":2},"54":{"id":54,"name":"黑衣森林中央林区","parentId":23,"size":1,"weatherRate":3},"55":{"id":55,"name":"黑衣森林东部林区","parentId":23,"size":1,"weatherRate":4},"56":{"id":56,"name":"黑衣森林南部林区","parentId":23,"size":1,"weatherRate":5},"57":{"id":57,"name":"黑衣森林北部林区","parentId":23,"size":1,"weatherRate":6},"58":{"id":58,"name":"塔姆·塔拉墓园","parentId":23,"size":3},"59":{"id":59,"name":"静语庄园","parentId":23,"size":2},"61":{"id":61,"name":"托托·拉克千狱","parentId":23,"size":2},"62":{"id":62,"name":"伊修加德","parentId":25,"weatherRate":47},"63":{"id":63,"name":"库尔札斯中央高地","parentId":25,"size":1,"weatherRate":21},"64":{"id":64,"name":"泽梅尔要塞","parentId":25,"size":2},"65":{"id":65,"name":"黄金谷","parentId":25,"size":2},"67":{"id":67,"name":"摩杜纳","parentId":26,"size":1,"weatherRate":22},"68":{"id":68,"name":"翡翠湖滨"},"69":{"id":69,"name":"翠泪择伐区"},"70":{"id":70,"name":"弯枝"},"71":{"id":71,"name":"酸模避风港"},"73":{"id":73,"name":"蜜场"},"74":{"id":74,"name":"九藤"},"75":{"id":75,"name":"荆棘森"},"76":{"id":76,"name":"百灵啼"},"77":{"id":77,"name":"妖精领"},"78":{"id":78,"name":"高径"},"79":{"id":79,"name":"低径"},"80":{"id":80,"name":"蛇蜕林"},"81":{"id":81,"name":"沉默花坛"},"82":{"id":82,"name":"兀尔德恩惠地"},"83":{"id":83,"name":"私语巨木"},"84":{"id":84,"name":"和平苑"},"85":{"id":85,"name":"桤木泉"},"86":{"id":86,"name":"荣耀溪"},"87":{"id":87,"name":"青貉门"},"88":{"id":88,"name":"白狼门"},"89":{"id":89,"name":"基尔波特哨塔"},"90":{"id":90,"name":"烤饼练兵所"},"91":{"id":91,"name":"加比诺老爹的小屋"},"93":{"id":93,"name":"沃连牢狱"},"94":{"id":94,"name":"弯枝牧场"},"95":{"id":95,"name":"加尔梵斯哨塔"},"96":{"id":96,"name":"地母神忘迹"},"98":{"id":98,"name":"镜池栈桥"},"99":{"id":99,"name":"睡莲岩"},"100":{"id":100,"name":"境树"},"101":{"id":101,"name":"常影区"},"103":{"id":103,"name":"血祭台"},"104":{"id":104,"name":"萌芽池"},"105":{"id":105,"name":"龙纹岩"},"107":{"id":107,"name":"霍桑山寨"},"108":{"id":108,"name":"境树"},"110":{"id":110,"name":"阿马里赛哨塔"},"111":{"id":111,"name":"帝国东方堡"},"112":{"id":112,"name":"十二神大圣堂","parentId":23,"size":2,"weatherRate":4},"113":{"id":113,"name":"妖精暂留地"},"114":{"id":114,"name":"月芽丛"},"115":{"id":115,"name":"摇篮树"},"116":{"id":116,"name":"金叶台"},"117":{"id":117,"name":"悬钩群"},"118":{"id":118,"name":"巴斯卡隆监视所遗址"},"119":{"id":119,"name":"巴斯卡隆酒家"},"121":{"id":121,"name":"空居"},"122":{"id":122,"name":"无人庵"},"123":{"id":123,"name":"恬静路营地"},"125":{"id":125,"name":"无限城市街古迹","parentId":23,"size":2,"weatherRate":40},"126":{"id":126,"name":"蔓根沼"},"127":{"id":127,"name":"森南飞艇坪"},"128":{"id":128,"name":"无限城古堡","parentId":23,"size":2,"weatherRate":28},"129":{"id":129,"name":"石场水车"},"130":{"id":130,"name":"红腹蜂巢"},"131":{"id":131,"name":"哥布林族野营地"},"132":{"id":132,"name":"枯叶堆"},"133":{"id":133,"name":"兀尔德泉","parentId":23,"size":1,"weatherRate":45},"135":{"id":135,"name":"黄蛇门"},"136":{"id":136,"name":"私语巨木鸟栏"},"137":{"id":137,"name":"艾·塔塔哨塔"},"138":{"id":138,"name":"境树"},"139":{"id":139,"name":"林场水车"},"140":{"id":140,"name":"秋瓜浮村"},"141":{"id":141,"name":"浮栓亭"},"142":{"id":142,"name":"弗洛朗泰尔哨塔"},"143":{"id":143,"name":"山人岩穴"},"144":{"id":144,"name":"格尔莫拉遗迹"},"145":{"id":145,"name":"鸟人军采伐所"},"146":{"id":146,"name":"欧金尼娅哨塔"},"147":{"id":147,"name":"初学者学堂"},"153":{"id":153,"name":"陌迪翁牢狱"},"155":{"id":155,"name":"花蜜栈桥"},"156":{"id":156,"name":"西叶脉"},"157":{"id":157,"name":"东叶脉"},"158":{"id":158,"name":"若斯兰哨塔"},"159":{"id":159,"name":"盛花养蜂场"},"160":{"id":160,"name":"元灵幼树"},"161":{"id":161,"name":"和风流地"},"162":{"id":162,"name":"盛夏滩"},"163":{"id":163,"name":"三星里弯陷"},"164":{"id":164,"name":"莫拉比湾"},"165":{"id":165,"name":"雪松原"},"166":{"id":166,"name":"神握角"},"167":{"id":167,"name":"鲜血滨"},"168":{"id":168,"name":"接雨草树林"},"169":{"id":169,"name":"永恒旧街"},"170":{"id":170,"name":"四分石地"},"171":{"id":171,"name":"骷髅谷"},"173":{"id":173,"name":"幻影群岛"},"174":{"id":174,"name":"橡树原"},"176":{"id":176,"name":"黑金湖"},"177":{"id":177,"name":"石绿湖"},"178":{"id":178,"name":"泽尔玛溪谷"},"179":{"id":179,"name":"和风陆门"},"182":{"id":182,"name":"无赖川"},"183":{"id":183,"name":"拉撒格兰关"},"184":{"id":184,"name":"盛夏农庄"},"185":{"id":185,"name":"海词石窟"},"186":{"id":186,"name":"永恒川"},"187":{"id":187,"name":"岩锅"},"188":{"id":188,"name":"开垦者小仓"},"189":{"id":189,"name":"横断崖"},"190":{"id":190,"name":"天梯"},"191":{"id":191,"name":"德内维尔关"},"192":{"id":192,"name":"轻声谷"},"193":{"id":193,"name":"尼姆河"},"194":{"id":194,"name":"前桅塔"},"195":{"id":195,"name":"错乱桥"},"196":{"id":196,"name":"眼镜岩"},"197":{"id":197,"name":"遗孀泪"},"198":{"id":198,"name":"暴风陆门"},"199":{"id":199,"name":"奥修昂大桥"},"200":{"id":200,"name":"赤血雄鸡农场"},"201":{"id":201,"name":"灰舰风车群"},"202":{"id":202,"name":"盲铁坑道"},"204":{"id":204,"name":"废弃小屋"},"205":{"id":205,"name":"白鸥塔"},"206":{"id":206,"name":"太阳海岸"},"208":{"id":208,"name":"渡轮码头"},"209":{"id":209,"name":"伽洛克巢洞"},"210":{"id":210,"name":"隐秘瀑布码头"},"211":{"id":211,"name":"隐秘瀑布"},"213":{"id":213,"name":"断弦亭"},"214":{"id":214,"name":"红螳螂瀑布"},"215":{"id":215,"name":"接雨草树林码头"},"216":{"id":216,"name":"葡萄酒港"},"218":{"id":218,"name":"雨燕塔殖民地"},"219":{"id":219,"name":"渡渡鸟巢营"},"220":{"id":220,"name":"酿酒师灯塔"},"223":{"id":223,"name":"小麦酒港"},"224":{"id":224,"name":"骷髅谷营地"},"225":{"id":225,"name":"卫士军墓"},"226":{"id":226,"name":"北防波堤"},"227":{"id":227,"name":"南防波堤"},"228":{"id":228,"name":"船舶墓场"},"229":{"id":229,"name":"永夏岛"},"230":{"id":230,"name":"天狼星灯塔","parentId":22,"size":2,"weatherRate":28},"231":{"id":231,"name":"梅梅卢恩交易站"},"232":{"id":232,"name":"贫女材场"},"233":{"id":233,"name":"撒拉奥斯的遗骸"},"234":{"id":234,"name":"愚者瀑布"},"235":{"id":235,"name":"隐者庵"},"236":{"id":236,"name":"尼姆浮游遗迹"},"237":{"id":237,"name":"瞭望阵营地"},"238":{"id":238,"name":"武伽玛罗武装矿山"},"239":{"id":239,"name":"石绿湖营地"},"241":{"id":241,"name":"吉吉卢恩交易站"},"242":{"id":242,"name":"地灵军试掘地"},"243":{"id":243,"name":"金锤台地"},"244":{"id":244,"name":"地平"},"245":{"id":245,"name":"足迹谷"},"246":{"id":246,"name":"西风岬"},"247":{"id":247,"name":"无刺盆地"},"248":{"id":248,"name":"黑尘"},"249":{"id":249,"name":"执掌峡谷"},"250":{"id":250,"name":"枯骨"},"251":{"id":251,"name":"沙门"},"252":{"id":252,"name":"新植林"},"253":{"id":253,"name":"火墙"},"254":{"id":254,"name":"秽水"},"255":{"id":255,"name":"赞拉克","parentId":24,"size":1,"weatherRate":12},"256":{"id":256,"name":"红迷宫"},"257":{"id":257,"name":"撒沟厉沙漠"},"258":{"id":258,"name":"蓝雾"},"259":{"id":259,"name":"劳班缓冲地"},"260":{"id":260,"name":"帝国南方堡","parentId":24,"size":2},"261":{"id":261,"name":"萨萨莫八十罪梯"},"263":{"id":263,"name":"毒蝎交易所"},"264":{"id":264,"name":"丰饶神井"},"265":{"id":265,"name":"一号打桩塔"},"266":{"id":266,"name":"白银集市"},"268":{"id":268,"name":"日升门"},"269":{"id":269,"name":"日落门"},"270":{"id":270,"name":"亚拉戈旭日路"},"271":{"id":271,"name":"地平关"},"272":{"id":272,"name":"月牙湾"},"273":{"id":273,"name":"不语王像"},"274":{"id":274,"name":"黄昏湾"},"275":{"id":275,"name":"月滴洞"},"276":{"id":276,"name":"帕拉塔安息地"},"277":{"id":277,"name":"帝国军前哨基地"},"278":{"id":278,"name":"弃石贫民窟"},"279":{"id":279,"name":"菲斯卡冒险者营地"},"282":{"id":282,"name":"王立娜娜莫菜园"},"283":{"id":283,"name":"乌尔达哈调车库"},"284":{"id":284,"name":"亚拉戈繁星路"},"285":{"id":285,"name":"菲斯卡瞭望台"},"286":{"id":286,"name":"大霸王树"},"287":{"id":287,"name":"撒沟厉关"},"288":{"id":288,"name":"亚拉戈旭日路"},"289":{"id":289,"name":"金库灵柩亭"},"290":{"id":290,"name":"黑尘驿站"},"291":{"id":291,"name":"希拉狄哈遗迹"},"292":{"id":292,"name":"鼠巢"},"293":{"id":293,"name":"狱门蚁穴"},"294":{"id":294,"name":"无望流民街"},"295":{"id":295,"name":"狼烟丘"},"296":{"id":296,"name":"纳纳瓦银山"},"297":{"id":297,"name":"邪嗣"},"298":{"id":298,"name":"屈伊伯龙别宅遗迹"},"299":{"id":299,"name":"亚拉戈旭日路"},"300":{"id":300,"name":"枯骨营地"},"301":{"id":301,"name":"消逝王都"},"302":{"id":302,"name":"圣阿达玛·兰达玛教会"},"304":{"id":304,"name":"黄金集市"},"306":{"id":306,"name":"蜥蜴人军阵地"},"307":{"id":307,"name":"跨天桥"},"308":{"id":308,"name":"宇格拉姆河"},"309":{"id":309,"name":"札尔神祠"},"310":{"id":310,"name":"紫红瀑布"},"311":{"id":311,"name":"最终祈祷纪念地"},"313":{"id":313,"name":"小阿拉米格"},"314":{"id":314,"name":"火蜥蜴河"},"315":{"id":315,"name":"浪人坟"},"316":{"id":316,"name":"焚者群落"},"318":{"id":318,"name":"赞拉克侧翼阵"},"319":{"id":319,"name":"赞拉克祭场"},"320":{"id":320,"name":"不悔战阵"},"321":{"id":321,"name":"纳尔神祠"},"322":{"id":322,"name":"牛魔里程"},"323":{"id":323,"name":"遗忘绿洲"},"324":{"id":324,"name":"工艺神击"},"325":{"id":325,"name":"蓝雾营地"},"326":{"id":326,"name":"东侧监视塔"},"327":{"id":327,"name":"西侧监视塔"},"328":{"id":328,"name":"艾玛吉娜秘银废矿"},"329":{"id":329,"name":"卫月爪痕"},"330":{"id":330,"name":"青磷泉"},"331":{"id":331,"name":"青磷精炼所"},"332":{"id":332,"name":"前门"},"337":{"id":337,"name":"莫拉比造船厂"},"338":{"id":338,"name":"砂盐滩"},"339":{"id":339,"name":"守炬埠头"},"340":{"id":340,"name":"空心穴"},"341":{"id":341,"name":"奥修昂火炬"},"346":{"id":346,"name":"神勇队司令室","parentId":23,"size":8},"347":{"id":347,"name":"芙蓉圆桌","parentId":23,"size":4},"350":{"id":350,"name":"拉诺西亚外地","parentId":22,"size":1,"weatherRate":24},"351":{"id":351,"name":"提督室","parentId":22,"size":8,"weatherRate":14},"354":{"id":354,"name":"银胄团总长室","parentId":24,"size":4},"356":{"id":356,"name":"沙之家","parentId":24,"size":4},"357":{"id":357,"name":"炎帝陵","parentId":24,"size":4,"weatherRate":25},"358":{"id":358,"name":"狼狱停船场","parentId":22,"size":4,"weatherRate":29},"359":{"id":359,"name":"奥·哥摩罗火口神殿","parentId":22,"size":4,"weatherRate":23},"360":{"id":360,"name":"荆棘之园","parentId":23,"size":4,"weatherRate":30},"361":{"id":361,"name":"呼啸眼石塔群","parentId":25,"size":4,"weatherRate":26},"362":{"id":362,"name":"海蛇巢穴"},"363":{"id":363,"name":"萨普沙产卵地"},"364":{"id":364,"name":"鱼人军阵营"},"365":{"id":365,"name":"隐秘港"},"368":{"id":368,"name":"小麦酒港码头"},"370":{"id":370,"name":"月牙湾码头"},"371":{"id":371,"name":"白银集市码头"},"374":{"id":374,"name":"拂晓之间"},"375":{"id":375,"name":"二号打桩塔"},"376":{"id":376,"name":"三号打桩塔"},"378":{"id":378,"name":"以太之光广场"},"380":{"id":380,"name":"巨龙首"},"381":{"id":381,"name":"神意之地"},"382":{"id":382,"name":"巨石丘"},"383":{"id":383,"name":"白云崖"},"384":{"id":384,"name":"哈尔德拉斯行军道"},"385":{"id":385,"name":"阿德内尔占星台"},"386":{"id":386,"name":"狮鹫大桥","parentId":25,"size":2},"387":{"id":387,"name":"天火要塞群"},"388":{"id":388,"name":"巨龙首营地"},"389":{"id":389,"name":"落魔崖"},"390":{"id":390,"name":"钢卫塔"},"391":{"id":391,"name":"魔胃洞"},"392":{"id":392,"name":"圣人泪"},"393":{"id":393,"name":"风扬殖民地"},"395":{"id":395,"name":"七响走廊"},"396":{"id":396,"name":"秘石塔"},"397":{"id":397,"name":"战争神眼"},"398":{"id":398,"name":"圣人旅道"},"400":{"id":400,"name":"大审门"},"401":{"id":401,"name":"石卫塔","parentId":25,"size":2,"weatherRate":27},"402":{"id":402,"name":"白云崖前哨"},"403":{"id":403,"name":"贝希摩斯的领地"},"404":{"id":404,"name":"披雪大冰壁","parentId":25,"size":2,"weatherRate":42},"406":{"id":406,"name":"云廊","parentId":25,"size":2,"weatherRate":28},"407":{"id":407,"name":"云海"},"409":{"id":409,"name":"迷雾湿地"},"410":{"id":410,"name":"银泪湖北岸"},"411":{"id":411,"name":"丧灵钟"},"412":{"id":412,"name":"废弃营地"},"413":{"id":413,"name":"纠缠沼泽林"},"414":{"id":414,"name":"早霜顶"},"415":{"id":415,"name":"帝国中央堡"},"416":{"id":416,"name":"圣寇伊纳克调查地"},"417":{"id":417,"name":"歌咏裂谷"},"418":{"id":418,"name":"密约之塔","parentId":26,"size":2,"weatherRate":74},"419":{"id":419,"name":"常影区\r\n[长老树]"},"420":{"id":420,"name":"水晶塔"},"422":{"id":422,"name":"勇敢之心号"},"423":{"id":423,"name":"接待处"},"424":{"id":424,"name":"狼狱水上竞技场码头"},"425":{"id":425,"name":"海雾村","parentId":22,"size":2,"weatherRate":32},"426":{"id":426,"name":"薰衣草苗圃","parentId":23,"size":2,"weatherRate":34},"427":{"id":427,"name":"高脚孤丘","parentId":24,"size":2,"weatherRate":33},"430":{"id":430,"name":"天幕魔导城"},"439":{"id":439,"name":"邓斯坦哨塔"},"440":{"id":440,"name":"天幕魔导城","parentId":24,"size":2},"459":{"id":459,"name":"呼啸眼外围","parentId":25,"size":4,"weatherRate":26},"460":{"id":460,"name":"莫拉比造船厂码头"},"461":{"id":461,"name":"幻影群岛码头"},"462":{"id":462,"name":"罗塔诺海","parentId":22,"size":4},"464":{"id":464,"name":"陨石勘查坑表层","parentId":22,"size":2},"465":{"id":465,"name":"陨石勘查坑深层","parentId":22,"size":2},"466":{"id":466,"name":"诸神黄昏级拘束舰","parentId":22,"size":2},"467":{"id":467,"name":"隔离壁","parentId":22,"size":2},"468":{"id":468,"name":"中枢区","parentId":22,"size":2},"470":{"id":470,"name":"纳尔神祠领路人"},"472":{"id":472,"name":"沙之家"},"473":{"id":473,"name":"白狼门领路人"},"475":{"id":475,"name":"镜池栈桥码头"},"476":{"id":476,"name":"薰衣草苗圃码头"},"477":{"id":477,"name":"后营门","parentId":24,"size":4,"weatherRate":31},"478":{"id":478,"name":"古代人迷宫","parentId":26,"size":2},"481":{"id":481,"name":"石之家","parentId":26,"size":4},"482":{"id":482,"name":"灰阵营"},"493":{"id":493,"name":"希尔科斯塔","parentId":26,"size":2},"496":{"id":496,"name":"尘封秘岩","parentId":22,"size":1,"weatherRate":59},"497":{"id":497,"name":"阿巴拉提亚","parentId":497,"size":1},"498":{"id":498,"name":"龙堡","parentId":498,"size":1},"513":{"id":513,"name":"黄金港城区","weatherRate":82},"516":{"id":516,"name":"水晶都","weatherRate":112},"517":{"id":517,"name":"游末邦","weatherRate":113},"547":{"id":547,"name":"魔女咖啡馆\r\n[冒险者行会]"},"548":{"id":548,"name":"栖木旅馆","parentId":23,"size":8},"549":{"id":549,"name":"格里达尼亚飞艇坪"},"551":{"id":551,"name":"水车十字广场"},"552":{"id":552,"name":"青貉门"},"554":{"id":554,"name":"刻木匠行会"},"557":{"id":557,"name":"橡子乐园"},"559":{"id":559,"name":"白狼门"},"563":{"id":563,"name":"神勇队司令部\r\n[弓箭手行会]"},"564":{"id":564,"name":"黑檀商店街"},"565":{"id":565,"name":"紫檀商店街"},"566":{"id":566,"name":"树荫东屋"},"568":{"id":568,"name":"制革匠行会"},"569":{"id":569,"name":"飞·乌尔时装店"},"572":{"id":572,"name":"鬼哭队驻地\r\n[枪术师行会]"},"573":{"id":573,"name":"半人马之眼武具店"},"574":{"id":574,"name":"玄猪门"},"575":{"id":575,"name":"碧企鹅瀑布"},"578":{"id":578,"name":"硕老树冥想窟\r\n[幻术师行会]"},"579":{"id":579,"name":"丰饶神祭坛"},"580":{"id":580,"name":"米·凯特露天剧场"},"581":{"id":581,"name":"格雷洛姆农场"},"582":{"id":582,"name":"园艺工行会"},"584":{"id":584,"name":"口哨磨坊"},"585":{"id":585,"name":"红茶川"},"589":{"id":589,"name":"姆恩·图伊酿造库"},"590":{"id":590,"name":"以太之光广场"},"591":{"id":591,"name":"蛇巢司令部"},"593":{"id":593,"name":"陆行鸟栏"},"595":{"id":595,"name":"东栈桥"},"613":{"id":613,"name":"纳尔之门"},"614":{"id":614,"name":"恒辉作战总部"},"616":{"id":616,"name":"流沙屋\r\n[冒险者行会]"},"617":{"id":617,"name":"沙钟旅亭","parentId":24,"size":8},"619":{"id":619,"name":"格斗家行会"},"621":{"id":621,"name":"翠玉大街"},"622":{"id":622,"name":"斗技场"},"623":{"id":623,"name":"剑术师行会"},"625":{"id":625,"name":"角斗士武器百货"},"626":{"id":626,"name":"娜娜莫新门"},"628":{"id":628,"name":"艾拉里格墓地"},"630":{"id":630,"name":"阿达内斯圣柜堂\r\n[咒术师行会]"},"631":{"id":631,"name":"艾斯泰姆珠宝店"},"633":{"id":633,"name":"雕金匠行会"},"636":{"id":636,"name":"采矿工行会"},"638":{"id":638,"name":"黑玉小巷"},"639":{"id":639,"name":"黄金广场"},"640":{"id":640,"name":"红玉大路国际市场"},"641":{"id":641,"name":"源泉之梯"},"642":{"id":642,"name":"太阳丝绸服装店"},"643":{"id":643,"name":"裁衣匠行会"},"645":{"id":645,"name":"札尔之门"},"646":{"id":646,"name":"蓝玉大街国际市场"},"647":{"id":647,"name":"白玉小巷"},"648":{"id":648,"name":"密尔瓦内斯礼拜堂"},"650":{"id":650,"name":"炼金术士行会"},"652":{"id":652,"name":"学者走廊"},"653":{"id":653,"name":"御道"},"654":{"id":654,"name":"乌尔达哈飞艇坪","parentId":24,"size":2,"weatherRate":7},"694":{"id":694,"name":"兽斗间"},"695":{"id":695,"name":"福隆戴尔药学院儿科病房","parentId":24,"size":8},"698":{"id":698,"name":"政府层","parentId":24,"size":2,"weatherRate":8},"702":{"id":702,"name":"阿斯塔利西亚号"},"703":{"id":703,"name":"珊瑚塔\r\n[斧术师行会]"},"707":{"id":707,"name":"梅尔凡海关\r\n[秘术师行会]"},"709":{"id":709,"name":"俾斯麦餐厅\r\n[烹调师行会]"},"711":{"id":711,"name":"纳尔迪克＆威米利作坊\r\n[锻铁匠行会]\r\n[铸甲匠行会]"},"714":{"id":714,"name":"网仓\r\n[捕鱼人行会]"},"716":{"id":716,"name":"沉溺海豚亭\r\n[冒险者行会]"},"717":{"id":717,"name":"镜海鱼店"},"718":{"id":718,"name":"七贤堂"},"719":{"id":719,"name":"永远少女亭"},"725":{"id":725,"name":"利姆萨·罗敏萨飞艇坪","parentId":22,"size":2,"weatherRate":14},"728":{"id":728,"name":"渡轮码头"},"731":{"id":731,"name":"乌鸦之梯"},"732":{"id":732,"name":"工事大厅"},"733":{"id":733,"name":"后桅旅店","parentId":22,"size":8},"737":{"id":737,"name":"舰尾楼"},"738":{"id":738,"name":"以太之光广场"},"739":{"id":739,"name":"八分仪广场"},"741":{"id":741,"name":"锚场"},"743":{"id":743,"name":"国际广场"},"744":{"id":744,"name":"东国际商贩路"},"745":{"id":745,"name":"西国际商贩路"},"754":{"id":754,"name":"利姆萨·罗敏萨码头"},"755":{"id":755,"name":"黑涡军令部"},"789":{"id":789,"name":"沉默庭院"},"941":{"id":941,"name":"水晶门"},"943":{"id":943,"name":"第七天堂"},"944":{"id":944,"name":"第789洞穴团采矿地"},"945":{"id":945,"name":"诺布养育场"},"946":{"id":946,"name":"月影岛"},"949":{"id":949,"name":"海归墓碑"},"951":{"id":951,"name":"叶脉水系"},"952":{"id":952,"name":"镜池"},"953":{"id":953,"name":"落翠底"},"954":{"id":954,"name":"涟漪小川"},"955":{"id":955,"name":"妖精领溪谷"},"956":{"id":956,"name":"哈希瓦河上游"},"957":{"id":957,"name":"哈希瓦河中游"},"958":{"id":958,"name":"哈希瓦河下游"},"959":{"id":959,"name":"哈希瓦河东支流"},"960":{"id":960,"name":"哥布林血流"},"961":{"id":961,"name":"嘈杂川"},"962":{"id":962,"name":"秋瓜湖畔"},"963":{"id":963,"name":"塔赫托特尔湖"},"964":{"id":964,"name":"翡翠湖滨"},"965":{"id":965,"name":"红茶川水系下游"},"966":{"id":966,"name":"纠缠沼泽林源流"},"967":{"id":967,"name":"歌咏裂谷北部"},"968":{"id":968,"name":"库尔札斯河"},"969":{"id":969,"name":"剑峰山麓"},"970":{"id":970,"name":"巨龙首营地水库"},"971":{"id":971,"name":"调查队冰洞"},"972":{"id":972,"name":"伊修加德大云海"},"973":{"id":973,"name":"和风流地沿岸"},"974":{"id":974,"name":"盛夏滩沿岸"},"975":{"id":975,"name":"西永恒川"},"976":{"id":976,"name":"莫拉比湾西岸"},"977":{"id":977,"name":"雪松原沿岸地"},"978":{"id":978,"name":"南鲜血滨"},"979":{"id":979,"name":"北鲜血滨"},"980":{"id":980,"name":"东永恒川"},"981":{"id":981,"name":"接雨草沼泽地"},"982":{"id":982,"name":"骷髅谷沿岸地"},"983":{"id":983,"name":"二分石沿岸地"},"984":{"id":984,"name":"幻影群岛北岸"},"985":{"id":985,"name":"幻影群岛南岸"},"987":{"id":987,"name":"石绿湖东北岸"},"988":{"id":988,"name":"石绿湖浅滩"},"989":{"id":989,"name":"登天路溪谷"},"990":{"id":990,"name":"污流上游"},"991":{"id":991,"name":"污流下游"},"992":{"id":992,"name":"枯骨北泉"},"993":{"id":993,"name":"枯骨南泉"},"995":{"id":995,"name":"不悔战泉"},"996":{"id":996,"name":"撒沟厉沙海"},"997":{"id":997,"name":"撒沟厉沙丘"},"998":{"id":998,"name":"蓝雾涌泉"},"999":{"id":999,"name":"红茶川水系上游"},"1000":{"id":1000,"name":"低语河谷"},"1001":{"id":1001,"name":"罗塔诺海（船首）"},"1002":{"id":1002,"name":"罗塔诺海（船尾）"},"1003":{"id":1003,"name":"库尔札斯不冻池"},"1004":{"id":1004,"name":"清澈池"},"1005":{"id":1005,"name":"灾祸池南"},"1006":{"id":1006,"name":"灾祸池西"},"1007":{"id":1007,"name":"彻悟岩窟西"},"1008":{"id":1008,"name":"沙利亚克河上流"},"1009":{"id":1009,"name":"沙利亚克河中流"},"1010":{"id":1010,"name":"索姆阿尔云帽"},"1011":{"id":1011,"name":"废液池"},"1012":{"id":1012,"name":"石绿湖西北岸"},"1013":{"id":1013,"name":"永夏岛北"},"1014":{"id":1014,"name":"提蒙河"},"1015":{"id":1015,"name":"昏暗林"},"1016":{"id":1016,"name":"流星尾"},"1017":{"id":1017,"name":"威罗迪纳河"},"1018":{"id":1018,"name":"幻河"},"1019":{"id":1019,"name":"夫妇池"},"1020":{"id":1020,"name":"慢水涤"},"1021":{"id":1021,"name":"石楠瀑布"},"1022":{"id":1022,"name":"判官神像"},"1023":{"id":1023,"name":"猛牛浴池"},"1025":{"id":1025,"name":"赎罪之腕"},"1026":{"id":1026,"name":"盐湖"},"1027":{"id":1027,"name":"红玉炮台近海"},"1028":{"id":1028,"name":"狱之盖近海"},"1029":{"id":1029,"name":"龟甲岛近海"},"1030":{"id":1030,"name":"冲之岩近海"},"1031":{"id":1031,"name":"自凝岛近海"},"1032":{"id":1032,"name":"渔村沿岸"},"1033":{"id":1033,"name":"绝鬼岛近海"},"1034":{"id":1034,"name":"苍鹭池"},"1035":{"id":1035,"name":"苍鹭河"},"1036":{"id":1036,"name":"茨菰村水塘"},"1037":{"id":1037,"name":"多玛城前"},"1038":{"id":1038,"name":"城下码头"},"1039":{"id":1039,"name":"无二江东"},"1040":{"id":1040,"name":"无二江西"},"1041":{"id":1041,"name":"梅泉乡"},"1042":{"id":1042,"name":"七彩沟"},"1043":{"id":1043,"name":"七彩溪谷"},"1044":{"id":1044,"name":"朵塔儿水洲"},"1045":{"id":1045,"name":"太阳湖"},"1046":{"id":1046,"name":"涅木卡勒河"},"1047":{"id":1047,"name":"塔奥卡勒河"},"1048":{"id":1048,"name":"亚特卡勒河下游"},"1049":{"id":1049,"name":"亚特卡勒河上游"},"1115":{"id":1115,"name":"1"},"1120":{"id":1120,"name":"6"},"1122":{"id":1122,"name":"8"},"1128":{"id":1128,"name":"14"},"1131":{"id":1131,"name":"17"},"1135":{"id":1135,"name":"21"},"1136":{"id":1136,"name":"22"},"1139":{"id":1139,"name":"25"},"1140":{"id":1140,"name":"26"},"1146":{"id":1146,"name":"房屋管理人"},"1149":{"id":1149,"name":"海雾村码头"},"1150":{"id":1150,"name":"海雾村东区"},"1152":{"id":1152,"name":"高脚孤丘北区"},"1154":{"id":1154,"name":"高脚孤丘领路人"},"1155":{"id":1155,"name":"海雾村南区"},"1200":{"id":1200,"name":"雾门广场"},"1202":{"id":1202,"name":"观海贸易路"},"1203":{"id":1203,"name":"海雾沙滩"},"1209":{"id":1209,"name":"不息风口"},"1210":{"id":1210,"name":"雄心广场"},"1217":{"id":1217,"name":"树冠商店街"},"1220":{"id":1220,"name":"芳草商店街"},"1221":{"id":1221,"name":"雅努·帕庭院"},"1222":{"id":1222,"name":"紫水栈桥"},"1228":{"id":1228,"name":"高脚孤丘部队工房","parentId":24,"size":4},"1301":{"id":1301,"name":"陨石背阴地","parentId":23,"size":2},"1302":{"id":1302,"name":"拘束舰外围","parentId":23,"size":2,"weatherRate":28},"1303":{"id":1303,"name":"诸神黄昏级三号舰舰体中央","parentId":23,"size":2},"1304":{"id":1304,"name":"诸神黄昏级三号舰作战室","parentId":23,"size":2},"1308":{"id":1308,"name":"破损的门前"},"1334":{"id":1334,"name":"对利维亚桑双体船","parentId":22,"size":4,"weatherRate":38},"1350":{"id":1350,"name":"拂晓之间"},"1352":{"id":1352,"name":"来生回廊领路人"},"1363":{"id":1363,"name":"神判古树","parentId":23,"size":4,"weatherRate":43},"1374":{"id":1374,"name":"加尔提诺平原周边遗迹群","parentId":26,"size":1},"1377":{"id":1377,"name":"破舰岛","parentId":22,"size":2},"1378":{"id":1378,"name":"雾须一伙的基地"},"1385":{"id":1385,"name":"长风实验场"},"1390":{"id":1390,"name":"戒律之茧","parentId":26,"size":4},"1392":{"id":1392,"name":"罗薇娜会馆"},"1393":{"id":1393,"name":"钻石工房"},"1399":{"id":1399,"name":"无尽轮回剧场","parentId":25,"size":4,"weatherRate":46},"1406":{"id":1406,"name":"诸神黄昏级六号舰舰体中央","parentId":24,"size":2},"1407":{"id":1407,"name":"诸神黄昏级六号舰再生控制区","parentId":24,"size":2},"1408":{"id":1408,"name":"诸神黄昏级六号舰第一舰桥","parentId":24,"size":2},"1409":{"id":1409,"name":"龙炎核心","parentId":24,"size":2,"weatherRate":44},"1427":{"id":1427,"name":"雪绒花商会","parentId":22,"size":4,"weatherRate":15},"1428":{"id":1428,"name":"码头小屋","parentId":22,"size":4,"weatherRate":18},"1429":{"id":1429,"name":"接待室","parentId":25,"size":4},"1431":{"id":1431,"name":"暗之世界","parentId":26,"size":2},"1453":{"id":1453,"name":"雪绒花商会\r\n[双剑师行会]"},"1484":{"id":1484,"name":"金碟游乐场","parentId":24,"size":4},"1485":{"id":1485,"name":"入口广场"},"1486":{"id":1486,"name":"以太之光广场"},"1487":{"id":1487,"name":"幻卡广场"},"1488":{"id":1488,"name":"奇妙广场"},"1489":{"id":1489,"name":"圆形广场"},"1490":{"id":1490,"name":"演出广场"},"1491":{"id":1491,"name":"金碟飞艇坪"},"1492":{"id":1492,"name":"综合柜台"},"1493":{"id":1493,"name":"陆行鸟电梯"},"1494":{"id":1494,"name":"巨人柱"},"1495":{"id":1495,"name":"科瑞尔山"},"1496":{"id":1496,"name":"主舞台"},"1497":{"id":1497,"name":"仙人彩"},"1498":{"id":1498,"name":"曼德维尔桌台区"},"1499":{"id":1499,"name":"曼德维尔休息区"},"1501":{"id":1501,"name":"竞赛柜台"},"1502":{"id":1502,"name":"陆行鸟电梯"},"1570":{"id":1570,"name":"圣歌队席"},"1628":{"id":1628,"name":"戈耳狄俄斯之拳","parentId":498,"size":2},"1633":{"id":1633,"name":"戈耳狄俄斯之袖","parentId":498,"size":2},"1638":{"id":1638,"name":"戈耳狄俄斯之臂","parentId":498,"size":2},"1645":{"id":1645,"name":"戈耳狄俄斯之担","parentId":498,"size":2},"1647":{"id":1647,"name":"云冠群岛","parentId":497,"size":1,"weatherRate":71},"1660":{"id":1660,"name":"开发室","parentId":24,"size":1},"1663":{"id":1663,"name":"萌宠之王柜台"},"1665":{"id":1665,"name":"幻卡对局室","parentId":24,"size":8},"1708":{"id":1708,"name":"弥达斯之拳","parentId":498,"size":2},"1714":{"id":1714,"name":"弥达斯之袖","parentId":498,"size":2},"1723":{"id":1723,"name":"弥达斯之臂","parentId":498,"size":2},"1731":{"id":1731,"name":"弥达斯之担","parentId":498,"size":2},"1742":{"id":1742,"name":"禁忌城邦玛哈","parentId":26,"size":2},"1759":{"id":1759,"name":"巴哈姆特大迷宫"},"1792":{"id":1792,"name":"塞尔法特尔溪谷","parentId":25,"size":2,"weatherRate":40},"1794":{"id":1794,"name":"个人练习场"},"1800":{"id":1800,"name":"双蛇党军营","parentId":23,"size":4},"1801":{"id":1801,"name":"恒辉队军营","parentId":24,"size":4},"1802":{"id":1802,"name":"黑涡团军营","parentId":22,"size":4},"1803":{"id":1803,"name":"帕洛克系留基地","parentId":497,"size":4},"1804":{"id":1804,"name":"利奥法德的房间","parentId":497,"size":8},"1805":{"id":1805,"name":"中桅塔"},"1811":{"id":1811,"name":"中桅塔大厅","parentId":22,"size":4},"1813":{"id":1813,"name":"百合岭大厅","parentId":23,"size":4},"1815":{"id":1815,"name":"娜娜莫大风车大厅","parentId":24,"size":4},"1823":{"id":1823,"name":"107号室"},"1824":{"id":1824,"name":"108号室"},"1826":{"id":1826,"name":"101号室"},"1827":{"id":1827,"name":"105号室"},"1828":{"id":1828,"name":"103号室"},"1830":{"id":1830,"name":"102号室"},"1831":{"id":1831,"name":"201号室"},"1833":{"id":1833,"name":"馆主之间"},"1834":{"id":1834,"name":"亡灵府邸闹鬼庄园","parentId":23,"size":2},"1835":{"id":1835,"name":"亚历山大之眼","parentId":498,"size":2},"1841":{"id":1841,"name":"亚历山大之息","parentId":498,"size":2},"1847":{"id":1847,"name":"亚历山大之心","parentId":498,"size":2},"1852":{"id":1852,"name":"中枢大动力室"},"1853":{"id":1853,"name":"亚历山大之魂","parentId":498,"size":2},"1856":{"id":1856,"name":"亚历山大之心","parentId":498,"size":1},"1857":{"id":1857,"name":"巴埃萨长城","parentId":23,"size":2,"weatherRate":40},"1868":{"id":1868,"name":"影之国","parentId":497,"size":2,"weatherRate":58},"1887":{"id":1887,"name":"欧米茄控制室","parentId":26,"size":4},"1896":{"id":1896,"name":"茜云栈桥"},"1912":{"id":1912,"name":"[扩建区]白银滨"},"1960":{"id":1960,"name":"惨境号","parentId":22,"size":4,"weatherRate":36},"2000":{"id":2000,"name":"龙堡参天高地","parentId":498,"size":0.95,"weatherRate":50},"2001":{"id":2001,"name":"龙堡内陆低地","parentId":498,"size":0.95,"weatherRate":51},"2002":{"id":2002,"name":"翻云雾海","parentId":498,"size":0.95,"weatherRate":52},"2003":{"id":2003,"name":"陆行鸟之森"},"2004":{"id":2004,"name":"荒烟野地"},"2005":{"id":2005,"name":"唯一脑窟穴"},"2006":{"id":2006,"name":"阿瓦隆尼亚古陆"},"2007":{"id":2007,"name":"阿巴拉提亚山麓","parentId":498,"size":2},"2008":{"id":2008,"name":"彻悟岩窟"},"2009":{"id":2009,"name":"萨雷安精制区"},"2010":{"id":2010,"name":"萨雷安屯集区"},"2011":{"id":2011,"name":"萨雷安睿哲区"},"2012":{"id":2012,"name":"索姆阿尔峰顶"},"2013":{"id":2013,"name":"招恶荒岛"},"2014":{"id":2014,"name":"人王遗迹"},"2015":{"id":2015,"name":"四臂广场"},"2016":{"id":2016,"name":"竖骨岛"},"2017":{"id":2017,"name":"绿茵岛"},"2018":{"id":2018,"name":"尾羽集落"},"2019":{"id":2019,"name":"悲叹飞泉"},"2020":{"id":2020,"name":"宽慰河"},"2021":{"id":2021,"name":"自由脑窟穴"},"2022":{"id":2022,"name":"邪龙雕像"},"2023":{"id":2023,"name":"兵站窟"},"2025":{"id":2025,"name":"不洁三塔"},"2028":{"id":2028,"name":"哀思洞窟"},"2029":{"id":2029,"name":"饵食台地"},"2030":{"id":2030,"name":"光轮祭坛"},"2031":{"id":2031,"name":"索姆阿尔灵峰"},"2032":{"id":2032,"name":"宗匠大工房"},"2033":{"id":2033,"name":"创造之路"},"2034":{"id":2034,"name":"圣茉夏娜植物园","parentId":498,"size":2},"2035":{"id":2035,"name":"湍流三角地"},"2036":{"id":2036,"name":"玛托雅的洞穴","parentId":498,"size":4},"2037":{"id":2037,"name":"硕学之路"},"2038":{"id":2038,"name":"迦巴勒幻想图书馆","parentId":498,"size":2},"2039":{"id":2039,"name":"沙利亚克河"},"2042":{"id":2042,"name":"莫古力之家"},"2043":{"id":2043,"name":"书信之家"},"2044":{"id":2044,"name":"休岛园"},"2045":{"id":2045,"name":"赎罪天廊"},"2046":{"id":2046,"name":"天极白垩宫"},"2047":{"id":2047,"name":"飞龙港"},"2048":{"id":2048,"name":"惋惜之晶遗迹"},"2049":{"id":2049,"name":"东方眼目"},"2050":{"id":2050,"name":"龙巢神殿","parentId":498,"size":2,"weatherRate":28},"2051":{"id":2051,"name":"圣女希瓦像"},"2052":{"id":2052,"name":"萨雷安治学区"},"2053":{"id":2053,"name":"悄声小道"},"2055":{"id":2055,"name":"美夏醒言遗迹"},"2064":{"id":2064,"name":"不洁古像"},"2065":{"id":2065,"name":"小刀石柱群"},"2067":{"id":2067,"name":"游击野营地"},"2069":{"id":2069,"name":"沉思之路"},"2076":{"id":2076,"name":"祈愿林"},"2078":{"id":2078,"name":"南方墙壁"},"2079":{"id":2079,"name":"西方水泉"},"2080":{"id":2080,"name":"人王像"},"2081":{"id":2081,"name":"武神斗技场","parentId":498,"size":4,"weatherRate":57},"2082":{"id":2082,"name":"田园郡","parentId":498,"size":4,"weatherRate":55},"2083":{"id":2083,"name":"供奉洞","parentId":498,"size":4},"2084":{"id":2084,"name":"封面桥"},"2085":{"id":2085,"name":"封底桥"},"2086":{"id":2086,"name":"先贤伟业纪念碑"},"2087":{"id":2087,"name":"以太之光广场"},"2088":{"id":2088,"name":"颠倒塔","parentId":498,"size":2},"2089":{"id":2089,"name":"望海天石"},"2090":{"id":2090,"name":"忆罪宫","parentId":498,"size":2},"2092":{"id":2092,"name":"斯提克奇克斯工房"},"2093":{"id":2093,"name":"罗薇娜综合文化会馆"},"2094":{"id":2094,"name":"自由市场"},"2095":{"id":2095,"name":"忆念广场"},"2096":{"id":2096,"name":"崖畔亭"},"2097":{"id":2097,"name":"蜗牛广场"},"2098":{"id":2098,"name":"绿地菜园"},"2100":{"id":2100,"name":"阿巴拉提亚云海","parentId":497,"size":0.95,"weatherRate":53},"2101":{"id":2101,"name":"魔大陆阿济兹拉","parentId":497,"size":0.95,"weatherRate":54},"2102":{"id":2102,"name":"云顶"},"2103":{"id":2103,"name":"沃仙曦染"},"2104":{"id":2104,"name":"温杜属本杜集落"},"2105":{"id":2105,"name":"蓝天窗"},"2106":{"id":2106,"name":"试炼群岛"},"2107":{"id":2107,"name":"瓦纳温杜集落"},"2108":{"id":2108,"name":"莫克温杜集落"},"2109":{"id":2109,"name":"阿尔法管区"},"2110":{"id":2110,"name":"贝塔管区"},"2111":{"id":2111,"name":"伽马管区"},"2112":{"id":2112,"name":"德尔塔管区"},"2113":{"id":2113,"name":"生态园"},"2114":{"id":2114,"name":"阿济兹拉旗舰岛"},"2115":{"id":2115,"name":"捍卫者号"},"2116":{"id":2116,"name":"云顶营地"},"2117":{"id":2117,"name":"玫瑰园"},"2118":{"id":2118,"name":"衮杜集落"},"2119":{"id":2119,"name":"候鸟云巢"},"2120":{"id":2120,"name":"云水塘"},"2121":{"id":2121,"name":"强本杜的房屋"},"2122":{"id":2122,"name":"白鲸头冠"},"2123":{"id":2123,"name":"尊杜集落"},"2125":{"id":2125,"name":"落羽大房"},"2126":{"id":2126,"name":"曲石祭坛"},"2128":{"id":2128,"name":"寒风岛"},"2129":{"id":2129,"name":"魔窟离岛"},"2130":{"id":2130,"name":"不获岛","parentId":497,"size":2},"2131":{"id":2131,"name":"螺旋港"},"2132":{"id":2132,"name":"阿尔法通信塔"},"2134":{"id":2134,"name":"第二传送环"},"2135":{"id":2135,"name":"第三传送环"},"2136":{"id":2136,"name":"生体培养局"},"2138":{"id":2138,"name":"第四传送环"},"2139":{"id":2139,"name":"第五传送环"},"2143":{"id":2143,"name":"第六传送环"},"2144":{"id":2144,"name":"第七传送环"},"2145":{"id":2145,"name":"对偶处刑台"},"2147":{"id":2147,"name":"魔科学研究所","parentId":497,"size":2},"2148":{"id":2148,"name":"无限回廊","parentId":497,"size":2},"2151":{"id":2151,"name":"无尽苍空","parentId":497,"size":4,"weatherRate":28},"2152":{"id":2152,"name":"危步台"},"2153":{"id":2153,"name":"牧牛台"},"2154":{"id":2154,"name":"雾散瀑布"},"2156":{"id":2156,"name":"明日粉团"},"2159":{"id":2159,"name":"破碎脊骨"},"2160":{"id":2160,"name":"起源岛"},"2161":{"id":2161,"name":"水晶增殖炉"},"2162":{"id":2162,"name":"综合冷却局"},"2164":{"id":2164,"name":"重组实验室"},"2166":{"id":2166,"name":"生态园管理局"},"2172":{"id":2172,"name":"德尔塔水务局"},"2173":{"id":2173,"name":"冠毛大树"},"2174":{"id":2174,"name":"三斗神巨像"},"2177":{"id":2177,"name":"超星际通信塔"},"2178":{"id":2178,"name":"奇点反应堆","parentId":497,"size":4,"weatherRate":56},"2179":{"id":2179,"name":"魔大陆中枢","parentId":497,"size":4},"2181":{"id":2181,"name":"魔航船虚无方舟","parentId":497,"size":2,"weatherRate":37},"2200":{"id":2200,"name":"库尔札斯西部高地","parentId":25,"size":0.95,"weatherRate":49},"2201":{"id":2201,"name":"交汇河"},"2202":{"id":2202,"name":"双子池"},"2203":{"id":2203,"name":"红沿"},"2204":{"id":2204,"name":"隼巢"},"2205":{"id":2205,"name":"库尔札斯河"},"2207":{"id":2207,"name":"戈尔加涅牧场"},"2208":{"id":2208,"name":"铁杉村"},"2209":{"id":2209,"name":"交汇河营地"},"2210":{"id":2210,"name":"灾祸池"},"2211":{"id":2211,"name":"灰烬池"},"2212":{"id":2212,"name":"卧龙岛"},"2213":{"id":2213,"name":"大脚雪人居所"},"2214":{"id":2214,"name":"暮卫塔","parentId":25,"size":2,"weatherRate":42},"2215":{"id":2215,"name":"征龙像"},"2216":{"id":2216,"name":"金砧塔"},"2217":{"id":2217,"name":"灰尾瀑布"},"2219":{"id":2219,"name":"板岩连峰"},"2220":{"id":2220,"name":"圣菲内雅连队露营地"},"2221":{"id":2221,"name":"黑铁大桥"},"2222":{"id":2222,"name":"第九锡杖"},"2223":{"id":2223,"name":"戈尔加涅牧草地"},"2225":{"id":2225,"name":"填絮码头"},"2227":{"id":2227,"name":"龙涎"},"2228":{"id":2228,"name":"守望者"},"2237":{"id":2237,"name":"枪峡门"},"2238":{"id":2238,"name":"呼喊岩"},"2240":{"id":2240,"name":"西风岛"},"2255":{"id":2255,"name":"恩惠号"},"2256":{"id":2256,"name":"抑制绝境S1T7","parentId":497,"size":4,"weatherRate":66},"2258":{"id":2258,"name":"云冠洞穴"},"2259":{"id":2259,"name":"云冠西南池"},"2261":{"id":2261,"name":"云冠西北池"},"2262":{"id":2262,"name":"狂风云海"},"2263":{"id":2263,"name":"无风云海"},"2264":{"id":2264,"name":"旋风云海"},"2265":{"id":2265,"name":"抑制绝境P1T6","parentId":497,"size":4,"weatherRate":69},"2266":{"id":2266,"name":"抑制绝境Z1T9","parentId":497,"size":4,"weatherRate":75},"2272":{"id":2272,"name":"红梅御殿大厅","parentId":2402,"size":4},"2284":{"id":2284,"name":"时空狭缝","parentId":2400,"size":2,"weatherRate":88},"2288":{"id":2288,"name":"阿拉米格王宫深处"},"2291":{"id":2291,"name":"狮鹫之间","parentId":2400,"size":2},"2294":{"id":2294,"name":"阿拉米格王宫","parentId":2400,"size":2},"2295":{"id":2295,"name":"宝物殿","parentId":2401,"size":4,"weatherRate":77},"2296":{"id":2296,"name":"超越技术研究所","parentId":2400,"size":4},"2297":{"id":2297,"name":"妖歌海","parentId":22,"size":2,"weatherRate":36},"2298":{"id":2298,"name":"黄金阁","parentId":2402,"size":2},"2299":{"id":2299,"name":"美神地下神殿","parentId":2400,"size":4,"weatherRate":87},"2300":{"id":2300,"name":"伊修加德基础层","parentId":25,"size":2,"weatherRate":47},"2301":{"id":2301,"name":"伊修加德砥柱层","parentId":25,"size":2,"weatherRate":48},"2302":{"id":2302,"name":"圣徒门"},"2303":{"id":2303,"name":"以太之光广场"},"2304":{"id":2304,"name":"圣瓦勒鲁瓦扬广场"},"2305":{"id":2305,"name":"圣蕾内特广场"},"2307":{"id":2307,"name":"清贫凯旋门"},"2308":{"id":2308,"name":"战女神的慈悲"},"2309":{"id":2309,"name":"云雾街"},"2310":{"id":2310,"name":"九霄云舍","parentId":25,"size":8},"2311":{"id":2311,"name":"忘忧骑士亭"},"2312":{"id":2312,"name":"神殿骑士团总部"},"2313":{"id":2313,"name":"轻羽斗场","parentId":25,"size":4},"2314":{"id":2314,"name":"天钢机工房"},"2316":{"id":2316,"name":"圣大鸟房"},"2317":{"id":2317,"name":"宝杖大街"},"2318":{"id":2318,"name":"狄兰达尔伯爵府"},"2319":{"id":2319,"name":"艾因哈特伯爵府"},"2320":{"id":2320,"name":"福尔唐伯爵府","parentId":25,"size":4},"2321":{"id":2321,"name":"泽梅尔伯爵府"},"2322":{"id":2322,"name":"圣冈里奥尔占星院"},"2323":{"id":2323,"name":"伊修加德飞艇坪"},"2325":{"id":2325,"name":"神圣裁判所"},"2326":{"id":2326,"name":"巨盾台"},"2327":{"id":2327,"name":"伊修加德教皇厅","parentId":25,"size":2},"2328":{"id":2328,"name":"圣雷马诺大圣堂"},"2329":{"id":2329,"name":"建国十二骑士像"},"2330":{"id":2330,"name":"终卫要塞"},"2331":{"id":2331,"name":"尊贵凯旋门"},"2335":{"id":2335,"name":"神殿骑士团总骑士长室","parentId":25,"size":4},"2336":{"id":2336,"name":"决斗裁判场","parentId":25,"size":4},"2337":{"id":2337,"name":"圣恩达利姆神学院","parentId":25,"size":4},"2339":{"id":2339,"name":"天母寝宫地下祭坛","parentId":2400,"size":4},"2354":{"id":2354,"name":"白帝竹林","parentId":2401,"size":4,"weatherRate":93},"2357":{"id":2357,"name":"德尔塔幻境1","parentId":2400,"size":4,"weatherRate":88},"2358":{"id":2358,"name":"德尔塔幻境2","parentId":2400,"size":4,"weatherRate":88},"2359":{"id":2359,"name":"德尔塔幻境3","parentId":2400,"size":4,"weatherRate":88},"2360":{"id":2360,"name":"德尔塔幻境4","parentId":2400,"size":4,"weatherRate":88},"2367":{"id":2367,"name":"斯卡拉遗迹","parentId":2400,"size":2},"2370":{"id":2370,"name":"剧场艇初见号道具间"},"2371":{"id":2371,"name":"剧场艇初见号舰桥"},"2372":{"id":2372,"name":"失落之都拉巴纳斯塔"},"2391":{"id":2391,"name":"醴泉神社神道","parentId":2401,"size":1},"2392":{"id":2392,"name":"醴泉神社","parentId":2401,"size":4},"2400":{"id":2400,"name":"基拉巴尼亚","parentId":2400,"size":1},"2401":{"id":2401,"name":"奥萨德","parentId":2401,"size":1},"2402":{"id":2402,"name":"远东之国","parentId":2402,"size":1},"2403":{"id":2403,"name":"神拳痕","parentId":2400,"size":2,"weatherRate":78},"2404":{"id":2404,"name":"黄金港","parentId":2402,"size":2,"weatherRate":82},"2405":{"id":2405,"name":"？？？？"},"2406":{"id":2406,"name":"基拉巴尼亚边区","parentId":2400,"size":1,"weatherRate":79},"2407":{"id":2407,"name":"基拉巴尼亚山区","parentId":2400,"size":1,"weatherRate":80},"2408":{"id":2408,"name":"基拉巴尼亚湖区","parentId":2400,"size":1,"weatherRate":81},"2409":{"id":2409,"name":"红玉海","parentId":2401,"size":1,"weatherRate":83},"2410":{"id":2410,"name":"延夏","parentId":2401,"size":1,"weatherRate":84},"2411":{"id":2411,"name":"太阳神草原","parentId":2401,"size":1,"weatherRate":85},"2412":{"id":2412,"name":"白银乡","parentId":2402,"size":2,"weatherRate":82},"2414":{"id":2414,"name":"优雷卡常风之地","weatherRate":91},"2415":{"id":2415,"name":"萨盖特港"},"2451":{"id":2451,"name":"黎铎拉纳大瀑布"},"2456":{"id":2456,"name":"悠久时光庭园"},"2462":{"id":2462,"name":"优雷卡恒冰之地","weatherRate":94},"2463":{"id":2463,"name":"冰点"},"2475":{"id":2475,"name":"西缘崖"},"2483":{"id":2483,"name":"封闭圣塔黎铎拉纳大灯塔"},"2497":{"id":2497,"name":"亡灵府邸闹鬼庄园","parentId":23,"size":2},"2500":{"id":2500,"name":"哈克卡勒河"},"2501":{"id":2501,"name":"防波堤"},"2502":{"id":2502,"name":"幻河上游"},"2503":{"id":2503,"name":"星导寺入口"},"2504":{"id":2504,"name":"神拳痕"},"2505":{"id":2505,"name":"白银乡"},"2506":{"id":2506,"name":"白银水路"},"2507":{"id":2507,"name":"多玛飞地"},"2511":{"id":2511,"name":"红玉炮台附近"},"2512":{"id":2512,"name":"碧玉水附近"},"2513":{"id":2513,"name":"翠水乡附近"},"2514":{"id":2514,"name":"冒险号附近"},"2515":{"id":2515,"name":"紫水宫附近"},"2516":{"id":2516,"name":"小林丸附近"},"2517":{"id":2517,"name":"无二江底西南部"},"2518":{"id":2518,"name":"无二江底南部"},"2519":{"id":2519,"name":"高速魔导驱逐艇L-XXIII附近"},"2520":{"id":2520,"name":"沉没江船附近"},"2521":{"id":2521,"name":"大龙瀑水底"},"2522":{"id":2522,"name":"太阳湖底西部"},"2523":{"id":2523,"name":"太阳湖底东部"},"2524":{"id":2524,"name":"盐湖底西北部"},"2525":{"id":2525,"name":"盐湖底中央部"},"2526":{"id":2526,"name":"盐湖底东南部"},"2530":{"id":2530,"name":"优雷卡涌火之地","weatherRate":96},"2531":{"id":2531,"name":"北点"},"2532":{"id":2532,"name":"雪崩地"},"2539":{"id":2539,"name":"实验魔器工房"},"2545":{"id":2545,"name":"优雷卡丰水之地","weatherRate":100},"2600":{"id":2600,"name":"东境混交林"},"2601":{"id":2601,"name":"尖枪瀑布"},"2602":{"id":2602,"name":"条纹丘"},"2603":{"id":2603,"name":"无垢干谷"},"2604":{"id":2604,"name":"林梢"},"2605":{"id":2605,"name":"红锈岩山"},"2606":{"id":2606,"name":"白鬼岩山"},"2607":{"id":2607,"name":"约恩山"},"2608":{"id":2608,"name":"高岸"},"2609":{"id":2609,"name":"盐湖"},"2610":{"id":2610,"name":"阿拉米格人居住区"},"2611":{"id":2611,"name":"阿巴拉提亚龙头"},"2613":{"id":2613,"name":"帝国东方堡"},"2614":{"id":2614,"name":"自由门"},"2615":{"id":2615,"name":"药场水车"},"2617":{"id":2617,"name":"提蒙河"},"2618":{"id":2618,"name":"奥温酒窖"},"2620":{"id":2620,"name":"贤者树"},"2621":{"id":2621,"name":"昏暗林"},"2622":{"id":2622,"name":"猎人小屋"},"2623":{"id":2623,"name":"帝国夜鸦基地"},"2624":{"id":2624,"name":"流星尾"},"2625":{"id":2625,"name":"迷悟桥"},"2626":{"id":2626,"name":"威罗迪纳河"},"2627":{"id":2627,"name":"开宗堂"},"2628":{"id":2628,"name":"顿悟圆座"},"2630":{"id":2630,"name":"幻河"},"2631":{"id":2631,"name":"幻我园"},"2632":{"id":2632,"name":"威罗迪纳基地"},"2634":{"id":2634,"name":"对等石"},"2635":{"id":2635,"name":"勇巢"},"2636":{"id":2636,"name":"善巢"},"2637":{"id":2637,"name":"天母寝宫"},"2639":{"id":2639,"name":"真谛之路"},"2640":{"id":2640,"name":"呵欠洞"},"2641":{"id":2641,"name":"启程回廊"},"2642":{"id":2642,"name":"夫妇池"},"2643":{"id":2643,"name":"拜隆粮场"},"2644":{"id":2644,"name":"赤红神塔"},"2645":{"id":2645,"name":"赤红厨房"},"2646":{"id":2646,"name":"阿拉加纳"},"2648":{"id":2648,"name":"石匠瀑布"},"2649":{"id":2649,"name":"石楠瀑布"},"2651":{"id":2651,"name":"藏泪丘"},"2652":{"id":2652,"name":"睡石矿场"},"2654":{"id":2654,"name":"迷茫路"},"2655":{"id":2655,"name":"剃刀连山"},"2657":{"id":2657,"name":"利刃大旅舍遗迹"},"2658":{"id":2658,"name":"米里亚姆幸运路"},"2660":{"id":2660,"name":"阿拉基利"},"2661":{"id":2661,"name":"剑鞘风洞"},"2662":{"id":2662,"name":"御制监望塔"},"2663":{"id":2663,"name":"赎罪之腕"},"2665":{"id":2665,"name":"帝国白山堡","parentId":2400,"size":2},"2666":{"id":2666,"name":"辐射村"},"2667":{"id":2667,"name":"黑铁大道"},"2668":{"id":2668,"name":"猛牛浴池"},"2669":{"id":2669,"name":"寒炉村"},"2670":{"id":2670,"name":"天营门"},"2674":{"id":2674,"name":"望云塔"},"2675":{"id":2675,"name":"萨利僧院"},"2679":{"id":2679,"name":"艾伊冠台"},"2681":{"id":2681,"name":"贫民的金矿"},"2685":{"id":2685,"name":"盐村"},"2687":{"id":2687,"name":"破坏神像"},"2688":{"id":2688,"name":"圣礼拜台"},"2689":{"id":2689,"name":"废王像"},"2691":{"id":2691,"name":"阿拉米格","parentId":2400,"size":2},"2692":{"id":2692,"name":"女王花园"},"2693":{"id":2693,"name":"阿拉米格人居住区"},"2694":{"id":2694,"name":"勇将门"},"2698":{"id":2698,"name":"欧尔冠台"},"2699":{"id":2699,"name":"浸血墓地"},"2700":{"id":2700,"name":"彷徨之剑纪念碑"},"2704":{"id":2704,"name":"王家猎场"},"2705":{"id":2705,"name":"以太之光广场"},"2706":{"id":2706,"name":"野战医院"},"2707":{"id":2707,"name":"星导寺","parentId":2400,"size":2},"2708":{"id":2708,"name":"阿拉米格王立飞空艇着陆场","parentId":2400,"size":4,"weatherRate":76},"2710":{"id":2710,"name":"破坏神像"},"2711":{"id":2711,"name":"血雨的训诫"},"2712":{"id":2712,"name":"代价之墓"},"2713":{"id":2713,"name":"落星池"},"2714":{"id":2714,"name":"脉轮大瀑布"},"2715":{"id":2715,"name":"结晶化空间","parentId":2400,"size":4,"weatherRate":76},"2737":{"id":2737,"name":"时空狭缝","parentId":2400,"size":4,"weatherRate":92},"2750":{"id":2750,"name":"螺旋海峡"},"2751":{"id":2751,"name":"奥萨德东岸"},"2752":{"id":2752,"name":"玄水连山"},"2753":{"id":2753,"name":"无二江流域"},"2754":{"id":2754,"name":"七彩溪谷"},"2755":{"id":2755,"name":"多玛"},"2756":{"id":2756,"name":"刃海"},"2757":{"id":2757,"name":"昂萨哈凯尔"},"2758":{"id":2758,"name":"挡风巨岩"},"2759":{"id":2759,"name":"月神沙漠北端"},"2760":{"id":2760,"name":"红玉炮台"},"2762":{"id":2762,"name":"狱之盖","parentId":2401,"size":2},"2763":{"id":2763,"name":"蟹茹滨"},"2766":{"id":2766,"name":"酒杯岛"},"2767":{"id":2767,"name":"龟甲岛"},"2769":{"id":2769,"name":"碧玉水"},"2770":{"id":2770,"name":"珊瑚台"},"2771":{"id":2771,"name":"冲之岩"},"2772":{"id":2772,"name":"翠水乡"},"2773":{"id":2773,"name":"自凝岛"},"2774":{"id":2774,"name":"痉挛寨"},"2775":{"id":2775,"name":"天之御柱","parentId":2401,"size":1},"2776":{"id":2776,"name":"万年松"},"2777":{"id":2777,"name":"快逃栈桥"},"2778":{"id":2778,"name":"苍玉海沟"},"2779":{"id":2779,"name":"紫水宫","parentId":2401,"size":2},"2780":{"id":2780,"name":"冒险号"},"2781":{"id":2781,"name":"小林丸"},"2782":{"id":2782,"name":"采贝洞"},"2783":{"id":2783,"name":"镜仙洞"},"2784":{"id":2784,"name":"石牡丹岩窟"},"2785":{"id":2785,"name":"渔村"},"2786":{"id":2786,"name":"绝鬼岛"},"2787":{"id":2787,"name":"潜洞"},"2788":{"id":2788,"name":"富豪居"},"2789":{"id":2789,"name":"醉蛙小屋"},"2790":{"id":2790,"name":"祖灵笑"},"2791":{"id":2791,"name":"苍鹭瀑布"},"2792":{"id":2792,"name":"苍鹭河"},"2793":{"id":2793,"name":"茨菰村"},"2794":{"id":2794,"name":"梅泉乡"},"2796":{"id":2796,"name":"西龙鳞桥"},"2797":{"id":2797,"name":"东龙鳞桥"},"2798":{"id":2798,"name":"草刈家"},"2799":{"id":2799,"name":"帝国河畔堡","parentId":2401,"size":4},"2800":{"id":2800,"name":"弓束官邸"},"2801":{"id":2801,"name":"岩燕庙","parentId":2401,"size":2},"2804":{"id":2804,"name":"高速魔导驱逐艇L-XXIII"},"2805":{"id":2805,"name":"烈士庵","parentId":2401,"size":4,"weatherRate":84},"2806":{"id":2806,"name":"万丝绦"},"2807":{"id":2807,"name":"七彩沟"},"2808":{"id":2808,"name":"门前卫街"},"2809":{"id":2809,"name":"城下码头"},"2810":{"id":2810,"name":"多玛王城","parentId":2401,"size":2},"2811":{"id":2811,"name":"踏裾桥"},"2812":{"id":2812,"name":"大龙瀑"},"2813":{"id":2813,"name":"多玛飞地","parentId":2401,"size":4,"weatherRate":84},"2814":{"id":2814,"name":"重逢集市"},"2815":{"id":2815,"name":"拉其儿的失算"},"2816":{"id":2816,"name":"懦夫吊桥"},"2817":{"id":2817,"name":"哈克卡勒河"},"2818":{"id":2818,"name":"拉伊卡勒河"},"2820":{"id":2820,"name":"卡克儿衣楼"},"2821":{"id":2821,"name":"模儿衣楼"},"2822":{"id":2822,"name":"晨曦王座"},"2823":{"id":2823,"name":"太阳湖"},"2824":{"id":2824,"name":"兄长桥"},"2827":{"id":2827,"name":"楔石洞"},"2828":{"id":2828,"name":"塔奥卡勒河"},"2829":{"id":2829,"name":"升月高地"},"2830":{"id":2830,"name":"尾山山脉"},"2832":{"id":2832,"name":"恰佳遗骨堂"},"2833":{"id":2833,"name":"巴儿达木霸道","parentId":2401,"size":2},"2834":{"id":2834,"name":"乔尔艾恩石环"},"2835":{"id":2835,"name":"维亚吉儿古巢"},"2836":{"id":2836,"name":"百一启示"},"2837":{"id":2837,"name":"克累儿衣楼"},"2838":{"id":2838,"name":"暮晖王座"},"2842":{"id":2842,"name":"朵塔儿水洲"},"2843":{"id":2843,"name":"城下码头"},"2844":{"id":2844,"name":"多玛飞地码头"},"2847":{"id":2847,"name":"归燕馆","parentId":2401,"size":4},"2848":{"id":2848,"name":"车前会所"},"2849":{"id":2849,"name":"以太之光广场"},"2850":{"id":2850,"name":"朵洛衣楼"},"2852":{"id":2852,"name":"百货市场"},"2853":{"id":2853,"name":"匠人街"},"2854":{"id":2854,"name":"农耕地"},"2855":{"id":2855,"name":"栗斋学堂"},"2856":{"id":2856,"name":"巡逻队驻所"},"2857":{"id":2857,"name":"瞭望塔"},"2858":{"id":2858,"name":"无二庭园"},"2862":{"id":2862,"name":"艾欧泽亚同盟军大本营","parentId":2400,"size":4},"2863":{"id":2863,"name":"加雷马帝国军天幕","parentId":2400,"size":4},"2864":{"id":2864,"name":"乐欲之所瓯博讷修道院"},"2876":{"id":2876,"name":"中点"},"2877":{"id":2877,"name":"瓦尔河西岸"},"2878":{"id":2878,"name":"瓦尔河源流"},"2879":{"id":2879,"name":"瓦尔河东岸"},"2880":{"id":2880,"name":"总部塔入口"},"2890":{"id":2890,"name":"水晶龙的领地"},"2906":{"id":2906,"name":"潮风亭"},"2907":{"id":2907,"name":"转魂塔广场"},"2908":{"id":2908,"name":"海猫茶屋"},"2909":{"id":2909,"name":"瑞光像"},"2910":{"id":2910,"name":"望海楼","parentId":2402,"size":8,"weatherRate":82},"2911":{"id":2911,"name":"望海泉"},"2912":{"id":2912,"name":"松叶门外广场"},"2913":{"id":2913,"name":"松叶门"},"2914":{"id":2914,"name":"三条花街"},"2915":{"id":2915,"name":"赤诚组营房"},"2917":{"id":2917,"name":"无地鼓座"},"2918":{"id":2918,"name":"三号仓库"},"2919":{"id":2919,"name":"五号仓库"},"2920":{"id":2920,"name":"小锻冶屋"},"2921":{"id":2921,"name":"黄金船库"},"2922":{"id":2922,"name":"黑母衣丸"},"2923":{"id":2923,"name":"乌尔达哈商会馆"},"2924":{"id":2924,"name":"乐水园"},"2925":{"id":2925,"name":"加雷马帝国大使馆"},"2926":{"id":2926,"name":"拉札罕大使馆"},"2927":{"id":2927,"name":"乌尔达哈商会馆接待室","parentId":2402,"size":4},"2928":{"id":2928,"name":"黄昏桥"},"2929":{"id":2929,"name":"第二防波堤码头"},"2930":{"id":2930,"name":"黄金港飞艇坪"},"2931":{"id":2931,"name":"以太之光广场"},"2950":{"id":2950,"name":"诺弗兰特","parentId":2950,"size":1},"2951":{"id":2951,"name":"水晶都","parentId":2950,"size":2,"weatherRate":112},"2952":{"id":2952,"name":"游末邦","parentId":2950,"size":2,"weatherRate":113},"2953":{"id":2953,"name":"雷克兰德","parentId":2950,"size":1,"weatherRate":106},"2954":{"id":2954,"name":"珂露西亚岛","parentId":2950,"size":1,"weatherRate":107},"2955":{"id":2955,"name":"安穆·艾兰","parentId":2950,"size":1,"weatherRate":108},"2956":{"id":2956,"name":"伊尔美格","parentId":2950,"size":1,"weatherRate":109},"2957":{"id":2957,"name":"拉凯提卡大森林","parentId":2950,"size":1,"weatherRate":110},"2958":{"id":2958,"name":"黑风海","parentId":2950,"size":1,"weatherRate":111},"3036":{"id":3036,"name":"迷途羊倌之森"},"3037":{"id":3037,"name":"水晶公之门"},"3038":{"id":3038,"name":"风化大地"},"3040":{"id":3040,"name":"射孔"},"3041":{"id":3041,"name":"追随者之门"},"3042":{"id":3042,"name":"束带路"},"3043":{"id":3043,"name":"千山"},"3044":{"id":3044,"name":"乔布要塞"},"3045":{"id":3045,"name":"光耀教会"},"3046":{"id":3046,"name":"石桥"},"3047":{"id":3047,"name":"拉迪斯卡瞭望塔"},"3048":{"id":3048,"name":"止步堡垒"},"3049":{"id":3049,"name":"北方集合地"},"3051":{"id":3051,"name":"清融街"},"3052":{"id":3052,"name":"无垢之证"},"3053":{"id":3053,"name":"拉克汕城"},"3054":{"id":3054,"name":"自缢塔"},"3055":{"id":3055,"name":"三重生大厅"},"3056":{"id":3056,"name":"巨人的兔窝"},"3057":{"id":3057,"name":"奥斯塔尔严命城"},"3058":{"id":3058,"name":"豺狼影府"},"3059":{"id":3059,"name":"阴沉乡"},"3060":{"id":3060,"name":"杂草岛"},"3061":{"id":3061,"name":"砖土岛"},"3062":{"id":3062,"name":"疙瘩岛"},"3063":{"id":3063,"name":"波浪岛"},"3064":{"id":3064,"name":"湿鞋栈桥"},"3065":{"id":3065,"name":"责罚监狱"},"3066":{"id":3066,"name":"锈锁街"},"3067":{"id":3067,"name":"不渴岸滩"},"3068":{"id":3068,"name":"贤岛"},"3070":{"id":3070,"name":"光明崖"},"3071":{"id":3071,"name":"落影崖"},"3072":{"id":3072,"name":"碎石山地"},"3073":{"id":3073,"name":"侏儒山脉"},"3074":{"id":3074,"name":"碎贝海岸"},"3075":{"id":3075,"name":"滞潮村"},"3076":{"id":3076,"name":"漏洞小舟亭"},"3077":{"id":3077,"name":"总督田地"},"3078":{"id":3078,"name":"白油瀑布"},"3080":{"id":3080,"name":"缓慢道"},"3081":{"id":3081,"name":"南渡桥"},"3084":{"id":3084,"name":"怪人小屋"},"3085":{"id":3085,"name":"门前区"},"3086":{"id":3086,"name":"欢迎门"},"3087":{"id":3087,"name":"鲸角"},"3088":{"id":3088,"name":"凿岩门"},"3089":{"id":3089,"name":"击木灯塔"},"3090":{"id":3090,"name":"观海塔"},"3091":{"id":3091,"name":"观石塔"},"3092":{"id":3092,"name":"温蒙特造船厂"},"3093":{"id":3093,"name":"损舰角"},"3094":{"id":3094,"name":"工匠村"},"3096":{"id":3096,"name":"柔风海湾"},"3097":{"id":3097,"name":"梯底"},"3098":{"id":3098,"name":"大升降机"},"3100":{"id":3100,"name":"刺舌滴"},"3101":{"id":3101,"name":"大海女儿的舞场"},"3102":{"id":3102,"name":"梯顶"},"3103":{"id":3103,"name":"友好村"},"3104":{"id":3104,"name":"八号坑口"},"3105":{"id":3105,"name":"图姆拉村"},"3106":{"id":3106,"name":"迅速道"},"3107":{"id":3107,"name":"南琥珀丘"},"3108":{"id":3108,"name":"沃茨河上游"},"3109":{"id":3109,"name":"碎煮夜枭桥"},"3110":{"id":3110,"name":"烟管桥"},"3111":{"id":3111,"name":"古姆拉村"},"3112":{"id":3112,"name":"侏儒烟囱"},"3113":{"id":3113,"name":"矮人洞窟"},"3114":{"id":3114,"name":"沙尔北城"},"3115":{"id":3115,"name":"琥珀原"},"3116":{"id":3116,"name":"北琥珀丘"},"3117":{"id":3117,"name":"中琥珀丘"},"3118":{"id":3118,"name":"废都拿巴示艾兰"},"3119":{"id":3119,"name":"红店野营地"},"3120":{"id":3120,"name":"沙河"},"3121":{"id":3121,"name":"萨迈尔脊骨"},"3122":{"id":3122,"name":"鼹灵集市"},"3123":{"id":3123,"name":"帽之塔"},"3125":{"id":3125,"name":"脚之风车"},"3127":{"id":3127,"name":"鼻之塔"},"3128":{"id":3128,"name":"须之塔"},"3129":{"id":3129,"name":"上路客店"},"3130":{"id":3130,"name":"铁架塔"},"3131":{"id":3131,"name":"拿巴示断绝"},"3132":{"id":3132,"name":"比朗大矿山"},"3133":{"id":3133,"name":"迦利克村"},"3134":{"id":3134,"name":"尾之道"},"3135":{"id":3135,"name":"络尾聚落"},"3136":{"id":3136,"name":"凯尔克遗迹"},"3137":{"id":3137,"name":"索道矿车站"},"3138":{"id":3138,"name":"努贝依旧矿山"},"3140":{"id":3140,"name":"水站"},"3141":{"id":3141,"name":"索道矿车站"},"3142":{"id":3142,"name":"安穆马利克新宫殿"},"3144":{"id":3144,"name":"桃色睡床"},"3145":{"id":3145,"name":"身镜湖"},"3146":{"id":3146,"name":"孚布特堡"},"3147":{"id":3147,"name":"群花馆"},"3148":{"id":3148,"name":"群树馆"},"3150":{"id":3150,"name":"笃学者庄园"},"3151":{"id":3151,"name":"手镜湖"},"3152":{"id":3152,"name":"优雅馆"},"3153":{"id":3153,"name":"沉没教会"},"3154":{"id":3154,"name":"鱼群镇"},"3155":{"id":3155,"name":"杰娜娜宽容道"},"3156":{"id":3156,"name":"普拉恩尼茸洞"},"3157":{"id":3157,"name":"云村"},"3158":{"id":3158,"name":"六子浅滩"},"3159":{"id":3159,"name":"达穆伦巡礼教会遗迹"},"3161":{"id":3161,"name":"圣法斯里克天庭"},"3162":{"id":3162,"name":"安登小羊圈"},"3163":{"id":3163,"name":"艾雅拉登城桥"},"3164":{"id":3164,"name":"梦羽城"},"3165":{"id":3165,"name":"希秋亚湿原"},"3166":{"id":3166,"name":"蛇水湖"},"3167":{"id":3167,"name":"伊奇丝玛雅艾禁林"},"3168":{"id":3168,"name":"星墓塔遗迹群"},"3169":{"id":3169,"name":"戈恩要塞"},"3170":{"id":3170,"name":"蛇行枝"},"3171":{"id":3171,"name":"至暗所"},"3172":{"id":3172,"name":"书著者树洞"},"3173":{"id":3173,"name":"洛查特尔大阶梯"},"3174":{"id":3174,"name":"结誓洞窟"},"3175":{"id":3175,"name":"阿丝塔蒂亚的胞宫"},"3176":{"id":3176,"name":"水蛇宝卵"},"3177":{"id":3177,"name":"破裂卵壳"},"3178":{"id":3178,"name":"朵瓦特里沉没神殿"},"3179":{"id":3179,"name":"法诺村"},"3180":{"id":3180,"name":"休憩广场"},"3181":{"id":3181,"name":"野园"},"3182":{"id":3182,"name":"射手露宿地"},"3183":{"id":3183,"name":"缪栎的乡愁"},"3185":{"id":3185,"name":"四晨星"},"3186":{"id":3186,"name":"奥奇斯加托尔之星墓"},"3187":{"id":3187,"name":"伊奇丝洛克瓦之星墓"},"3188":{"id":3188,"name":"奥奇斯恰尔之星墓"},"3189":{"id":3189,"name":"伊奇丝安帕之星墓"},"3190":{"id":3190,"name":"万神大星墓"},"3191":{"id":3191,"name":"大图帕萨礼拜堂"},"3192":{"id":3192,"name":"诺弗兰特大陆坡"},"3193":{"id":3193,"name":"卡利班深海峡"},"3194":{"id":3194,"name":"亚马乌罗提"},"3195":{"id":3195,"name":"鳍人潮池"},"3196":{"id":3196,"name":"鳎沙地窖"},"3197":{"id":3197,"name":"奇人工作室"},"3199":{"id":3199,"name":"陆人墓标"},"3200":{"id":3200,"name":"无主遗迹"},"3201":{"id":3201,"name":"尊紫洞"},"3202":{"id":3202,"name":"卡利班古巢"},"3203":{"id":3203,"name":"阿科拉塔"},"3204":{"id":3204,"name":"波利来赖塔官厅区"},"3205":{"id":3205,"name":"马克连萨斯广场"},"3206":{"id":3206,"name":"人民辩论馆"},"3207":{"id":3207,"name":"创造管理局"},"3208":{"id":3208,"name":"人民行政局"},"3209":{"id":3209,"name":"人民秘书局"},"3210":{"id":3210,"name":"国会议事堂"},"3214":{"id":3214,"name":"伊甸内核","parentId":2950,"size":4},"3219":{"id":3219,"name":"完璧王座","parentId":2950,"size":1,"weatherRate":102},"3221":{"id":3221,"name":"希尔科斯峡谷","parentId":26,"size":4},"3222":{"id":3222,"name":"悬挂公馆起居室","parentId":2950,"size":8,"weatherRate":112},"3223":{"id":3223,"name":"观星室","parentId":2950,"size":4},"3225":{"id":3225,"name":"空无大地","parentId":2950,"size":4},"3240":{"id":3240,"name":"密铺铁桥"},"3241":{"id":3241,"name":"以太之光广场"},"3242":{"id":3242,"name":"露天席大广场"},"3244":{"id":3244,"name":"幔布门"},"3246":{"id":3246,"name":"圣林牧场"},"3248":{"id":3248,"name":"中庸工艺馆"},"3249":{"id":3249,"name":"炼金医疗馆"},"3250":{"id":3250,"name":"弹道军武馆"},"3251":{"id":3251,"name":"博物陈列馆"},"3252":{"id":3252,"name":"自由辩论馆"},"3253":{"id":3253,"name":"作物园艺馆"},"3254":{"id":3254,"name":"宇宙和音"},"3255":{"id":3255,"name":"彷徨阶梯亭"},"3256":{"id":3256,"name":"悬链公馆"},"3257":{"id":3257,"name":"甜滤果树园"},"3263":{"id":3263,"name":"光荣门"},"3264":{"id":3264,"name":"腐臭花园"},"3265":{"id":3265,"name":"喜悦大堂"},"3266":{"id":3266,"name":"入国审查局"},"3267":{"id":3267,"name":"移民登记局"},"3268":{"id":3268,"name":"洗濯室"},"3269":{"id":3269,"name":"一号交易办公室"},"3270":{"id":3270,"name":"二号交易办公室"},"3271":{"id":3271,"name":"交易仓库"},"3272":{"id":3272,"name":"木质梯"},"3273":{"id":3273,"name":"游末邦军总司令部"},"3274":{"id":3274,"name":"承重柱"},"3275":{"id":3275,"name":"以太之光广场"},"3276":{"id":3276,"name":"贵妇会客厅"},"3277":{"id":3277,"name":"蜂箱夜总会"},"3278":{"id":3278,"name":"树冠梯"},"3279":{"id":3279,"name":"巡天路"},"3288":{"id":3288,"name":"悬挂公馆"},"3289":{"id":3289,"name":"三艺区"},"3290":{"id":3290,"name":"四艺区"},"3291":{"id":3291,"name":"水晶都起居室"},"3292":{"id":3292,"name":"风化裂痕"},"3293":{"id":3293,"name":"锈迹贮水池"},"3294":{"id":3294,"name":"始源湖"},"3295":{"id":3295,"name":"阴沉乡"},"3296":{"id":3296,"name":"贤岛"},"3297":{"id":3297,"name":"沃茨河上游"},"3298":{"id":3298,"name":"白油瀑布"},"3299":{"id":3299,"name":"沃茨河下游"},"3300":{"id":3300,"name":"刺舌滴"},"3301":{"id":3301,"name":"珂露西亚岛西海岸"},"3302":{"id":3302,"name":"观海湾"},"3303":{"id":3303,"name":"珂露西亚岛东海岸"},"3304":{"id":3304,"name":"废船街"},"3305":{"id":3305,"name":"沙河"},"3306":{"id":3306,"name":"拿巴示断绝"},"3307":{"id":3307,"name":"琥珀丘"},"3308":{"id":3308,"name":"手镜湖"},"3309":{"id":3309,"name":"身镜湖"},"3310":{"id":3310,"name":"傲慢的年长溪流"},"3311":{"id":3311,"name":"嫉妒的年少溪流"},"3312":{"id":3312,"name":"宠坏的年幼溪流"},"3313":{"id":3313,"name":"圣法斯里克天庭"},"3314":{"id":3314,"name":"科拉德排水沟"},"3315":{"id":3315,"name":"蛇水湖"},"3316":{"id":3316,"name":"血盅"},"3317":{"id":3317,"name":"洛查特尔河"},"3318":{"id":3318,"name":"缪栎的乡愁南部"},"3319":{"id":3319,"name":"结誓洞窟"},"3320":{"id":3320,"name":"鳎沙地窖"},"3321":{"id":3321,"name":"陆人墓标"},"3322":{"id":3322,"name":"卡利班深海峡西北"},"3323":{"id":3323,"name":"卡利班古巢西"},"3324":{"id":3324,"name":"卡利班古巢东"},"3325":{"id":3325,"name":"尊紫洞"},"3326":{"id":3326,"name":"诺弗兰特大陆坡"},"3341":{"id":3341,"name":"始源湖东北"},"3342":{"id":3342,"name":"贤岛"},"3343":{"id":3343,"name":"始源湖东南"},"3344":{"id":3344,"name":"梦羽城北"},"3345":{"id":3345,"name":"鱼群镇"},"3346":{"id":3346,"name":"身镜湖中央"},"3347":{"id":3347,"name":"优雅馆"},"3348":{"id":3348,"name":"身镜湖南"},"3349":{"id":3349,"name":"蛇水湖北"},"3350":{"id":3350,"name":"朵瓦特里沉没神殿"},"3352":{"id":3352,"name":"光荣路"},"3354":{"id":3354,"name":"长老集会所"},"3355":{"id":3355,"name":"酒鬼馆"},"3356":{"id":3356,"name":"宗母的荣耀"},"3358":{"id":3358,"name":"羊毛道"},"3361":{"id":3361,"name":"缠根林"},"3362":{"id":3362,"name":"染洗沼地"},"3363":{"id":3363,"name":"瞑目石兵"},"3364":{"id":3364,"name":"洛查特尔河"},"3365":{"id":3365,"name":"血盅"},"3367":{"id":3367,"name":"姐妹隐岛"},"3368":{"id":3368,"name":"快婿树岛"},"3369":{"id":3369,"name":"特林鸠罗的石架"},"3371":{"id":3371,"name":"甬道"},"3373":{"id":3373,"name":"奥奇斯达蓝深渊"},"3374":{"id":3374,"name":"阿马罗棚"},"3377":{"id":3377,"name":"演奏之间"},"3385":{"id":3385,"name":"宇宙宫","parentId":2950,"size":2},"3399":{"id":3399,"name":"第一区"},"3400":{"id":3400,"name":"第二区"},"3403":{"id":3403,"name":"第五区"},"3425":{"id":3425,"name":"复制工厂废墟","parentId":2950,"size":2},"3427":{"id":3427,"name":"机械遗迹坑道","parentId":2950,"size":4},"3428":{"id":3428,"name":"丽耶美格梦园","parentId":2950,"size":4,"weatherRate":40},"3435":{"id":3435,"name":"天穹街","parentId":25,"size":2,"weatherRate":47},"3436":{"id":3436,"name":"无名众人广场"},"3441":{"id":3441,"name":"复制工厂废墟","parentId":2950,"size":2},"3444":{"id":3444,"name":"加拉迪翁湾"},"3445":{"id":3445,"name":"梅尔托尔海峡南"},"3446":{"id":3446,"name":"梅尔托尔海峡北"},"3447":{"id":3447,"name":"罗塔诺海"},"3448":{"id":3448,"name":"加拉迪翁湾外海"},"3449":{"id":3449,"name":"加拉迪翁湾外海幻海流"},"3450":{"id":3450,"name":"梅尔托尔海峡南"},"3451":{"id":3451,"name":"梅尔托尔海峡南幻海流"},"3452":{"id":3452,"name":"梅尔托尔海峡北"},"3453":{"id":3453,"name":"梅尔托尔海峡北幻海流"},"3454":{"id":3454,"name":"罗塔诺海海面"},"3455":{"id":3455,"name":"罗塔诺海海面幻海流"},"3456":{"id":3456,"name":"蛇水湖中央"},"3457":{"id":3457,"name":"蛇水湖南"},"3458":{"id":3458,"name":"缪栎之泪"},"3459":{"id":3459,"name":"俾斯麦的额头"},"3461":{"id":3461,"name":"追忆馆"},"3467":{"id":3467,"name":"阿尼德罗追忆馆","parentId":2950,"size":2},"3472":{"id":3472,"name":"霍啪栌古盘"},"3473":{"id":3473,"name":"十字镐大街"},"3474":{"id":3474,"name":"圣罗埃勒广场"},"3475":{"id":3475,"name":"新巢居住区"},"3476":{"id":3476,"name":"罗兰莓田"},"3477":{"id":3477,"name":"努力号"},"3478":{"id":3478,"name":"甘戈斯"},"3489":{"id":3489,"name":"摇风云海"},"3492":{"id":3492,"name":"人偶军事基地","parentId":2950,"size":2},"3497":{"id":3497,"name":"陨坑"},"3526":{"id":3526,"name":"天钢机工房分馆"},"3527":{"id":3527,"name":"算盘大街"},"3528":{"id":3528,"name":"白霜官舍"},"3529":{"id":3529,"name":"乌特亚前哨"},"3532":{"id":3532,"name":"息风云海"},"3533":{"id":3533,"name":"烈风云海"},"3534":{"id":3534,"name":"南方博兹雅战线","weatherRate":124},"3536":{"id":3536,"name":"南部堑壕区"},"3542":{"id":3542,"name":"失落的遗迹"},"3571":{"id":3571,"name":"燕鸥崖"},"3572":{"id":3572,"name":"阿诺古的房间","parentId":2950,"size":4},"3574":{"id":3574,"name":"沃茨之锤"},"3576":{"id":3576,"name":"人偶军事基地","parentId":2950,"size":2},"3581":{"id":3581,"name":"帝国海上基地干船坞","parentId":24,"size":4},"3597":{"id":3597,"name":"女王古殿"},"3601":{"id":3601,"name":"遗留的前庭"},"3621":{"id":3621,"name":"谢尔达莱群岛近海"},"3622":{"id":3622,"name":"谢尔达莱群岛近海幻海流"},"3623":{"id":3623,"name":"绯汐海近海"},"3624":{"id":3624,"name":"绯汐海近海幻海流"},"3625":{"id":3625,"name":"罗斯利特湾近海"},"3626":{"id":3626,"name":"罗斯利特湾近海幻海流"},"3627":{"id":3627,"name":"红玉海底东部"},"3628":{"id":3628,"name":"小林丸北侧"},"3629":{"id":3629,"name":"沉没江船南侧"},"3630":{"id":3630,"name":"太阳湖底南部"},"3631":{"id":3631,"name":"盐湖湖底深部"},"3632":{"id":3632,"name":"贤岛东侧"},"3633":{"id":3633,"name":"身镜湖东部"},"3634":{"id":3634,"name":"蛇水湖湖底深部"},"3636":{"id":3636,"name":"鲁什芒德纪念医院"},"3637":{"id":3637,"name":"羽毛笔大街"},"3638":{"id":3638,"name":"诗伯门"},"3639":{"id":3639,"name":"浸雪浴场"},"3641":{"id":3641,"name":"谢尔达莱群岛"},"3642":{"id":3642,"name":"绯汐海"},"3643":{"id":3643,"name":"罗斯利特湾"},"3662":{"id":3662,"name":"扎杜诺尔高原","weatherRate":130},"3663":{"id":3663,"name":"究极救世者G型战斗甲板"},"3664":{"id":3664,"name":"弗尔德尼斯前哨"},"3665":{"id":3665,"name":"斯匹塔克阵地"},"3666":{"id":3666,"name":"耶杰班阵地"},"3667":{"id":3667,"name":"赫玛威尔阵地"},"3684":{"id":3684,"name":"月球深处","parentId":3704,"size":4,"weatherRate":139},"3685":{"id":3685,"name":"母水晶","parentId":3702,"size":4,"weatherRate":139},"3686":{"id":3686,"name":"尽头的终点","parentId":3704,"size":4,"weatherRate":116},"3694":{"id":3694,"name":"皓天炉舍大厅","parentId":25,"size":4},"3700":{"id":3700,"name":"原初世界","parentId":3700,"size":1},"3701":{"id":3701,"name":"第一世界","parentId":3701,"size":1},"3702":{"id":3702,"name":"北洋地域","parentId":3702,"size":1},"3703":{"id":3703,"name":"伊尔萨巴德","parentId":3703,"size":1},"3704":{"id":3704,"name":"星外天域","parentId":3704,"size":1},"3705":{"id":3705,"name":"古代世界","parentId":3705,"size":1},"3706":{"id":3706,"name":"旧萨雷安","parentId":3702,"size":2,"weatherRate":137},"3707":{"id":3707,"name":"拉札罕","parentId":3703,"size":2,"weatherRate":138},"3708":{"id":3708,"name":"迷津","parentId":3702,"size":1,"weatherRate":131},"3709":{"id":3709,"name":"萨维奈岛","parentId":3703,"size":1,"weatherRate":132},"3710":{"id":3710,"name":"加雷马","parentId":3703,"size":1,"weatherRate":133},"3711":{"id":3711,"name":"叹息海","parentId":3704,"size":1,"weatherRate":135},"3712":{"id":3712,"name":"天外天垓","parentId":3704,"size":1,"weatherRate":136},"3713":{"id":3713,"name":"厄尔庇斯","parentId":3705,"size":1,"weatherRate":134},"3715":{"id":3715,"name":"穹顶皓天东南区"},"3721":{"id":3721,"name":"穹顶皓天东北区"},"3746":{"id":3746,"name":"白滨村南部"},"3747":{"id":3747,"name":"白滨村西部"},"3748":{"id":3748,"name":"遗烈乡南部"},"3749":{"id":3749,"name":"摩耶幻泉"},"3750":{"id":3750,"name":"白滨村外海"},"3751":{"id":3751,"name":"自凝岛北部"},"3752":{"id":3752,"name":"渔村附近"},"3753":{"id":3753,"name":"镜仙洞附近"},"3754":{"id":3754,"name":"龟甲岛东北部"},"3755":{"id":3755,"name":"境岛东部"},"3756":{"id":3756,"name":"自凝岛西北部"},"3757":{"id":3757,"name":"石牡丹岩窟附近"},"3758":{"id":3758,"name":"盐湖东北部"},"3801":{"id":3801,"name":"所见大讲堂"},"3802":{"id":3802,"name":"精制堂"},"3803":{"id":3803,"name":"屯集堂"},"3804":{"id":3804,"name":"公开讲堂"},"3805":{"id":3805,"name":"所思大书院"},"3806":{"id":3806,"name":"讨论者圆亭"},"3808":{"id":3808,"name":"思考者圆亭"},"3810":{"id":3810,"name":"哲学家广场"},"3811":{"id":3811,"name":"诡巧大厅"},"3812":{"id":3812,"name":"水仙女神龛"},"3813":{"id":3813,"name":"传送魔法研究所"},"3814":{"id":3814,"name":"以太之光广场"},"3815":{"id":3815,"name":"露天集市"},"3816":{"id":3816,"name":"巴尔德西昂分馆"},"3817":{"id":3817,"name":"正厅","parentId":3702,"size":4,"weatherRate":137},"3820":{"id":3820,"name":"莱韦耶勒尔府"},"3821":{"id":3821,"name":"海鹦广场"},"3823":{"id":3823,"name":"背水咖啡厅"},"3824":{"id":3824,"name":"纽恩克雷夫的瞭望岩"},"3825":{"id":3825,"name":"才流柱廊"},"3826":{"id":3826,"name":"知识神像"},"3827":{"id":3827,"name":"列柱廊"},"3828":{"id":3828,"name":"出入国管理所"},"3829":{"id":3829,"name":"外环"},"3830":{"id":3830,"name":"诡巧之路"},"3831":{"id":3831,"name":"卫辅城上层"},"3832":{"id":3832,"name":"下水沟渠"},"3833":{"id":3833,"name":"公堂保管院"},"3834":{"id":3834,"name":"恩惠圆顶屋"},"3835":{"id":3835,"name":"帕斯梅朗种畜研究所"},"3839":{"id":3839,"name":"朝露林"},"3840":{"id":3840,"name":"人工雾控制塔"},"3841":{"id":3841,"name":"中环"},"3842":{"id":3842,"name":"梅丽奥尔实验农场"},"3843":{"id":3843,"name":"心之风"},"3844":{"id":3844,"name":"闪耀中枢"},"3845":{"id":3845,"name":"命之风"},"3846":{"id":3846,"name":"卫辅城下层"},"3847":{"id":3847,"name":"安居酪农场"},"3848":{"id":3848,"name":"内环"},"3849":{"id":3849,"name":"理性其一"},"3850":{"id":3850,"name":"小萨雷安"},"3851":{"id":3851,"name":"理性其二"},"3852":{"id":3852,"name":"无路总部"},"3853":{"id":3853,"name":"理性其三"},"3854":{"id":3854,"name":"可可罗工房"},"3855":{"id":3855,"name":"惊愕所"},"3857":{"id":3857,"name":"象鼻狮大桥"},"3858":{"id":3858,"name":"真眼门"},"3859":{"id":3859,"name":"誓约阶梯"},"3861":{"id":3861,"name":"阿尔扎达尔庙"},"3863":{"id":3863,"name":"拉札罕飞艇坪"},"3865":{"id":3865,"name":"云使宫"},"3866":{"id":3866,"name":"妮洛帕拉畜产局"},"3867":{"id":3867,"name":"织风桑田"},"3868":{"id":3868,"name":"鲁维达纺丝局"},"3870":{"id":3870,"name":"星战士团大本营"},"3871":{"id":3871,"name":"流星之间"},"3872":{"id":3872,"name":"西巴尔夏恩大巴扎"},"3873":{"id":3873,"name":"东巴尔夏恩大巴扎"},"3874":{"id":3874,"name":"梅丽德酒房"},"3875":{"id":3875,"name":"以太之光广场"},"3876":{"id":3876,"name":"炼金术制药堂"},"3878":{"id":3878,"name":"卡玛爱区"},"3879":{"id":3879,"name":"微风海岸"},"3880":{"id":3880,"name":"新港"},"3881":{"id":3881,"name":"恋船岛"},"3884":{"id":3884,"name":"白滨村"},"3885":{"id":3885,"name":"熏香丘陵"},"3886":{"id":3886,"name":"代米尔遗烈乡"},"3887":{"id":3887,"name":"卡嘉雅舞台"},"3888":{"id":3888,"name":"桓娑牧场遗址"},"3889":{"id":3889,"name":"巨胆石采掘场"},"3892":{"id":3892,"name":"众僧林园"},"3893":{"id":3893,"name":"塔门"},"3894":{"id":3894,"name":"波洛伽护法村"},"3895":{"id":3895,"name":"帕瓦纳的悔悟"},"3896":{"id":3896,"name":"圣仙阿迦玛之墓"},"3897":{"id":3897,"name":"乳河"},"3898":{"id":3898,"name":"摩耶幻泉"},"3899":{"id":3899,"name":"神我寺"},"3900":{"id":3900,"name":"星战士团训练场"},"3901":{"id":3901,"name":"值夜海崖"},"3902":{"id":3902,"name":"艾布拉纳冰原"},"3903":{"id":3903,"name":"碎璃营地"},"3904":{"id":3904,"name":"平原仓库"},"3905":{"id":3905,"name":"公务宿舍G栋"},"3906":{"id":3906,"name":"封赏别墅"},"3907":{"id":3907,"name":"大青湖"},"3908":{"id":3908,"name":"啜饮洞"},"3909":{"id":3909,"name":"朱图尔娜七号水上钻井平台"},"3910":{"id":3910,"name":"新房区"},"3911":{"id":3911,"name":"恩塞拉都斯魔导工厂"},"3912":{"id":3912,"name":"开放广场"},"3913":{"id":3913,"name":"第四市外站"},"3914":{"id":3914,"name":"脱轨列车"},"3915":{"id":3915,"name":"第三站"},"3916":{"id":3916,"name":"青磷管道"},"3917":{"id":3917,"name":"都市区"},"3918":{"id":3918,"name":"加雷马元老院"},"3919":{"id":3919,"name":"帝国新宫"},"3920":{"id":3920,"name":"索鲁斯广场"},"3921":{"id":3921,"name":"帝都高架路"},"3922":{"id":3922,"name":"洁白环濠"},"3925":{"id":3925,"name":"南风诺托斯的感叹"},"3926":{"id":3926,"name":"前关门","parentId":3705,"size":1},"3927":{"id":3927,"name":"新芽玄关"},"3928":{"id":3928,"name":"醒悟天测园"},"3929":{"id":3929,"name":"十二奇园"},"3931":{"id":3931,"name":"汐沫庭"},"3933":{"id":3933,"name":"南风航"},"3934":{"id":3934,"name":"西风仄费罗斯的喝彩"},"3935":{"id":3935,"name":"偏南西风航"},"3936":{"id":3936,"name":"转移六洋院"},"3937":{"id":3937,"name":"突转藏晶院"},"3938":{"id":3938,"name":"创作者之家"},"3939":{"id":3939,"name":"偏北西风航"},"3940":{"id":3940,"name":"逍遥水径"},"3942":{"id":3942,"name":"偏南北风航"},"3943":{"id":3943,"name":"极北造物院"},"3945":{"id":3945,"name":"东风欧洛斯的冷笑"},"3946":{"id":3946,"name":"翠牙园"},"3947":{"id":3947,"name":"忘海"},"3948":{"id":3948,"name":"东风航"},"3949":{"id":3949,"name":"泪湾"},"3950":{"id":3950,"name":"监视者之馆"},"3951":{"id":3951,"name":"叹息海南部"},"3952":{"id":3952,"name":"灵水之剑"},"3953":{"id":3953,"name":"灵冰之剑"},"3954":{"id":3954,"name":"灵土之剑"},"3955":{"id":3955,"name":"荧光洞"},"3957":{"id":3957,"name":"痛苦月谷"},"3958":{"id":3958,"name":"叹息海北部"},"3959":{"id":3959,"name":"灵风之剑"},"3960":{"id":3960,"name":"灵雷之剑"},"3961":{"id":3961,"name":"灵火之剑"},"3962":{"id":3962,"name":"西德尼亚丘陵"},"3963":{"id":3963,"name":"爱情威的花园"},"3964":{"id":3964,"name":"苦湾"},"3965":{"id":3965,"name":"海姆达尔级观察艇残骸"},"3966":{"id":3966,"name":"最佳威兔洞"},"3967":{"id":3967,"name":"月帆罩"},"3968":{"id":3968,"name":"胡萝卜所"},"3969":{"id":3969,"name":"最伟大的森林"},"3970":{"id":3970,"name":"瓦铭癸辛"},"3971":{"id":3971,"name":"诸神黄昏号魔导船"},"3972":{"id":3972,"name":"熔化的前哨基地"},"3973":{"id":3973,"name":"半途终旅"},"3974":{"id":3974,"name":"未颂龙诗"},"3975":{"id":3975,"name":"瓦铭丙"},"3976":{"id":3976,"name":"逡巡泉"},"3977":{"id":3977,"name":"再赋肉身"},"3978":{"id":3978,"name":"异亚村落"},"3979":{"id":3979,"name":"辞世绝句碑"},"3980":{"id":3980,"name":"异亚转移阵"},"3982":{"id":3982,"name":"遗弃的传送门"},"3983":{"id":3983,"name":"奥密克戎基地"},"3984":{"id":3984,"name":"凋零的传送门"},"3985":{"id":3985,"name":"生命树"},"3986":{"id":3986,"name":"斯提格玛一"},"3988":{"id":3988,"name":"瓦铭甲"},"3989":{"id":3989,"name":"无命镇"},"3990":{"id":3990,"name":"尽头的中心"},"4021":{"id":4021,"name":"天际","parentId":3704,"size":1,"weatherRate":143},"4022":{"id":4022,"name":"夜游魂总部","parentId":24,"size":4},"4023":{"id":4023,"name":"作战会议室","parentId":25,"size":4},"4024":{"id":4024,"name":"神门之间","parentId":3703,"size":1},"4029":{"id":4029,"name":"遗忘的传送门"},"4030":{"id":4030,"name":"大金库"},"4031":{"id":4031,"name":"翁法洛斯"},"4032":{"id":4032,"name":"后营门","parentId":24,"size":4},"4033":{"id":4033,"name":"万魔殿正门","parentId":3705,"size":1,"weatherRate":145},"4034":{"id":4034,"name":"所思大书院禁书库","parentId":3702,"size":4,"weatherRate":137},"4035":{"id":4035,"name":"阿尔扎达尔海底遗迹群","parentId":3703,"size":2},"4036":{"id":4036,"name":"特罗亚宫廷"},"4037":{"id":4037,"name":"寻因星晶镜","parentId":3702,"size":2},"4038":{"id":4038,"name":"零的领域"},"4039":{"id":4039,"name":"云使宫客房","parentId":3703,"size":8,"weatherRate":138},"4040":{"id":4040,"name":"魔人的藏身之处","parentId":23,"size":4},"4041":{"id":4041,"name":"A4调查平台"},"4043":{"id":4043,"name":"无名岛"},"4046":{"id":4046,"name":"零的住所"},"4047":{"id":4047,"name":"广场"},"4048":{"id":4048,"name":"背世咖啡厅"},"4049":{"id":4049,"name":"农业区"},"4050":{"id":4050,"name":"知识神海港"},"4051":{"id":4051,"name":"碧谷"},"4052":{"id":4052,"name":"沉思泉"},"4053":{"id":4053,"name":"一号天球口"},"4054":{"id":4054,"name":"一号沟渠"},"4055":{"id":4055,"name":"二号天球口"},"4056":{"id":4056,"name":"二号沟渠"},"4057":{"id":4057,"name":"深壕"},"4058":{"id":4058,"name":"云使飞沫"},"4059":{"id":4059,"name":"新港沿岸"},"4060":{"id":4060,"name":"萨维奈岛近海"},"4061":{"id":4061,"name":"代米尔遗烈乡沿岸"},"4062":{"id":4062,"name":"巨胆石采掘场"},"4063":{"id":4063,"name":"塔门"},"4064":{"id":4064,"name":"乳河"},"4065":{"id":4065,"name":"帕瓦纳的悔悟"},"4066":{"id":4066,"name":"摩耶幻泉"},"4067":{"id":4067,"name":"熏香海岸"},"4068":{"id":4068,"name":"艾布拉纳不冻池"},"4069":{"id":4069,"name":"洁白环濠"},"4070":{"id":4070,"name":"最伟大的森林"},"4071":{"id":4071,"name":"荧光池"},"4072":{"id":4072,"name":"冻土裂痕"},"4073":{"id":4073,"name":"逍遥水径"},"4074":{"id":4074,"name":"翠牙园下层"},"4075":{"id":4075,"name":"忘海"},"4076":{"id":4076,"name":"沼癸辛γ"},"4077":{"id":4077,"name":"沼癸辛β"},"4078":{"id":4078,"name":"沼癸辛α"},"4079":{"id":4079,"name":"逡巡泉"},"4080":{"id":4080,"name":"异亚村落"},"4081":{"id":4081,"name":"湖癸辛"},"4082":{"id":4082,"name":"湖丙α"},"4083":{"id":4083,"name":"湖丙β"},"4087":{"id":4087,"name":"海洋区"},"4088":{"id":4088,"name":"游乐区"},"4089":{"id":4089,"name":"森林区"},"4139":{"id":4139,"name":"穹顶皓天","parentId":25,"size":2,"weatherRate":142},"4140":{"id":4140,"name":"圣龙门"},"4141":{"id":4141,"name":"融雪温泉"},"4142":{"id":4142,"name":"战戟大街"},"4143":{"id":4143,"name":"义勇门"},"4152":{"id":4152,"name":"[扩建区]当古兰纪念公园"},"4154":{"id":4154,"name":"阿尔扎达尔海底遗迹群","parentId":3703,"size":2},"4158":{"id":4158,"name":"塌陷的大厅"},"4160":{"id":4160,"name":"封宝之间"},"4167":{"id":4167,"name":"灿烂神域阿格莱亚"},"4179":{"id":4179,"name":"盐湖西南"},"4180":{"id":4180,"name":"特罗亚宫廷"},"4181":{"id":4181,"name":"第四监狱"},"4183":{"id":4183,"name":"水占庭园"},"4184":{"id":4184,"name":"责罪广场"},"4185":{"id":4185,"name":"首席神官之间"},"4188":{"id":4188,"name":"第四监狱"},"4191":{"id":4191,"name":"至福乐土农业区"},"4192":{"id":4192,"name":"至福乐土海洋区α"},"4193":{"id":4193,"name":"至福乐土海洋区β"},"4194":{"id":4194,"name":"至福乐土游乐区α"},"4195":{"id":4195,"name":"至福乐土游乐区β"},"4250":{"id":4250,"name":"生命奥秘研究层","parentId":3705,"size":4,"weatherRate":145},"4251":{"id":4251,"name":"至福乐土","parentId":3704,"size":4,"weatherRate":136},"4258":{"id":4258,"name":"喜悦神域欧芙洛绪涅"},"4278":{"id":4278,"name":"白岭山腹"},"4279":{"id":4279,"name":"收割村"},"4280":{"id":4280,"name":"冥魂泉"},"4281":{"id":4281,"name":"贤岛西南侧"},"4282":{"id":4282,"name":"沉没教会附近"},"4283":{"id":4283,"name":"石绿湖东北湖底"},"4290":{"id":4290,"name":"希望的货舱"},"4295":{"id":4295,"name":"冥魂石洞","parentId":3703,"size":2,"weatherRate":42},"4296":{"id":4296,"name":"立方魔法阵"},"4362":{"id":4362,"name":"万魔的产房","parentId":3702,"size":4,"weatherRate":145},"4367":{"id":4367,"name":"妖歌海海面"},"4368":{"id":4368,"name":"妖歌海海面幻海流"},"4369":{"id":4369,"name":"黄金港近海"},"4370":{"id":4370,"name":"黄金港近海幻海流"},"4371":{"id":4371,"name":"红玉海海面"},"4372":{"id":4372,"name":"红玉海海面幻海流"},"4373":{"id":4373,"name":"无二江下游"},"4374":{"id":4374,"name":"无二江下游幻海流"},"4377":{"id":4377,"name":"阿赖耶宝塔","parentId":3703,"size":4,"weatherRate":114},"4378":{"id":4378,"name":"魔石矿脉"},"4380":{"id":4380,"name":"埃斯蒂尼安的房间","parentId":3703,"size":8,"weatherRate":138},"4381":{"id":4381,"name":"元老院站","parentId":3703,"size":4,"weatherRate":133},"4382":{"id":4382,"name":"红月"},"4429":{"id":4429,"name":"采贝洞附近"},"4430":{"id":4430,"name":"石绿湖西北湖底"},"4431":{"id":4431,"name":"月面地下溪谷"},"4432":{"id":4432,"name":"月面地下溪谷"},"4441":{"id":4441,"name":"红月深处"},"4443":{"id":4443,"name":"荣华神域塔利亚"},"4451":{"id":4451,"name":"水天"},"4456":{"id":4456,"name":"星天"},"4468":{"id":4468,"name":"金碟巨豆中心广场","parentId":24,"size":8},"4500":{"id":4500,"name":"尤卡图拉尔","parentId":4500,"size":1},"4501":{"id":4501,"name":"萨卡图拉尔","parentId":4501,"size":1},"4502":{"id":4502,"name":"无失世界","parentId":4502,"size":1},"4503":{"id":4503,"name":"九号解决方案","parentId":4501,"size":1.8,"weatherRate":163},"4504":{"id":4504,"name":"图莱尤拉","parentId":4500,"size":1.8,"weatherRate":159},"4505":{"id":4505,"name":"奥阔帕恰山","parentId":4500,"size":1,"weatherRate":160},"4506":{"id":4506,"name":"克扎玛乌卡湿地","parentId":4500,"size":1,"weatherRate":161},"4507":{"id":4507,"name":"亚克特尔树海","parentId":4500,"size":1,"weatherRate":162},"4508":{"id":4508,"name":"夏劳尼荒野","parentId":4501,"size":1,"weatherRate":164},"4509":{"id":4509,"name":"遗产之地","parentId":4501,"size":1,"weatherRate":165},"4510":{"id":4510,"name":"活着的记忆","parentId":4502,"size":1,"weatherRate":166},"4518":{"id":4518,"name":"满潮港"},"4521":{"id":4521,"name":"沃洛克联王宫"},"4522":{"id":4522,"name":"羽毛广场"},"4523":{"id":4523,"name":"金凰大堂","parentId":4500,"size":4,"weatherRate":159},"4524":{"id":4524,"name":"鹏翼露台"},"4525":{"id":4525,"name":"萨卡图拉尔关门"},"4527":{"id":4527,"name":"鲜羽兵站"},"4528":{"id":4528,"name":"心火塔"},"4529":{"id":4529,"name":"捷足广场"},"4530":{"id":4530,"name":"鸟趾大路"},"4531":{"id":4531,"name":"海泡农园"},"4532":{"id":4532,"name":"海岸鸟群市场"},"4533":{"id":4533,"name":"珠串万货街"},"4534":{"id":4534,"name":"缇姨家的塔可饼"},"4535":{"id":4535,"name":"以太之光广场"},"4536":{"id":4536,"name":"休喙泉"},"4537":{"id":4537,"name":"贝壳亭"},"4538":{"id":4538,"name":"戈尼特鲁珂宝滩"},"4539":{"id":4539,"name":"金曦的旅程"},"4540":{"id":4540,"name":"船头小屋","parentId":4500,"size":8,"weatherRate":159},"4541":{"id":4541,"name":"古鲁加加凯旋门"},"4542":{"id":4542,"name":"曙歌大鼓"},"4543":{"id":4543,"name":"气球起降所"},"4544":{"id":4544,"name":"羊驼站"},"4545":{"id":4545,"name":"恰巴玉凯克平原"},"4546":{"id":4546,"name":"恰巴梅奇平原"},"4547":{"id":4547,"name":"抚慰千古"},"4548":{"id":4548,"name":"遥远的叹息"},"4549":{"id":4549,"name":"拉托托花田"},"4550":{"id":4550,"name":"瓦丘恩佩洛"},"4551":{"id":4551,"name":"烈酒蒸馏所"},"4552":{"id":4552,"name":"朋友牧场"},"4553":{"id":4553,"name":"指尖馆"},"4554":{"id":4554,"name":"伊库乌洛商旅馆"},"4555":{"id":4555,"name":"龙舌兰牙床"},"4556":{"id":4556,"name":"帕纳克佩鲁休养所"},"4557":{"id":4557,"name":"坡弗露运输公司"},"4558":{"id":4558,"name":"奇毕露咖啡农园"},"4559":{"id":4559,"name":"米普露马黛茶园"},"4560":{"id":4560,"name":"欧伦坎卡谷"},"4561":{"id":4561,"name":"万千踩踏的路"},"4562":{"id":4562,"name":"沃拉的回响"},"4563":{"id":4563,"name":"卡辽扎神殿"},"4564":{"id":4564,"name":"哀苦的遗影"},"4565":{"id":4565,"name":"纳尤戈纳"},"4566":{"id":4566,"name":"伫立的自证"},"4568":{"id":4568,"name":"其瓦固盐田"},"4571":{"id":4571,"name":"不要忘却的深奥"},"4572":{"id":4572,"name":"护花守墓屋"},"4573":{"id":4573,"name":"沃刻拉朵山"},"4575":{"id":4575,"name":"孵卵树群"},"4577":{"id":4577,"name":"活船水路下游"},"4578":{"id":4578,"name":"水果树群"},"4579":{"id":4579,"name":"露草河岸"},"4580":{"id":4580,"name":"活船水路上游"},"4581":{"id":4581,"name":"釉烧河岸"},"4582":{"id":4582,"name":"哈努聚落"},"4583":{"id":4583,"name":"繁茂温风大房"},"4584":{"id":4584,"name":"星光满溢洞窟"},"4585":{"id":4585,"name":"腿的血流"},"4587":{"id":4587,"name":"首的血流"},"4588":{"id":4588,"name":"大舌头瀑布潭"},"4589":{"id":4589,"name":"竿网栈桥"},"4590":{"id":4590,"name":"浮着的桥"},"4591":{"id":4591,"name":"金涡水田"},"4592":{"id":4592,"name":"大家的聚落"},"4593":{"id":4593,"name":"溢水浮岛大房"},"4594":{"id":4594,"name":"干燥圣地"},"4596":{"id":4596,"name":"无翼姐弟的大阶台"},"4597":{"id":4597,"name":"阳光照耀的路"},"4598":{"id":4598,"name":"朋友的灯火"},"4599":{"id":4599,"name":"生息码头"},"4601":{"id":4601,"name":"失败者的船"},"4603":{"id":4603,"name":"土陶郡"},"4604":{"id":4604,"name":"釉药工房"},"4605":{"id":4605,"name":"破裂的水瓶"},"4606":{"id":4606,"name":"居高临下的巨影"},"4607":{"id":4607,"name":"奸臣的展示台"},"4608":{"id":4608,"name":"乌托姆地平线"},"4609":{"id":4609,"name":"白烬古战场"},"4610":{"id":4610,"name":"加提卡海心"},"4611":{"id":4611,"name":"绀碧地门"},"4612":{"id":4612,"name":"气球起降所"},"4614":{"id":4614,"name":"红豹村"},"4615":{"id":4615,"name":"记星园庭"},"4616":{"id":4616,"name":"磨牙铸工"},"4617":{"id":4617,"name":"拳印"},"4618":{"id":4618,"name":"守夜人的睨视"},"4620":{"id":4620,"name":"赤血天坑"},"4621":{"id":4621,"name":"余痕屋群"},"4622":{"id":4622,"name":"白烬天坑"},"4623":{"id":4623,"name":"冥境隧路"},"4624":{"id":4624,"name":"冥境天坑"},"4625":{"id":4625,"name":"玛穆克"},"4626":{"id":4626,"name":"战火炎石舞台"},"4627":{"id":4627,"name":"甜水泉"},"4628":{"id":4628,"name":"碧眼人家"},"4629":{"id":4629,"name":"鲜甜蜜园"},"4632":{"id":4632,"name":"延根天坑"},"4633":{"id":4633,"name":"献出的战地"},"4634":{"id":4634,"name":"抱拥天坑"},"4635":{"id":4635,"name":"磨鳞训练场"},"4637":{"id":4637,"name":"永命岩窟"},"4638":{"id":4638,"name":"深空天坑"},"4643":{"id":4643,"name":"消遣地区"},"4644":{"id":4644,"name":"地场节点·九"},"4645":{"id":4645,"name":"信息中心"},"4646":{"id":4646,"name":"9-14号居住栋"},"4647":{"id":4647,"name":"联合商城"},"4648":{"id":4648,"name":"锦砖咖啡"},"4649":{"id":4649,"name":"解答所"},"4650":{"id":4650,"name":"实践公园"},"4651":{"id":4651,"name":"真唯大道"},"4652":{"id":4652,"name":"阿卡狄亚协会"},"4653":{"id":4653,"name":"霓虹酒杯"},"4654":{"id":4654,"name":"后房","parentId":4501,"size":4},"4655":{"id":4655,"name":"三尾训练馆"},"4656":{"id":4656,"name":"亚塔纳内草地"},"4657":{"id":4657,"name":"帕利尤南沃野"},"4658":{"id":4658,"name":"艾休凯亚尼荒原"},"4659":{"id":4659,"name":"胡萨塔伊驿镇"},"4660":{"id":4660,"name":"鲁瓦特尼亚萨"},"4661":{"id":4661,"name":"山谢亚的大口"},"4662":{"id":4662,"name":"图莱尤拉关门"},"4664":{"id":4664,"name":"美花黑泽恩"},"4666":{"id":4666,"name":"好渔夫湖岸"},"4667":{"id":4667,"name":"谢申内青磷泉"},"4668":{"id":4668,"name":"夏劳尼站"},"4669":{"id":4669,"name":"托纳特尼亚维"},"4670":{"id":4670,"name":"清风低语的山丘"},"4671":{"id":4671,"name":"尤艾亚·灰得墓地"},"4672":{"id":4672,"name":"尤艾卡峡谷"},"4674":{"id":4674,"name":"亚斯拉尼荒野东部"},"4675":{"id":4675,"name":"永护塔外围"},"4676":{"id":4676,"name":"旧亚历山德里亚"},"4677":{"id":4677,"name":"先锋营"},"4678":{"id":4678,"name":"亚斯拉尼站"},"4679":{"id":4679,"name":"台夏帕尼废村"},"4680":{"id":4680,"name":"落雷场"},"4682":{"id":4682,"name":"地中天道"},"4683":{"id":4683,"name":"蓄雷增幅设施"},"4685":{"id":4685,"name":"边郊镇"},"4686":{"id":4686,"name":"尤派光晕农地"},"4687":{"id":4687,"name":"终流地"},"4690":{"id":4690,"name":"兵器试验塔"},"4691":{"id":4691,"name":"带雷危险区域"},"4693":{"id":4693,"name":"留下名字的墓地"},"4694":{"id":4694,"name":"雷转质矿场"},"4695":{"id":4695,"name":"回忆之门"},"4697":{"id":4697,"name":"昨日乐园"},"4698":{"id":4698,"name":"风途园圃"},"4699":{"id":4699,"name":"火山庇护所"},"4700":{"id":4700,"name":"地场节点·忆"},"4701":{"id":4701,"name":"中央终端"},"4702":{"id":4702,"name":"水之终端"},"4703":{"id":4703,"name":"游水漫行街"},"4704":{"id":4704,"name":"关爱泉"},"4705":{"id":4705,"name":"达盖雷奥医疗史博物馆"},"4706":{"id":4706,"name":"不动钟塔"},"4707":{"id":4707,"name":"星河镜"},"4708":{"id":4708,"name":"旋转铁马"},"4709":{"id":4709,"name":"希望之轮"},"4710":{"id":4710,"name":"飞车乘降站"},"4711":{"id":4711,"name":"原型亚历山德里亚"},"4712":{"id":4712,"name":"土之终端"},"4713":{"id":4713,"name":"地场节点·风"},"4714":{"id":4714,"name":"探索花园"},"4716":{"id":4716,"name":"克雷拉自然史博物馆"},"4717":{"id":4717,"name":"易知区"},"4718":{"id":4718,"name":"风之终端"},"4719":{"id":4719,"name":"热井"},"4720":{"id":4720,"name":"闪山云喷泉"},"4721":{"id":4721,"name":"地场节点·火"},"4722":{"id":4722,"name":"勇武竞技场"},"4723":{"id":4723,"name":"过去的神子之路"},"4724":{"id":4724,"name":"火绳动物园"},"4725":{"id":4725,"name":"火之终端"},"4746":{"id":4746,"name":"以太之光广场"},"4747":{"id":4747,"name":"9-11号居住栋"},"4748":{"id":4748,"name":"地中天道秘密基地","parentId":4501,"size":4,"weatherRate":165},"4750":{"id":4750,"name":"航船甲板","parentId":3702,"size":4},"4751":{"id":4751,"name":"深空天坑最深处","parentId":4500,"size":4},"4909":{"id":4909,"name":"先锋营","parentId":4501,"size":2},"4910":{"id":4910,"name":"外侧区"},"5037":{"id":5037,"name":"休喙泉"},"5038":{"id":5038,"name":"船头小屋"},"5039":{"id":5039,"name":"满潮港"},"5040":{"id":5040,"name":"沉星浮泪的池"},"5041":{"id":5041,"name":"其瓦固盐池"},"5042":{"id":5042,"name":"卡瓦胡湖"},"5043":{"id":5043,"name":"水没羽毛树林"},"5044":{"id":5044,"name":"哈努水边"},"5045":{"id":5045,"name":"活船水路下游"},"5046":{"id":5046,"name":"露草河岸"},"5047":{"id":5047,"name":"水果岸边"},"5048":{"id":5048,"name":"大舌头瀑布潭"},"5049":{"id":5049,"name":"活船水路上游"},"5050":{"id":5050,"name":"虹彩水底"},"5051":{"id":5051,"name":"钓神基富天坑"},"5052":{"id":5052,"name":"红豹村蓄水池"},"5053":{"id":5053,"name":"蓝咬鹃天坑"},"5054":{"id":5054,"name":"赤血天坑"},"5055":{"id":5055,"name":"白烬天坑"},"5056":{"id":5056,"name":"足尖小坑"},"5057":{"id":5057,"name":"战地天坑"},"5058":{"id":5058,"name":"抱拥天坑"},"5059":{"id":5059,"name":"甜水泉"},"5060":{"id":5060,"name":"涩水天坑"},"5061":{"id":5061,"name":"冥境天坑"},"5062":{"id":5062,"name":"尼葵瑞皮河"},"5063":{"id":5063,"name":"特利湖"},"5064":{"id":5064,"name":"佐戈海峡西侧"},"5065":{"id":5065,"name":"佐戈海峡东侧"},"5066":{"id":5066,"name":"边郊镇壕沟"},"5067":{"id":5067,"name":"终流地"},"5068":{"id":5068,"name":"带雷危险水域"},"5069":{"id":5069,"name":"亚历山德里亚废墟"},"5070":{"id":5070,"name":"居住区域"},"5071":{"id":5071,"name":"易知区"},"5072":{"id":5072,"name":"亩鼠水泉"},"5073":{"id":5073,"name":"地场节点·风"},"5074":{"id":5074,"name":"运河镇南侧"},"5075":{"id":5075,"name":"运河镇北侧"},"5076":{"id":5076,"name":"原型亚历山德里亚"},"5077":{"id":5077,"name":"卡瓦胡湖"},"5078":{"id":5078,"name":"虹彩水底东侧"},"5079":{"id":5079,"name":"虹彩水底西侧"},"5080":{"id":5080,"name":"虹彩水底中央深处"},"5081":{"id":5081,"name":"钓神基富天坑"},"5082":{"id":5082,"name":"赤血天坑西侧"},"5083":{"id":5083,"name":"赤血天坑东侧"},"5084":{"id":5084,"name":"赤血天坑中央湖底"},"5085":{"id":5085,"name":"特利湖北侧"},"5116":{"id":5116,"name":"次元黄道","parentId":4502,"size":4,"weatherRate":157},"5117":{"id":5117,"name":"永护塔顶层","parentId":4501,"size":4,"weatherRate":158}}
