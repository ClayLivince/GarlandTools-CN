gt.tripletriad = {
    blockTemplate: null,
    cardTemplate: null,
    cardSourceTemplate: null,
    current: null,
    total: -1,
    totalCommon: -1,
    totalExtra: -1,
    totalPages: 1,
    totalCommonPages: 1,
    totalExtraPages: 1,
    currentPage: 1,
    cardIcons: {
        1: "../files/icons/item/27662.png",
        2: "../files/icons/item/27663.png",
        3: "../files/icons/item/27664.png",
        4: "../files/icons/item/27665.png",
        5: "../files/icons/item/27666.png",
        0: "../files/icons/item/27671.png"
    },
    iconIds: ['27671', '27662', '27663', '27664', '27665', '27666'],
    spanCollected: "<span style=\"color: #29fa4a\">✔</span> 拿到了",
    spanNotCollected: "<span>❌</span> 没拿到",
    collectMode: false,

    initialize: function(data){
        gt.tripletriad.blockTemplate = doT.template($('#block-tripletriad-template').text());
        gt.tripletriad.cardTemplate = doT.template($('#tripletriad-card-template').text());
        gt.tripletriad.cardSourceTemplate = doT.template($('#tripletriad-source-template').text());

        this.buildCurrent(gt.tripletriad.cards["1"]);

        this.totalCommon = Object.keys(this.cards).length;
        this.totalExtra =Object.keys( this.extraCards).length;
        this.total = this.totalCommon + this.totalExtra;

        this.totalCommonPages = Math.ceil(this.totalCommon / 30);
        this.totalExtraPages = Math.ceil(this.totalExtra / 30);
        this.totalPages = this.totalCommonPages + this.totalExtraPages;
    },

    bindEvents: function($block, data, view){
        $('.tripletriad-list-row img', $block).click(gt.tripletriad.cardListImgClicked);
        $('.card-page-number', $block).click(gt.tripletriad.pageClicked);
        $('#collect-mode', $block).click(gt.tripletriad.collectModeClicked);
        $('#tripletriad-collect', $block).click(gt.tripletriad.collectItClicked);
    },

    rebindEvents: function($block){
        $('.tripletriad-list-row img', $block).click(gt.tripletriad.cardListImgClicked);
        $('.card-page-number', $block).click(gt.tripletriad.pageClicked);
    },

    getViewModel: function(obj, data){
        return {
            id: 'tripletriad',
            type: 'tripletriad',
            name: '九宫幻卡图鉴',
            template: gt.tripletriad.blockTemplate,
            blockClass: 'early tool large item tripletriad',
            icon: gt.tripletriad.cardIcons["1"],
            subheader: '工具',
            tool: 1,
            settings: 1,
            current: this.current,
            currentPage: this.currentPage,
            total: this.total,
            totalPages: this.totalPages,
            collected: Object.keys(gt.settings.data.collectedCards).length,
            firstCollected: this.isCardCollected(1)
        };
    },

    getXivNumber: function (number){
        let str = number.toString();
        if (number > 20)
            return str;

        return "<i class='xiv number-" + str + "'></i>";
    },

    // Make sure it always generate 5 numbers and select the right one.
    generatePageList: function(currentPage){
        currentPage = parseInt(currentPage);
        let selectedOffset = 3;

        if (currentPage < 3)
            selectedOffset = currentPage;
        else if (currentPage > this.totalPages - 2)
            selectedOffset = 5 - this.totalPages + currentPage;

        let pageList = ""
        for (let i = 1; i < selectedOffset; i++) {
            pageList = "<span data-number='"+ (currentPage - i).toString() + "' class='card-page-number'>"  + this.getXivNumber(currentPage - i) + "</span>" + pageList;
        }
        pageList += "<span data-number='"+ currentPage.toString() + "' class='card-page-number selected'>" + this.getXivNumber(currentPage) + "</span>";
        for (let i = 1; i <= 5 - selectedOffset; i++){
            pageList += "<span data-number='"+ (currentPage + i).toString() + "' class='card-page-number'>" + this.getXivNumber(currentPage + i) + "</span>";
        }

        return "<span class='left-arrow card-page-number' data-number='1'></span>" + pageList + "<span class='right-arrow card-page-number' data-number='" + this.totalPages + "'></span>";
    },

    getCard: function (displayId, extra){
        displayId = displayId.toString();
        let set = this.cards;
        if (extra){
            set = this.extraCards;
        }

        let card = set[displayId];
        if (card.tripletriad.displayId.toString() === displayId)
            return card;
        else {
            for (let i = 0; i < set.length; i++){
                if (set[i].tripletriad.displayId.toString() === displayId)
                    return set[i];
            }
        }

        return null;
    },

    getCardIcon: function(card, extra){
        let id = "unknown";
        if (this.isCardCollected(card.tripletriad.id))
            id = card.tripletriad.icon;
        else if (extra)
            id += "_extra";
        return "../files/icons/triad/icon/" + id + ".png";
    },

    isCardCollected: function (id){
        id = id.toString();
        return gt.settings.data.collectedCards[id];
    },

    setCardCollected: function (id, $block){
        id = id.toString();
        let result;
        if (this.isCardCollected(id)){
            delete gt.settings.data.collectedCards[id];
            result = false;
        }else {
            gt.settings.data.collectedCards[id] = true;
        }
        gt.settings.saveDirty();
        $(".tripletriad-collected", $block).html("总计 " + Object.keys(gt.settings.data.collectedCards).length + "/" + gt.tripletriad.total);
        return result;
    },

    isNpcPlayed: function (id){
        id = id.toString();
        return gt.settings.data.playedCardNpcs[id];
    },

    setNpcPlayed: function (id){
        id = id.toString();
        let result;
        if (this.isNpcPlayed(id)){
            delete gt.settings.data.playedCardNpcs[id];
            result = false;
        } else {
            gt.settings.data.playedCardNpcs[id] = true;
        }
        gt.settings.saveDirty();
        return result;
    },

    generateList: function (page, position){
        // there are 6 rows and 5 columns of card in game.
        // As I am trying to repaint the UI in game then let's draw it as the same one.

        let offset;
        let extra = false;
        if (page > this.totalCommonPages){
            offset = (page - this.totalCommonPages - 1) * 30;
            extra = true;
        } else {
            offset = (page - 1) * 30;
        }
        let result = "";
        for (let i = 0; i < 6; i++){
            result += "<div class=\"tripletriad-list-row\">"
            for (let j = 0; j < 5; j++){
                let pos = 5 * i + j + 1;
                let displayId = offset + pos;
                if (extra){
                    if (displayId > this.totalExtra)
                        continue;
                } else {
                    if (displayId > this.totalCommon)
                        continue;
                }

                let card = this.getCard(displayId, extra);
                if (pos !== parseInt(position))
                    result += "<img src=\"" + gt.tripletriad.getCardIcon(card, extra) + "\" width=\"40px\" class=\"card icon pointer\" data-id='" + displayId + "' data-number='" + pos +"'>"
                else {
                    result += "<img src=\"" + gt.tripletriad.getCardIcon(card, extra) + "\" width=\"40px\" class=\"card icon pointer selected\" data-id='" + displayId + "' data-number='" + pos +"'>"
                    this.buildCurrent(card);
                }
            }
            result += "</div>"
        }
        //this.changeSelectedCard($(this).closest(".block.tripletriad"), position);

        return result;
    },

    collectModeClicked: function(e) {
        gt.tripletriad.collectMode = $(this).prop('checked');
    },

    collectItClicked: function (e) {
        let $block = $(this).closest(".block.tripletriad");
        gt.tripletriad.setCardCollected(gt.tripletriad.current.id);
        $(".tripletriad-list-row .selected", $block).attr("src", gt.tripletriad.getCardIcon(gt.tripletriad.current.obj, gt.tripletriad.current.extra));
        gt.tripletriad.verifyCollectButton($(this))
    },

    verifyCollectButton: function ($button) {
        if (this.isCardCollected(this.current.id)){
            $button.html(this.spanCollected);
        }
        else $button.html(this.spanNotCollected);
    },

    // Trigger when choosing a card in the list
    // need to alter the current selected card
    cardListImgClicked: function (e) {
        // find clicked block
        var displayId = $(this).attr("data-id");
        var pos = $(this).attr("data-number");
        var block = $(this).closest(".block.tripletriad");
        gt.tripletriad.buildCurrent(gt.tripletriad.getCard(displayId, gt.tripletriad.currentPage > gt.tripletriad.totalCommonPages));
        gt.tripletriad.changeSelectedCard(pos, block);

        if (gt.tripletriad.collectMode){
            gt.tripletriad.setCardCollected(gt.tripletriad.current.id);
            $(this).attr("src", gt.tripletriad.getCardIcon(gt.tripletriad.current.obj, gt.tripletriad.current.extra));
            gt.tripletriad.verifyCollectButton($("#tripletriad-collect", block));
        }
    },

    changeSelectedCard: function (pos, block){
        // set selected effect
        if ($(".tripletriad-list-row .selected", block))
            $(".tripletriad-list-row .selected", block).removeClass("selected");
        $(".tripletriad-list-row [data-number='"+ pos +"']", block).addClass("selected");

        // change display card and jumping item block
        $(".tripletriad-card-container", block).html(this.cardTemplate(this.current));
        $(".tripletriad-card-container", block).attr("data-id", this.current.itemId);
        $(".tripletriad-card-container", block).attr("data-type", "item");
        gt.tripletriad.verifyCollectButton($("#tripletriad-collect", block));

        // set all the information
        let info = $(".tripletriad-card-info", block);
        $(".tripletriad-card-number", info).html(this.current.extra ?
            "编号外 " + this.current.displayId : "编号 " + this.current.displayId);
        $(".card-name", info).html(this.current.name);
        $(".card-description", info).html(this.current.description);
        $(".sources-uses-page", info).html(this.cardSourceTemplate(this.current));

        // finally rebind all events
        $('.block-link', block).click(gt.core.blockLinkClicked);
        $('.tripletriad-card', block).data('id', this.current.itemId)
        gt.display.collapsible(block);
    },

    // When a page number is clicked...
    pageClicked: function (e) {
        // First get the destination, clicked block, and which card is selected currently
        var dest = $(this).attr("data-number");
        var $block = $(this).closest(".block.tripletriad");
        var pos = $(".tripletriad-list-row .selected", $block).attr("data-number");

        pos = gt.tripletriad.getLastIndex(dest, pos);
        // Regenerate page list and card list
        $(".page-selector", $block).html(gt.tripletriad.generatePageList(dest));
        $(".tripletriad-list-container", $block).html(gt.tripletriad.generateList(dest, pos));

        // Finally change the selected card information
        gt.tripletriad.changeSelectedCard(pos, $block);
        gt.tripletriad.rebindEvents($block);
    },

    getLastIndex: function (dest, pos){
        dest = parseInt(dest);
        pos = parseInt(pos);
        if (dest > this.totalCommonPages){
            dest -= this.totalCommonPages;
            let selected = (dest - 1) * 30 + pos;
            if (selected > this.totalExtra){
                return this.totalExtra % 30;
            } else return pos;
        } else {
            let selected = (dest - 1) * 30 + pos;
            if (selected > this.totalCommon){
                return this.totalCommon % 30;
            } else return pos;
        }
    },

    getIcon: function (icon){
        return "../files/icon/triad/icon/" + icon + ".png";
    },

    buildCurrent: function(data){
        // index local partials
        _.each(data.partials, function(p) {
            let cacheModule = gt[p.type];
            if (cacheModule.partialIndex)
                cacheModule.partialIndex[p.id] = p.obj;
        });

        let view = Object.assign({}, data.tripletriad);
        view.obj = data;
        let item = data.tripletriad;

        // create partial of it self
        gt["item"].partialIndex[item.itemId] = {
            i: item.itemId,
            n: "九宫幻卡：" + item.name,
            l: item.ilvl,
            c: item.extra ? this.iconIds[0] : this.iconIds[item.rarity],
            t: item.category,
        };

        // This is copied from item.js and removed useless things
        // be sure to update it when item.js also updates.

        var itemSettings = gt.settings.getItem(item.itemId);

        gt.item.fillShops(view, item);

        // Drops
        if (item.drops) {
            view.drops = gt.model.partialList(gt.mob, item.drops);
            view.drops = _.sortBy(view.drops, function(m) { return (m.quest ? 'zz' : '') + m.name; });
        }

        // Instances
        if (item.instances) {
            view.instances = gt.model.partialList(gt.instance, item.instances);
            view.instances = _.sortBy(view.instances, function(i) { return i.name; });
        }

        // Quest Rewards
        if (item.quests)
            view.quests = gt.model.partialList(gt.quest, item.quests);

        // Leves
        if (item.leves) {
            view.leves = gt.model.partialList(gt.leve, item.leves);
            view.leves = _.sortBy(view.leves, function(l) { return l.lvl + ' ' + l.location + ' ' + l.name; });
        }

        // Other unlocks
        if (item.unlockId)
            view.unlockItem = gt.model.partial(gt.item, item.unlockId);

        // Used in Quests
        if (item.usedInQuest)
            view.usedInQuest = gt.model.partialList(gt.quest, item.usedInQuest);

        // Unlocks
        if (item.unlocks)
            view.unlocks = gt.model.partialList(gt.item, item.unlocks);

        // Leve Requirements
        if (item.requiredByLeves)
            view.requiredByLeves = gt.model.partialList(gt.leve, item.requiredByLeves);


        // Ventures
        if (item.ventures)
            view.ventures = gt.model.partialList(gt.venture, item.ventures);

        // Treasure Map Loot
        if (item.loot)
            view.loot = gt.model.partialList(gt.item, item.loot);

        // Aetherial Reduction
        view.reduceTotal = 0;

        if (item.reducedFrom) {
            view.reducedFrom = gt.model.partialList(gt.item, item.reducedFrom);
            view.reduceTotal += view.reducedFrom.length;
        }

        if (item.reducesTo) {
            view.reducesTo = gt.model.partialList(gt.item, item.reducesTo);
            view.reduceTotal += view.reducesTo.length;
        }

        // Other Sources
        if (item.bingoReward)
            view.other = _.union(view.other, [gt.model.partial(gt.item, 'wondroustails')]);

        if (item.desynthedFrom && item.desynthedFrom.length)
            view.other = _.union(view.other, gt.model.partialList(gt.item, item.desynthedFrom, function(v) { v.right = '分解'; return v; }));

        if (item.achievements)
            view.other = _.union(view.other, _.map(gt.model.partialList(gt.achievement, item.achievements), function(i) { return $.extend(i, {right: '成就'}); }));

        if (item.voyages)
            view.other = _.union(view.other, _.map(item.voyages, function(s) { return { name: s, icon: 'images/Voyage.png', right: '部队探险' }; }));

        if (item.treasure)
            view.other = _.union(view.other, _.map(gt.model.partialList(gt.item, item.treasure), function(i) { return $.extend(i, {right: '掉落'}); }));

        if (item.fates)
            view.other = _.union(view.other, gt.model.partialList(gt.fate, item.fates));

        // Satisfaction
        if (item.satisfaction) {
            view.satisfaction = [];
            for (var i = 0; i < item.satisfaction.length; i++) {
                var satisfaction = item.satisfaction[i];
                view.satisfaction.push({
                    npc: gt.model.partial(gt.npc, satisfaction.npc),
                    rating: satisfaction.rating,
                    probability: satisfaction.probability,
                    items: gt.model.partialList(gt.item, satisfaction.items, function(v, i) { v.amount = i.amount; return v; }),
                    gil: satisfaction.gil,
                    satisfaction: satisfaction.satisfaction,
                    level: satisfaction.level
                });
            }
        }

        // Triple Triad Reward From
        if (item.rewardFrom)
            view.tripletriadReward = gt.model.partialList(gt.npc, item.rewardFrom);

        // Source data
        if (itemSettings.sourceType) {
            view.sourceType = itemSettings.sourceType;
            view.sourceId = itemSettings.sourceId;
        }

        // Marketboard price
        if (itemSettings.marketPrice) {
            view.marketPrice = itemSettings.marketPrice;

            if (itemSettings.sourceType == 'market')
                view.marketType = '购买';
            else
                view.marketType = '卖出';
        }

        // Bingo
        if (item.bingoData) {
            view.bingoData = [];
            for (var i = 0; i < item.bingoData.length; i++) {
                var list = item.bingoData[i];
                var viewList = { name: list.name, rewards: [] };
                for (var ii = 0; ii < list.rewards.length; ii++) {
                    var options = _.map(list.rewards[ii], function(o) { return { item: gt.model.partial(gt.item, o.item), amount: o.amount, hq: o.hq }; });
                    viewList.rewards.push(options);
                }
                view.bingoData.push(viewList);
            }
        }

        // Disposal
        if (item.disposal) {
            view.disposal = [];
            for (var i = 0; i < item.disposal.length; i++) {
                var entry = $.extend({}, item.disposal[i]);
                entry.item = gt.model.partial(gt.item, entry.item);
                entry.npcs = gt.model.partialList(gt.npc, entry.npcs);
                view.disposal.push(entry);
            }
        }

        view.hasSourcesUses = (view.vendors || view.drops || view.nodes || view.fishingSpots || view.instances
            || view.trades || view.quests || view.leves || view.ventures || view.requiredByLeves
            || view.unlocks || view.usedInQuest || view.ingredient_of || view.loot
            || view.masterpiece || view.supply || view.delivery || view.bingoData || view.other
            || view.satisfaction || view.customize || view.reducedFrom || view.disposal || view.tripletriadReward
            || view.sell_price || view.supplyReward || (!view.unlistable && !view.untradeable) || view.reducesTo
            || view.gardening);


        this.current = view;

        if (view.extra){
            this.currentPage = this.totalCommonPages + Math.ceil(this.current.displayId / 30);
        } else {
            this.currentPage = Math.ceil(this.current.displayId / 30);
        }
    },
};