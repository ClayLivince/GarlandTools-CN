gt.npc = {
    pluralName: 'NPC',
    type: 'npc',
    blockTemplate: null,
    tradeEntryTemplate: null,
    index: {},
    partialIndex: {},
    version: 2,
    browse: [
        { type: 'group', prop: 'region' },
        { type: 'group', prop: 'location' },
        { type: 'sort', prop: 'name' }
    ],
    availabilityStateText: { 'active': '消失', 'dormant': '出现', 'spawning': '出现' },

    initialize: function(data) {
        gt.npc.blockTemplate = doT.template($('#block-npc-template').text());
        gt.npc.tradeEntryTemplate = doT.template($('#trade-entry-template').text());
    },

    cache: function(data) {
        gt.npc.index[data.npc.id] = data.npc;
    },

    bindEvents: function($block, data, view) {
        if (view.timer) {
            gt.display.notifications($block, data);
            gt.time.ensureTimerUpdate();
        }
    },

    getTradeViewModel: function(entry) {
        var transform = function(v, entryItem) {
            v.obj = entryItem;
            v.amount = entryItem.amount;
            v.hq = entryItem.hq;
            v.collectability = entryItem.collectability;
            return v;
        };

        return {
            item: gt.model.partialList(gt.item, entry.item, transform),
            currency: gt.model.partialList(gt.item, entry.currency, transform)
        };
    },

    getPartialViewModel: function (partial) {
        if (!partial) {
            console.error("Invalid NPC partial, ignoring.");
            return null;
        }

        var view = {
            id: partial.i,
            type: 'npc',
            name: partial.n,
            sourceName: partial.n,
            longSourceName: partial.n,
            icon: gt.npc.getPartialIcon(partial),
            byline: partial.t,
            obj: partial
        };

        var location = partial.l ? gt.location.index[partial.l] : null;
        if (location) {
            view.location = location.name;
            view.byline = (view.byline ? view.byline + ', ' : '') + view.location;
            view.sourceName = view.name + ", " + gt.util.abbr(view.location);
            view.longSourceName = view.name + ", " + view.location;

            if (location.parentId)
                view.region = gt.location.index[location.parentId].name;
            else
                view.region = '其他';
        }
        else {
            view.location = '';
            view.region = '';
        }

        if (partial.c){
            view.coords = partial.c;
        }

        return view;
    },

    getViewModel: function(npc, data) {
        var view = {
            id: npc.id,
            type: 'npc',
            name: npc.name,
            patch: gt.formatPatch(npc.patch),
            template: gt.npc.blockTemplate,
            icon: gt.npc.getIcon(npc),
            subheader: 'NPC',
            settings: 1,

            title: npc.title,
            obj: npc,
            appearance: npc.appearance
        };

        gt.localize.extractLocalize(npc, view);

        view.byline = view.title;

        if (npc.zoneid) {
            var location = gt.location.index[npc.zoneid];
            if (location) {
                view.fullLocation = view.location = location.name;
                if (npc.coords) {
                    view.fullLocation += ' (' + Math.round(npc.coords[0]) + ', ' + Math.round(npc.coords[1]) + ')';
                    view.map = gt.map.getViewModel({ location: location, coords: npc.coords, approx: npc.approx, icon: view.icon });
                }
            }
        }

        if (npc.areaid) {
            var area = gt.location.index[npc.areaid];
            if (area)
                view.area = area.name;
        }

        if (data) {
            var altParts = [];

            // Shops
            if (npc.shops) {
                for (var i = 0; i < npc.shops.length; i++) {
                    var shop = npc.shops[i];
                    if (shop.trade) {
                        var entries = _.map(shop.entries, gt.npc.getTradeViewModel);
                        if (!view.trades)
                            view.trades = [];
                        view.trades.push({ name: shop.name, entries: entries });
                    } else {
                        if (!view.shops)
                            view.shops = [];

                        var items = gt.model.partialList(gt.item, shop.entries);
                        items = _.sortBy(items, function(i) { return i.name; });
                        view.shops.push({ name: shop.name, items: items });
                    }
                }
            }

            if (npc.alts) {
                view.alts = gt.model.partialList(gt.npc, npc.alts, function(v, id) {
                    var alt = v.obj;
                    var altDesc = [];
                    if (alt.s)
                        altDesc.push(alt.s + ' 商店');
                    if (alt.q)
                        altDesc.push(alt.q + ' 任务');
                    if (alt.k)
                        altDesc.push(alt.k + ' 对话');

                    if (!altDesc.length)
                        altDesc.push("其他");

                    v.desc = altDesc.join(', ');
                    v.isCurrent = alt.i == npc.id;
                    v.location = v.location || '???';
                    return v;
                });
            }

            if (npc.appalts) {
                view.appalts = gt.model.partialList(gt.npc, npc.appalts, function(v, id) {
                    var alt = v.obj;
                    var altDesc = [];
                    if (alt.s)
                        altDesc.push(alt.s + ' 商店');
                    if (alt.q)
                        altDesc.push(alt.q + ' 任务');
                    if (alt.k)
                        altDesc.push(alt.k + ' 对话');

                    if (!altDesc.length)
                        altDesc.push("其他");

                    v.name = alt.n;
                    v.desc = altDesc.join(', ');
                    v.isCurrent = alt.i == npc.id;
                    v.location = v.location || '???';
                    return v;
                });
            }

            if (npc.quests)
                view.quests = gt.model.partialList(gt.quest, npc.quests);

            if (npc.talk) {
                view.talk = _.map(npc.talk, function(t) {
                    var result = { lines: t.lines };
                    if (t.questid)
                        result.quest = gt.model.partial(gt.quest, t.questid);
                    return result;
                });
            }

            if (npc.tripletriad) {
                view.tripletriad = $.extend({}, npc.tripletriad);
                view.tripletriad.cards = gt.model.partialList(gt.item, npc.tripletriad.cards);
                if (npc.tripletriad.rewards)
                    view.tripletriad.rewards = gt.model.partialList(gt.item, npc.tripletriad.rewards);

                if (view.tripletriad.start && view.tripletriad.end) {
                    view.audio = 1;
                    view.timer = new gt.npc.timer(new Date(), view);
                    view.blockClass = 'timer';
                }
            }

            if (npc.equipment) {
                view.equip = [];
                for (var i = 0; i < npc.equipment.length; i++) {
                    var entry = npc.equipment[i];
                    var dyes= (entry.dye != null) + (entry.dye2 != null)

                    view.equip.push({
                        item: entry.id ? gt.model.partial(gt.item, entry.id) : null,
                        uncertainty: entry.uncertainty,
                        dye: {
                            1: entry.dye ? gt.dyes[entry.dye].name : "",
                            2: entry.dye2 ? gt.dyes[entry.dye2].name : "",
                        },
                        dyes: dyes,
                        slot: gt.item.equipSlotNames[entry.slot],
                        model: entry.model
                    });
                }
            }
        }

        return view;
    },

    getPartialIcon: function(partial) {
        if (partial.s) {
            if (partial.r)
                return 'images/marker/Trader.png'
            else
                return 'images/marker/Shop.png';
        }

        if (partial.q)
            return 'images/marker/Quest.png';

        if (partial.k)
            return 'images/Journal.png';

        return 'images/marker/UnknownNpc.png';
    },

    getIcon: function(npc) {
        if (npc.shops) {
            if (npc.trade)
                return 'images/marker/Trader.png'
            else
                return 'images/marker/Shop.png';
        }

        if (npc.quests)
            return 'images/marker/Quest.png';

        if (npc.talk)
            return 'images/Journal.png';

        if (npc.appearance && npc.appearance.hairStyle)
            return '../files/icons/customize/' + npc.appearance.hairStyle + '.png';
        
        return 'images/marker/UnknownNpc.png';
    },

    resolveCraftSource: function(step, id) {
        if (id == -1)
            id = 0;

        if (!id) {
            // Prefer Material Supplier (1008837) and (1005633) to other vendors.
            if (_.contains(step.item.vendors, 1008837))
                id = 1008837;
            else if (_.contains(step.item.vendors, 1005633))
                id = 1005633;
        }

        step.sourceType = 'npc';
        step.sourceView = gt.model.partial(gt.npc, id || step.item.vendors[0]);
        step.price = { currency: 1, cost: step.item.price, totalCost: step.item.price, yield: 1 }; // 1 is the id of gil.
        step.setCategory(['金币商人', '商人']);
    }
};

gt.npc.timer = function(now, npc) {
    // For triple triad.

    var eNow = gt.time.localToEorzea(now);
    var hUp = (24 + npc.tripletriad.end - npc.tripletriad.start) % 24;

    var active = new Date(eNow);
    active.setUTCMinutes(0);
    active.setUTCSeconds(0);
    active.setUTCHours(npc.tripletriad.start);

    var expire = new Date(active);
    expire.setUTCHours(npc.tripletriad.start + hUp);

    var lastExpire = new Date(expire);
    lastExpire.setUTCDate(lastExpire.getUTCDate() - 1);

    this.type = 'npc';
    this.view = npc;
    this.availabilityStateText = gt.npc.availabilityStateText;
    this.period = {
        active: gt.time.eorzeaToLocal(active),
        expire: gt.time.eorzeaToLocal(expire),
        lastExpire: gt.time.eorzeaToLocal(lastExpire),
        mUp: hUp * 60
    };
    this.next(now);
    this.progress = gt.time.progress(now, this);
};

gt.npc.timer.prototype.next = function(now) {
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

gt.npc.timer.prototype.notify = function() {
    gt.util.showNotification(this.view.name, {
        icon: 'images/marker/TripleTriad.png',
        body: this.view.fullLocation || "可进行九宫幻卡对战",
        tag: this.view.id
    });
};
